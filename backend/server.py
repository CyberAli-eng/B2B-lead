from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json
import httpx
import csv
import io
import random

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

app = FastAPI(title="LaCleo AI API", version="2.0.0")
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
    company_website: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    company_website: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Search Types
class SearchMode(BaseModel):
    mode: str = Field(description="find_people, find_companies, scrape_websites, enrich_data, find_lookalikes")

class AISearchRequest(BaseModel):
    prompt: str = Field(min_length=5)
    mode: str = Field(default="find_people")  # find_people, find_companies, scrape_websites, enrich_data
    industry: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None
    follow_up: bool = False
    conversation_id: Optional[str] = None

class AISearchResponse(BaseModel):
    conversation_id: str
    ai_message: str
    results: List[Dict[str, Any]]
    total_found: int
    available_count: int
    columns: List[str]
    suggested_follow_ups: List[str]

class TemplateCategory(BaseModel):
    id: str
    name: str
    count: int
    templates: List[Dict[str, Any]]

class Template(BaseModel):
    id: str
    title: str
    description: str
    category: str
    prompt: str
    columns: List[str]
    sample_results: List[Dict[str, Any]]

class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    company_domain: Optional[str] = None
    company_logo: Optional[str] = None
    industry: str
    category: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    employees: Optional[str] = None
    revenue: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    contact_name: Optional[str] = None
    contact_title: Optional[str] = None
    funding: Optional[str] = None
    fit_score: int = Field(default=0, ge=0, le=100)
    signals: List[str] = []
    enriched: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    recent_news: List[str] = []

class PersonalizeRequest(BaseModel):
    website_url: str

class PersonalizeResponse(BaseModel):
    company_name: str
    industry: str
    target_personas: List[str]
    recommended_searches: List[Dict[str, str]]
    icp_signals: List[str]

class ImportCSVResponse(BaseModel):
    imported_count: int
    leads: List[Lead]

class LookalikesRequest(BaseModel):
    company_names: List[str]
    limit: int = Field(default=20, ge=1, le=100)

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

# ==================== MOCK DATA GENERATORS ====================

def get_mock_people_data(prompt: str, industry: str = None, count: int = 20) -> List[dict]:
    """Generate mock people/contact data based on search prompt"""
    
    companies = [
        ("TechFlow", "techflow.io", "SaaS", "San Francisco, USA"),
        ("DataScale", "datascale.com", "Analytics", "New York, USA"),
        ("CloudNine", "cloudnine.io", "Cloud Infrastructure", "Austin, USA"),
        ("FinanceHub", "financehub.com", "FinTech", "Chicago, USA"),
        ("HealthSync", "healthsync.io", "HealthTech", "Boston, USA"),
        ("RetailPro", "retailpro.com", "E-commerce", "Seattle, USA"),
        ("DevOpsLab", "devopslab.io", "Developer Tools", "Denver, USA"),
        ("AIVentures", "aiventures.ai", "AI/ML", "Palo Alto, USA"),
        ("CyberShield", "cybershield.io", "Cybersecurity", "Washington DC, USA"),
        ("GreenTech", "greentech.com", "CleanTech", "Portland, USA"),
        ("EduLearn", "edulearn.io", "EdTech", "Miami, USA"),
        ("PropTech", "proptech.com", "Real Estate Tech", "Los Angeles, USA"),
        ("BioMed", "biomed.io", "Biotech", "San Diego, USA"),
        ("LogiFlow", "logiflow.com", "Logistics", "Atlanta, USA"),
        ("HRFlow", "hrflow.io", "HR Tech", "Phoenix, USA"),
        ("MarketWise", "marketwise.com", "MarTech", "Dallas, USA"),
        ("PaymentPlus", "paymentplus.io", "Payments", "Charlotte, USA"),
        ("InsureTech", "insuretech.com", "InsurTech", "Hartford, USA"),
        ("TravelHub", "travelhub.io", "Travel Tech", "Orlando, USA"),
        ("FoodTech", "foodtech.com", "FoodTech", "Nashville, USA"),
    ]
    
    titles = [
        ("VP of Sales", "Sales"),
        ("Chief Revenue Officer", "Executive"),
        ("Director of Growth", "Growth"),
        ("Head of Business Development", "Sales"),
        ("Chief Marketing Officer", "Marketing"),
        ("VP of Engineering", "Engineering"),
        ("Director of Product", "Product"),
        ("Head of Partnerships", "Partnerships"),
        ("CEO", "Executive"),
        ("CTO", "Executive"),
        ("CFO", "Finance"),
        ("COO", "Operations"),
    ]
    
    first_names = ["Sarah", "Michael", "Emily", "David", "Jennifer", "Robert", "Amanda", "James", "Lisa", "Christopher", 
                   "Rachel", "Daniel", "Lauren", "Kevin", "Priya", "Nina", "Alex", "Jessica", "Brian", "Maria"]
    last_names = ["Johnson", "Chen", "Rodriguez", "Kim", "Lee", "Taylor", "White", "Wilson", "Brown", "Davis",
                  "Torres", "Patel", "Sharma", "Liu", "Thompson", "Garcia", "Martinez", "Anderson", "Thomas", "Moore"]
    
    results = []
    used_names = set()
    
    for i in range(min(count, len(companies))):
        company = companies[i]
        title_info = titles[i % len(titles)]
        
        # Generate unique name
        while True:
            first = random.choice(first_names)
            last = random.choice(last_names)
            full_name = f"{first} {last}"
            if full_name not in used_names:
                used_names.add(full_name)
                break
        
        fit_score = max(50, 98 - (i * 2) + random.randint(-3, 3))
        
        result = {
            "id": str(uuid.uuid4()),
            "fit_score": fit_score,
            "company_name": company[0],
            "company_domain": company[1],
            "company_logo": f"https://www.google.com/s2/favicons?domain={company[1]}&sz=32",
            "contact_name": full_name,
            "contact_title": title_info[0],
            "department": title_info[1],
            "industry": industry if industry else company[2],
            "location": company[3],
            "email": f"{first.lower()}.{last.lower()}@{company[1]}",
            "linkedin": f"linkedin.com/in/{first.lower()}{last.lower()}",
        }
        results.append(result)
    
    return results

