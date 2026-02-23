import requests
import sys
import json
from datetime import datetime

class LaCleoAPITester:
    def __init__(self, base_url="https://lacleo-dashboard.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, message="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data
        })

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            response_json = {}
            
            try:
                response_json = response.json()
            except:
                pass

            if success:
                self.log_result(name, True, f"Status: {response.status_code}", response_json)
                return True, response_json
            else:
                self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}", response_json)
                return False, response_json

        except Exception as e:
            self.log_result(name, False, f"Request error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test("Health Check", "GET", "health", 200)
        return success

    def test_register(self, name="Test User", email=None, password="TestPass123!"):
        """Test user registration"""
        if not email:
            timestamp = datetime.now().strftime('%H%M%S')
            email = f"test_user_{timestamp}@lacleo.ai"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"name": name, "email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"🔑 Registration successful, token acquired")
            return True, response
        return False, response

    def test_login(self, email, password="TestPass123!"):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"🔑 Login successful, token acquired")
            return True, response
        return False, response

    def test_get_profile(self):
        """Test get user profile"""
        success, response = self.run_test("Get User Profile", "GET", "auth/me", 200)
        return success, response

    def test_ai_search(self):
        """Test AI search (main feature)"""
        success, response = self.run_test(
            "AI Search - Find People",
            "POST",
            "search",
            200,
            data={
                "prompt": "Find VPs of Sales at SaaS companies that just raised Series B",
                "mode": "find_people"
            }
        )
        return success, response

    def test_ai_search_companies(self):
        """Test AI search for companies"""
        success, response = self.run_test(
            "AI Search - Find Companies", 
            "POST",
            "search",
            200,
            data={
                "prompt": "Find recently funded fintech companies",
                "mode": "find_companies"
            }
        )
        return success, response

    def test_template_categories(self):
        """Test template categories endpoint"""
        success, response = self.run_test("Template Categories", "GET", "templates/categories", 200)
        return success, response

    def test_templates(self):
        """Test templates endpoint"""
        success, response = self.run_test("Templates List", "GET", "templates", 200)
        return success, response

    def test_template_details(self):
        """Test template details endpoint"""
        success, response = self.run_test("Template Details", "GET", "templates/find-yc-founders", 200)
        return success, response

    def test_run_template(self):
        """Test running a template"""
        success, response = self.run_test(
            "Run Template",
            "POST",
            "templates/find-yc-founders/run",
            200
        )
        return success, response

    def test_get_leads(self):
        """Test get user leads"""
        success, response = self.run_test("Get User Leads", "GET", "leads", 200)
        return success, response

    def test_get_stats(self):
        """Test get user stats"""
        success, response = self.run_test("Get User Stats", "GET", "stats", 200)
        return success, response

    def test_enrich_company(self):
        """Test company enrichment"""
        success, response = self.run_test(
            "Company Enrichment",
            "POST", 
            "enrich",
            200,
            data={
                "company_name": "TechFlow Solutions",
                "domain": "techflow.io"
            }
        )
        return success, response

    def test_get_conversations(self):
        """Test conversations/search history"""
        success, response = self.run_test("Get Conversations", "GET", "conversations", 200)
        return success, response

    def test_personalize(self):
        """Test personalization endpoint"""
        success, response = self.run_test(
            "Personalize for Website",
            "POST",
            "personalize",
            200,
            data={
                "website_url": "https://techflow.io"
            }
        )
        return success, response

    def test_lookalikes(self):
        """Test find lookalikes endpoint"""
        success, response = self.run_test(
            "Find Lookalikes",
            "POST", 
            "lookalikes",
            200,
            data={
                "company_names": ["Stripe", "Notion", "Figma"],
                "limit": 10
            }
        )
        return success, response

def main():
    print("🚀 Starting LaCleo.ai API Testing (Origami.chat Style)...")
    print("=" * 60)
    
    tester = LaCleoAPITester()
    
    # Test 1: Health Check
    if not tester.test_health_check():
        print("💀 Health check failed - API might be down")
        return 1

    # Test 2: User Registration
    success, user_data = tester.test_register()
    if not success:
        print("💀 Registration failed - stopping tests")
        return 1
    
    test_email = user_data.get('user', {}).get('email')
    
    # Test 3: Get Profile
    tester.test_get_profile()
    
    # Test 4: Template Categories (New Feature)
    tester.test_template_categories()
    
    # Test 5: Templates List
    tester.test_templates()
    
    # Test 6: Template Details
    tester.test_template_details()
    
    # Test 7: Run Template (Core Feature)
    print("\n⚡ Testing Template Execution (YC Founders search)...")
    tester.test_run_template()
    
    # Test 8: AI Search - Find People (Core Feature)
    print("\n⚡ Testing AI Search - Find People (This may take 10-20 seconds)...")
    tester.test_ai_search()
    
    # Test 9: AI Search - Find Companies
    print("\n⚡ Testing AI Search - Find Companies...")
    tester.test_ai_search_companies()
    
    # Test 10: Get Leads
    tester.test_get_leads()
    
    # Test 11: Get Stats
    tester.test_get_stats()
    
    # Test 12: Company Enrichment
    tester.test_enrich_company()
    
    # Test 13: Get Conversations/Search History
    tester.test_get_conversations()
    
    # Test 14: Personalization (New Feature)
    tester.test_personalize()
    
    # Test 15: Find Lookalikes (New Feature)
    tester.test_lookalikes()
    
    # Test 16: Login with created user
    if test_email:
        tester.test_login(test_email)
    
    # Print Results
    print("\n" + "=" * 60)
    print(f"📊 LaCleo.ai API Testing Complete")
    print(f"✅ Tests Passed: {tester.tests_passed}/{tester.tests_run}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate < 80:
        print("⚠️  API has significant issues that need attention")
        return 1
    elif success_rate < 100:
        print("⚠️  API has minor issues but is mostly functional")
        return 0
    else:
        print("🎉 All API tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())