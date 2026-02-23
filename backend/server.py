from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'lacleo-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Kimi API Configuration
KIMI_API_KEY = os.environ.get('KIMI_API_KEY', '')
KIMI_BASE_URL = os.environ.get('KIMI_BASE_URL', 'https://api.moonshot.ai/v1')
KIMI_MODEL = os.environ.get('KIMI_MODEL', 'kimi-k2-0711-preview')

# Clearbit API Configuration
CLEARBIT_API_KEY = os.environ.get('CLEARBIT_API_KEY', '')

app = FastAPI(title="LaCleo AI API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LeadGenerationRequest(BaseModel):
    prompt: str = Field(min_length=10)
    industry: Optional[str] = None
    company_size: Optional[str] = None
    geography: Optional[str] = None
    num_leads: int = Field(default=10, ge=1, le=50)

class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    industry: str
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    employees: Optional[str] = None
    revenue: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    decision_maker: Optional[str] = None
    decision_maker_title: Optional[str] = None
    pain_points: List[str] = []
    lead_score: int = Field(default=0, ge=0, le=100)
    enriched: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeadListResponse(BaseModel):
    leads: List[Lead]
    total: int
    prompt: str

class EnrichmentRequest(BaseModel):
    company_name: str
    domain: Optional[str] = None

class EnrichmentResponse(BaseModel):
    company_name: str
    description: str
    industry: str
    employees: Optional[str] = None
    revenue: Optional[str] = None
    founded: Optional[str] = None
    location: Optional[str] = None
    technologies: List[str] = []
    social_links: dict = {}

class SavedSearch(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    prompt: str
    filters: dict = {}
    leads_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== KIMI AI SERVICE ====================

async def generate_leads_with_kimi(request: LeadGenerationRequest) -> List[dict]:
    """Generate leads using Kimi AI or fallback to mock data"""
    
    if KIMI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                system_message = """You are an expert B2B lead generation specialist. Generate realistic, detailed lead information for sales outreach.
                Always respond with valid JSON array containing lead objects."""
                
                prompt = f"""Generate {request.num_leads} highly qualified B2B leads based on this criteria:
User Request: {request.prompt}
{f'Industry Focus: {request.industry}' if request.industry else ''}
{f'Company Size: {request.company_size}' if request.company_size else ''}
{f'Geography: {request.geography}' if request.geography else ''}

For each lead, provide a JSON object with these fields:
- company_name: Company name
- industry: Industry classification
- website: Company website URL
- email: Business contact email
- phone: Business phone
- employees: Employee count range
- revenue: Estimated annual revenue
- location: City, Country
- description: Brief company description
- decision_maker: Key decision maker name
- decision_maker_title: Their job title
- pain_points: Array of 2-3 relevant pain points
- lead_score: Quality score 1-100

Return ONLY a valid JSON array, no markdown or extra text."""

                response = await client.post(
                    f"{KIMI_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {KIMI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": KIMI_MODEL,
                        "messages": [
                            {"role": "system", "content": system_message},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 4096
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    # Extract JSON from response
                    content = content.strip()
                    if content.startswith("```"):
                        content = content.split("```")[1]
                        if content.startswith("json"):
                            content = content[4:]
                    leads = json.loads(content)
                    return leads
        except Exception as e:
            logger.error(f"Kimi API error: {e}")
    
    # Fallback to mock data
    return generate_mock_leads(request)

def generate_mock_leads(request: LeadGenerationRequest) -> List[dict]:
    """Generate mock leads when API is unavailable"""
    
    industries = ["SaaS", "E-commerce", "FinTech", "HealthTech", "EdTech", "MarTech", "HR Tech", "Cybersecurity"]
    companies = [
        ("TechFlow Solutions", "SaaS", "San Francisco, USA", "techflow.io"),
        ("DataDrive Analytics", "Analytics", "New York, USA", "datadrive.com"),
        ("CloudScale Pro", "Cloud Infrastructure", "Austin, USA", "cloudscale.pro"),
        ("SmartHire AI", "HR Tech", "Boston, USA", "smarthire.ai"),
        ("PayStream Finance", "FinTech", "Chicago, USA", "paystream.finance"),
        ("HealthPulse Digital", "HealthTech", "Seattle, USA", "healthpulse.digital"),
        ("LearnPath Academy", "EdTech", "Denver, USA", "learnpath.academy"),
        ("SecureNet Systems", "Cybersecurity", "Miami, USA", "securenet.systems"),
        ("GrowthLab Marketing", "MarTech", "Los Angeles, USA", "growthlab.marketing"),
        ("RetailBoost Commerce", "E-commerce", "Atlanta, USA", "retailboost.com"),
        ("InnovateTech Labs", "R&D", "Portland, USA", "innovatetech.labs"),
        ("AgileOps Platform", "DevOps", "Phoenix, USA", "agileops.platform"),
        ("CustomerFirst CRM", "CRM", "Dallas, USA", "customerfirst.crm"),
        ("VirtualSpace VR", "Virtual Reality", "San Diego, USA", "virtualspace.vr"),
        ("GreenEnergy Solutions", "CleanTech", "Sacramento, USA", "greenenergy.solutions"),
    ]
    
    decision_makers = [
        ("Sarah Johnson", "VP of Sales"),
        ("Michael Chen", "Chief Revenue Officer"),
        ("Emily Rodriguez", "Director of Growth"),
        ("David Kim", "Head of Business Development"),
        ("Jennifer Lee", "Chief Marketing Officer"),
        ("Robert Taylor", "VP of Operations"),
        ("Amanda White", "Director of Partnerships"),
        ("James Wilson", "CEO"),
        ("Lisa Brown", "Head of Procurement"),
        ("Christopher Davis", "Chief Technology Officer"),
    ]
    
    pain_points_list = [
        ["Inefficient lead qualification", "Low conversion rates", "Manual data entry"],
        ["Scattered customer data", "Poor sales visibility", "Slow response times"],
        ["High customer acquisition cost", "Limited market reach", "Outdated contact data"],
        ["Complex sales cycles", "Lack of automation", "Inconsistent messaging"],
        ["Poor lead scoring", "Missed opportunities", "Siloed teams"],
    ]
    
    leads = []
    num = min(request.num_leads, len(companies))
    
    for i in range(num):
        company = companies[i]
        dm = decision_makers[i % len(decision_makers)]
        pain = pain_points_list[i % len(pain_points_list)]
        
        employees_options = ["10-50", "50-200", "200-500", "500-1000", "1000+"]
        revenue_options = ["$1M-$5M", "$5M-$20M", "$20M-$50M", "$50M-$100M", "$100M+"]
        
        lead = {
            "company_name": company[0],
            "industry": company[1] if not request.industry else request.industry,
            "website": f"https://{company[3]}",
            "email": f"contact@{company[3]}",
            "phone": f"+1 (555) {100 + i:03d}-{1000 + i * 7:04d}",
            "employees": employees_options[i % len(employees_options)],
            "revenue": revenue_options[i % len(revenue_options)],
            "location": company[2] if not request.geography else request.geography,
            "description": f"{company[0]} is a leading {company[1]} company providing innovative solutions for businesses worldwide.",
            "decision_maker": dm[0],
            "decision_maker_title": dm[1],
            "pain_points": pain,
            "lead_score": 60 + (i * 3) % 40,
        }
        leads.append(lead)
    
    return leads

# ==================== CLEARBIT / ENRICHMENT SERVICE ====================

async def enrich_company_data(company_name: str, domain: Optional[str] = None) -> dict:
    """Enrich company data using Clearbit or fallback to mock"""
    
    if CLEARBIT_API_KEY and domain:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"https://company.clearbit.com/v2/companies/find?domain={domain}",
                    headers={"Authorization": f"Bearer {CLEARBIT_API_KEY}"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "company_name": data.get("name", company_name),
                        "description": data.get("description", ""),
                        "industry": data.get("category", {}).get("industry", "Technology"),
                        "employees": data.get("metrics", {}).get("employeesRange", ""),
                        "revenue": data.get("metrics", {}).get("estimatedAnnualRevenue", ""),
                        "founded": str(data.get("foundedYear", "")),
                        "location": f"{data.get('geo', {}).get('city', '')}, {data.get('geo', {}).get('country', '')}",
                        "technologies": data.get("tech", [])[:10],
                        "social_links": {
                            "linkedin": data.get("linkedin", {}).get("handle", ""),
                            "twitter": data.get("twitter", {}).get("handle", ""),
                        }
                    }
        except Exception as e:
            logger.error(f"Clearbit API error: {e}")
    
    # Mock enrichment data
    return {
        "company_name": company_name,
        "description": f"{company_name} is an innovative company focused on delivering exceptional value to their customers through cutting-edge technology solutions.",
        "industry": "Technology",
        "employees": "50-200",
        "revenue": "$10M-$50M",
        "founded": "2018",
        "location": "San Francisco, USA",
        "technologies": ["React", "Node.js", "AWS", "PostgreSQL", "Docker"],
        "social_links": {
            "linkedin": company_name.lower().replace(" ", "-"),
            "twitter": company_name.lower().replace(" ", ""),
        }
    }

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(user_id, user_data.email)
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            created_at=datetime.now(timezone.utc)
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(user["id"], user["email"])
    
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=created_at
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    created_at = current_user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=created_at
    )

# ==================== LEADS ROUTES ====================

@api_router.post("/leads/generate", response_model=LeadListResponse)
async def generate_leads(request: LeadGenerationRequest, current_user: dict = Depends(get_current_user)):
    leads_data = await generate_leads_with_kimi(request)
    
    leads = []
    for lead_data in leads_data:
        lead = Lead(
            company_name=lead_data.get("company_name", "Unknown"),
            industry=lead_data.get("industry", "Technology"),
            website=lead_data.get("website"),
            email=lead_data.get("email"),
            phone=lead_data.get("phone"),
            employees=lead_data.get("employees"),
            revenue=lead_data.get("revenue"),
            location=lead_data.get("location"),
            description=lead_data.get("description"),
            decision_maker=lead_data.get("decision_maker"),
            decision_maker_title=lead_data.get("decision_maker_title"),
            pain_points=lead_data.get("pain_points", []),
            lead_score=lead_data.get("lead_score", 50),
        )
        leads.append(lead)
        
        # Save to database
        lead_doc = lead.model_dump()
        lead_doc["user_id"] = current_user["id"]
        lead_doc["created_at"] = lead_doc["created_at"].isoformat()
        await db.leads.insert_one(lead_doc)
    
    # Save search history
    search_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "prompt": request.prompt,
        "filters": {
            "industry": request.industry,
            "company_size": request.company_size,
            "geography": request.geography
        },
        "leads_count": len(leads),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.searches.insert_one(search_doc)
    
    return LeadListResponse(leads=leads, total=len(leads), prompt=request.prompt)

@api_router.get("/leads", response_model=List[Lead])
async def get_user_leads(
    skip: int = 0,
    limit: int = 50,
    industry: Optional[str] = None,
    min_score: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}
    
    if industry:
        query["industry"] = {"$regex": industry, "$options": "i"}
    if min_score:
        query["lead_score"] = {"$gte": min_score}
    
    leads_cursor = db.leads.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1)
    leads = await leads_cursor.to_list(limit)
    
    for lead in leads:
        if isinstance(lead.get("created_at"), str):
            lead["created_at"] = datetime.fromisoformat(lead["created_at"].replace('Z', '+00:00'))
    
    return leads

@api_router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id, "user_id": current_user["id"]}, {"_id": 0})
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if isinstance(lead.get("created_at"), str):
        lead["created_at"] = datetime.fromisoformat(lead["created_at"].replace('Z', '+00:00'))
    
    return lead

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.leads.delete_one({"id": lead_id, "user_id": current_user["id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"message": "Lead deleted successfully"}

# ==================== ENRICHMENT ROUTES ====================

@api_router.post("/enrich", response_model=EnrichmentResponse)
async def enrich_company(request: EnrichmentRequest, current_user: dict = Depends(get_current_user)):
    enrichment_data = await enrich_company_data(request.company_name, request.domain)
    return EnrichmentResponse(**enrichment_data)

# ==================== SEARCH HISTORY ROUTES ====================

@api_router.get("/searches", response_model=List[SavedSearch])
async def get_search_history(
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    searches_cursor = db.searches.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).skip(skip).limit(limit).sort("created_at", -1)
    
    searches = await searches_cursor.to_list(limit)
    
    for search in searches:
        if isinstance(search.get("created_at"), str):
            search["created_at"] = datetime.fromisoformat(search["created_at"].replace('Z', '+00:00'))
    
    return searches

# ==================== STATS ROUTES ====================

@api_router.get("/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    leads_count = await db.leads.count_documents({"user_id": current_user["id"]})
    searches_count = await db.searches.count_documents({"user_id": current_user["id"]})
    
    # Get average lead score
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {"_id": None, "avg_score": {"$avg": "$lead_score"}}}
    ]
    avg_result = await db.leads.aggregate(pipeline).to_list(1)
    avg_score = avg_result[0]["avg_score"] if avg_result else 0
    
    # Get top industries
    industry_pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {"_id": "$industry", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    industries = await db.leads.aggregate(industry_pipeline).to_list(5)
    
    return {
        "total_leads": leads_count,
        "total_searches": searches_count,
        "average_lead_score": round(avg_score, 1),
        "top_industries": [{"industry": i["_id"], "count": i["count"]} for i in industries if i["_id"]]
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "LaCleo AI API v1.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