def get_mock_companies_data(prompt: str, industry: str = None, count: int = 20) -> List[dict]:
    """Generate mock company data based on search prompt"""
    
    companies = [
        ("Stripe", "stripe.com", "Payments", "San Francisco, USA", "$95B", "7000+", "Series I", "$600M"),
        ("Notion", "notion.so", "Productivity", "San Francisco, USA", "$10B", "500+", "Series C", "$275M"),
        ("Figma", "figma.com", "Design", "San Francisco, USA", "$20B", "800+", "Acquired", "$200M"),
        ("Linear", "linear.app", "Developer Tools", "San Francisco, USA", "$400M", "50+", "Series B", "$35M"),
        ("Vercel", "vercel.com", "Cloud Infrastructure", "San Francisco, USA", "$2.5B", "400+", "Series D", "$150M"),
        ("Datadog", "datadoghq.com", "Observability", "New York, USA", "$30B", "5000+", "Public", "$648M"),
        ("Snowflake", "snowflake.com", "Data Cloud", "Bozeman, USA", "$50B", "6000+", "Public", "$479M"),
        ("Plaid", "plaid.com", "FinTech", "San Francisco, USA", "$13.4B", "1000+", "Series D", "$425M"),
        ("Airtable", "airtable.com", "No-Code", "San Francisco, USA", "$11B", "800+", "Series F", "$735M"),
        ("Retool", "retool.com", "Internal Tools", "San Francisco, USA", "$3.2B", "400+", "Series C", "$45M"),
        ("Ramp", "ramp.com", "FinTech", "New York, USA", "$8.1B", "700+", "Series D", "$300M"),
        ("Mercury", "mercury.com", "Banking", "San Francisco, USA", "$1.6B", "400+", "Series C", "$152M"),
        ("Deel", "deel.com", "HR Tech", "San Francisco, USA", "$12B", "2000+", "Series D", "$425M"),
        ("Rippling", "rippling.com", "HR Tech", "San Francisco, USA", "$11.25B", "2000+", "Series E", "$500M"),
        ("Brex", "brex.com", "FinTech", "San Francisco, USA", "$12.3B", "1100+", "Series D", "$300M"),
        ("Loom", "loom.com", "Video", "San Francisco, USA", "$1.5B", "200+", "Acquired", "$130M"),
        ("Calendly", "calendly.com", "Scheduling", "Atlanta, USA", "$3B", "500+", "Series B", "$350M"),
        ("Miro", "miro.com", "Collaboration", "San Francisco, USA", "$17.5B", "1800+", "Series C", "$400M"),
        ("Canva", "canva.com", "Design", "Sydney, Australia", "$40B", "4000+", "Private", "$200M"),
        ("Webflow", "webflow.com", "No-Code", "San Francisco, USA", "$4B", "600+", "Series C", "$120M"),
    ]
    
    results = []
    for i in range(min(count, len(companies))):
        company = companies[i]
        fit_score = max(55, 97 - (i * 2) + random.randint(-2, 2))
        
        result = {
            "id": str(uuid.uuid4()),
            "fit_score": fit_score,
            "company_name": company[0],
            "company_domain": company[1],
            "company_logo": f"https://www.google.com/s2/favicons?domain={company[1]}&sz=32",
            "industry": industry if industry else company[2],
            "location": company[3],
            "valuation": company[4],
            "employees": company[5],
            "funding_stage": company[6],
            "total_raised": company[7],
            "website": f"https://{company[1]}",
        }
        results.append(result)
    
    return results

def get_mock_template_results(template_id: str) -> List[dict]:
    """Get mock results for a specific template"""
    
    template_data = {
        "find-ma-plans": [
            {"fit_score": 97, "plan_name": "Molina Complete Care", "parent_org": "Molina Healthcare", "star_rating": 2.5, "members": "450K"},
            {"fit_score": 95, "plan_name": "Aetna Better Health", "parent_org": "CVS Health", "star_rating": 3.0, "members": "1.2M"},
            {"fit_score": 93, "plan_name": "Alignment Health Plan", "parent_org": "Alignment Healthcare", "star_rating": 3.0, "members": "180K"},
            {"fit_score": 91, "plan_name": "Bright Health Medicare", "parent_org": "Bright Health", "star_rating": 2.5, "members": "95K"},
            {"fit_score": 89, "plan_name": "Humana Gold Plus", "parent_org": "Humana Inc.", "star_rating": 3.5, "members": "2.5M"},
        ],
        "find-funded-fintechs": [
            {"fit_score": 96, "company": "Rain", "segment": "Wage Access", "funding": "$75M", "stage": "Series B"},
            {"fit_score": 94, "company": "Clair", "segment": "Wage Access", "funding": "$23M", "stage": "Series A"},
            {"fit_score": 92, "company": "Monarch", "segment": "Personal Finance", "funding": "$75M", "stage": "Series B"},
            {"fit_score": 90, "company": "Upgrade", "segment": "Consumer Lending", "funding": "$165M", "stage": "Series D"},
            {"fit_score": 88, "company": "Aven", "segment": "Home Equity", "funding": "$110M", "stage": "Series C"},
        ],
        "find-yc-founders": [
            {"fit_score": 97, "company": "Burt", "founder": "Kurt Sharma", "batch": "W26", "category": "AI/ML"},
            {"fit_score": 95, "company": "21st", "founder": "Serafim Korablev", "batch": "W26", "category": "Developer Tools"},
            {"fit_score": 93, "company": "Sparkles", "founder": "Daniil Bekirov", "batch": "W26", "category": "Developer Tools"},
            {"fit_score": 91, "company": "Traverse", "founder": "Lance Yan", "batch": "W26", "category": "AI/ML"},
            {"fit_score": 89, "company": "Tensol", "founder": "Oliviero Pinotti", "batch": "W26", "category": "AI Agents"},
        ],
    }
    
    return template_data.get(template_id, get_mock_people_data("general search", count=10))

# ==================== AI SEARCH SERVICE ====================

async def process_ai_search(request: AISearchRequest, user_id: str) -> AISearchResponse:
    """Process AI search request and return structured results"""
    
    conversation_id = request.conversation_id or str(uuid.uuid4())
    
    # Determine search type and generate appropriate mock data
    if request.mode == "find_companies":
        results = get_mock_companies_data(request.prompt, request.industry)
        columns = ["Fit Score", "Company", "Industry", "Location", "Valuation", "Employees", "Funding"]
        ai_message = f"Found {len(results)} companies matching your criteria. Results are sorted by fit score — I've included company details, valuation, and funding information."
    elif request.mode == "find_people":
        results = get_mock_people_data(request.prompt, request.industry)
        columns = ["Fit Score", "Company", "Contact", "Title", "Location", "Email"]
        ai_message = f"Found {len(results)} contacts matching your criteria. Results are sorted by relevance — I've included contact details and company information."
    else:
        results = get_mock_people_data(request.prompt, request.industry, 15)
        columns = ["Fit Score", "Company", "Contact", "Title", "Location"]
        ai_message = f"Here are {len(results)} prospects matching your search. I've ranked them by fit score based on your criteria."
    
    # Generate suggested follow-ups based on the search
    suggested_follow_ups = [
        "Show me only companies with 100+ employees",
        "Filter by companies that raised Series B or later",
        "Find contacts in the marketing department only",
        "Show companies headquartered in California",
        "Export these results to CSV",
    ]
    
    # Save conversation to database
    conversation_doc = {
        "id": conversation_id,
        "user_id": user_id,
        "prompt": request.prompt,
        "mode": request.mode,
        "results_count": len(results),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": conversation_doc},
        upsert=True
    )
    
    return AISearchResponse(
        conversation_id=conversation_id,
        ai_message=ai_message,
        results=results,
        total_found=len(results),
        available_count=len(results) * 15,  # Simulated "get more" count
        columns=columns,
        suggested_follow_ups=suggested_follow_ups[:3]
    )

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "company_website": user_data.company_website,
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
            company_website=user_data.company_website,
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
            company_website=user.get("company_website"),
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
        company_website=current_user.get("company_website"),
        created_at=created_at
    )

# ==================== AI SEARCH ROUTES ====================

@api_router.post("/search", response_model=AISearchResponse)
async def ai_search(request: AISearchRequest, current_user: dict = Depends(get_current_user)):
    """Main AI-powered search endpoint"""
    return await process_ai_search(request, current_user["id"])

@api_router.post("/search/follow-up", response_model=AISearchResponse)
async def search_follow_up(request: AISearchRequest, current_user: dict = Depends(get_current_user)):
    """Handle follow-up questions in conversation"""
    request.follow_up = True
    return await process_ai_search(request, current_user["id"])

# ==================== TEMPLATES ROUTES ====================

@api_router.get("/templates/categories")
async def get_template_categories():
    """Get all template categories"""
    categories = [
        {"id": "popular", "name": "Popular", "count": 13, "icon": "star"},
        {"id": "healthcare", "name": "Healthcare", "count": 41, "icon": "heart"},
        {"id": "fintech", "name": "Fintech", "count": 25, "icon": "dollar"},
        {"id": "ecommerce", "name": "E-commerce", "count": 20, "icon": "shopping-cart"},
        {"id": "biotech", "name": "Biotech", "count": 17, "icon": "flask"},
        {"id": "proptech", "name": "Proptech", "count": 14, "icon": "building"},
        {"id": "hospitality", "name": "Hospitality", "count": 17, "icon": "hotel"},
        {"id": "logistics", "name": "Logistics & Supply Chain", "count": 18, "icon": "truck"},
        {"id": "manufacturing", "name": "Manufacturing", "count": 9, "icon": "factory"},
        {"id": "nonprofit", "name": "Nonprofit & Social Impact", "count": 12, "icon": "heart-handshake"},
        {"id": "saas", "name": "SaaS", "count": 23, "icon": "cloud"},
        {"id": "ai", "name": "AI/ML", "count": 19, "icon": "brain"},
    ]
    return categories

@api_router.get("/templates")
async def get_templates(category: Optional[str] = None):
    """Get templates, optionally filtered by category"""
    templates = [
        {
            "id": "find-vps-sales-series-b",
            "title": "Find VPs of Sales at Series B Companies",
            "description": "Search for VP-level sales executives at companies that recently raised Series B funding. Perfect for selling sales tools, training, or consulting services.",
            "category": "popular",
            "prompt": "Find VPs of Sales at SaaS companies that just raised Series B",
            "columns": ["Fit Score", "Company", "Contact", "Title", "Funding"],
        },
        {
            "id": "find-yc-founders",
            "title": "Find YC Founders by Batch",
            "description": "Search for Y Combinator founders by batch and category. Great for B2B sales targeting high-growth startups.",
            "category": "popular",
            "prompt": "Find YC W26 founders building in AI and developer tools",
            "columns": ["Fit Score", "Company", "Founder", "Batch", "Category"],
        },
        {
            "id": "find-ma-plans",
            "title": "Find MA Plans by Star Rating",
            "description": "Search for Medicare Advantage plans by their current CMS Star Ratings. Identify plans with low or declining ratings.",
            "category": "healthcare",
            "prompt": "Find Medicare Advantage plans with star rating below 3.5",
            "columns": ["Fit Score", "Plan Name", "Parent Org", "Star Rating", "Members"],
        },
        {
            "id": "find-healthcare-new-leadership",
            "title": "Find Healthcare Orgs with New Leadership",
            "description": "Search for healthcare organizations with recent executive changes. New leaders bring new priorities and vendor evaluations.",
            "category": "healthcare",
            "prompt": "Find healthcare organizations with new C-suite executives in the last 6 months",
            "columns": ["Fit Score", "Organization", "Contact", "Title", "Start Date"],
        },
        {
            "id": "find-funded-fintechs",
            "title": "Find Recently Funded Fintechs",
            "description": "Search for fintech companies that have recently raised capital. Funded fintechs invest aggressively in technology and growth.",
            "category": "fintech",
            "prompt": "Find fintech companies that raised funding in the last 6 months",
            "columns": ["Fit Score", "Company", "Segment", "Funding", "Stage"],
        },
        {
            "id": "find-fast-growing-fintechs",
            "title": "Find Fast-Growing Fintechs",
            "description": "Search for fintech companies showing strong growth signals. Rapid growth drives infrastructure scaling and technology investment.",
            "category": "fintech",
            "prompt": "Find fintech companies with 100%+ YoY growth",
            "columns": ["Fit Score", "Company", "Contact", "Title", "Growth Rate"],
        },
        {
            "id": "find-stores-migrating",
            "title": "Find Stores Migrating Platforms",
            "description": "Search for e-commerce brands migrating between platforms. Platform migrations create demand for apps and integrations.",
            "category": "ecommerce",
            "prompt": "Find e-commerce brands migrating from Magento to Shopify",
            "columns": ["Fit Score", "Brand", "From", "To", "Revenue"],
        },
        {
            "id": "find-dtc-brands-scaling",
            "title": "Find DTC Brands Scaling Retail",
            "description": "Search for direct-to-consumer brands expanding into retail channels. These brands need retail-specific solutions.",
            "category": "ecommerce",
            "prompt": "Find DTC brands launching in Target or Walmart",
            "columns": ["Fit Score", "Brand", "Category", "Retailers", "Revenue"],
        },
        {
            "id": "find-biotech-clinical-trials",
            "title": "Find Biotech in Clinical Trials",
            "description": "Search for biotech companies with active clinical trials. Clinical stage companies have specific vendor needs.",
            "category": "biotech",
            "prompt": "Find biotech companies with Phase 2 or Phase 3 clinical trials",
            "columns": ["Fit Score", "Company", "Therapeutic Area", "Phase", "Pipeline"],
        },
        {
            "id": "find-proptech-expanding",
            "title": "Find Proptech Companies Expanding",
            "description": "Search for proptech companies expanding into new markets. Expansion creates demand for local services and integrations.",
            "category": "proptech",
            "prompt": "Find proptech companies expanding into new geographic markets",
            "columns": ["Fit Score", "Company", "Segment", "Markets", "Funding"],
        },
    ]
    
    if category:
        templates = [t for t in templates if t["category"] == category]
    
    return templates

@api_router.get("/templates/{template_id}")
async def get_template_details(template_id: str):
    """Get template details with sample results"""
    templates = await get_templates()
    template = next((t for t in templates if t["id"] == template_id), None)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Add sample results
    template["sample_results"] = get_mock_template_results(template_id)
    return template

@api_router.post("/templates/{template_id}/run", response_model=AISearchResponse)
async def run_template(template_id: str, current_user: dict = Depends(get_current_user)):
    """Execute a template search"""
    templates = await get_templates()
    template = next((t for t in templates if t["id"] == template_id), None)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    request = AISearchRequest(
        prompt=template["prompt"],
        mode="find_people" if "Contact" in template["columns"] else "find_companies"
    )
    
    return await process_ai_search(request, current_user["id"])

# ==================== PERSONALIZATION ROUTES ====================

@api_router.post("/personalize", response_model=PersonalizeResponse)
async def personalize_for_website(request: PersonalizeRequest, current_user: dict = Depends(get_current_user)):
    """Analyze website and provide personalized recommendations"""
    
    domain = request.website_url.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
    
    # Mock personalization response
    response = PersonalizeResponse(
        company_name=domain.split(".")[0].title(),
        industry="SaaS",
        target_personas=[
            "VP of Sales",
            "Head of Growth",
            "Director of Marketing",
            "Chief Revenue Officer"
        ],
        recommended_searches=[
            {"title": f"Find companies similar to {domain}", "prompt": f"Find companies similar to {domain} in the B2B SaaS space"},
            {"title": "Find decision makers at target accounts", "prompt": "Find VPs and Directors at mid-market SaaS companies"},
            {"title": "Find recently funded competitors", "prompt": "Find SaaS companies that raised Series A-C in the last year"},
        ],
        icp_signals=[
            "Recently raised Series B or later",
            "Hiring for sales roles",
            "Using competitor tools",
            "Expanding into new markets"
        ]
    )
    
    return response

# ==================== IMPORT/EXPORT ROUTES ====================

@api_router.post("/import/csv")
async def import_csv(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Import leads from CSV file"""
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported_leads = []
    for row in reader:
        lead = {
            "id": str(uuid.uuid4()),
            "company_name": row.get("company", row.get("Company", row.get("company_name", "Unknown"))),
            "contact_name": row.get("name", row.get("Name", row.get("contact_name", "")),
            "contact_title": row.get("title", row.get("Title", row.get("contact_title", "")),
            "email": row.get("email", row.get("Email", "")),
            "industry": row.get("industry", row.get("Industry", "Unknown")),
            "location": row.get("location", row.get("Location", "")),
            "fit_score": 75,
            "user_id": current_user["id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        imported_leads.append(lead)
        await db.leads.insert_one(lead)
    
    return {"imported_count": len(imported_leads), "message": f"Successfully imported {len(imported_leads)} leads"}

@api_router.post("/lookalikes", response_model=AISearchResponse)
async def find_lookalikes(request: LookalikesRequest, current_user: dict = Depends(get_current_user)):
    """Find similar companies based on input companies"""
    
    search_request = AISearchRequest(
        prompt=f"Find companies similar to {', '.join(request.company_names[:3])}",
        mode="find_companies"
    )
    
    return await process_ai_search(search_request, current_user["id"])

# ==================== LEADS MANAGEMENT ====================

@api_router.get("/leads")
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
        query["fit_score"] = {"$gte": min_score}
    
    leads_cursor = db.leads.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1)
    leads = await leads_cursor.to_list(limit)
    
    return leads

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.leads.delete_one({"id": lead_id, "user_id": current_user["id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"message": "Lead deleted successfully"}

# ==================== ENRICHMENT ROUTES ====================

@api_router.post("/enrich", response_model=EnrichmentResponse)
async def enrich_company(request: EnrichmentRequest, current_user: dict = Depends(get_current_user)):
    """Enrich company data"""
    
    return EnrichmentResponse(
        company_name=request.company_name,
        description=f"{request.company_name} is an innovative company focused on delivering exceptional value through cutting-edge technology solutions.",
        industry="Technology",
        employees="50-200",
        revenue="$10M-$50M",
        founded="2018",
        location="San Francisco, USA",
        technologies=["React", "Node.js", "AWS", "PostgreSQL", "Docker", "Kubernetes"],
        social_links={
            "linkedin": request.company_name.lower().replace(" ", "-"),
            "twitter": request.company_name.lower().replace(" ", ""),
        },
        recent_news=[
            f"{request.company_name} announces Series B funding",
            f"{request.company_name} expands to European markets",
            f"{request.company_name} launches new AI-powered features"
        ]
    )

# ==================== STATS & CONVERSATIONS ====================

@api_router.get("/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    leads_count = await db.leads.count_documents({"user_id": current_user["id"]})
    searches_count = await db.conversations.count_documents({"user_id": current_user["id"]})
    
    return {
        "total_leads": leads_count,
        "total_searches": searches_count,
        "credits_remaining": 500,
        "credits_used": searches_count * 5
    }

@api_router.get("/conversations")
async def get_conversations(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    conversations = await db.conversations.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return conversations

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "LaCleo AI API v2.0 - GTM Workflows"}

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
