import requests
import sys
import json
from datetime import datetime

class JetShopAPITester:
    def __init__(self, base_url="https://code-insight-42.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        self.run_test("Root endpoint", "GET", "", 200)
        self.run_test("Health check", "GET", "health", 200)

    def test_airports(self):
        """Test airport endpoints"""
        print("\n🔍 Testing Airport Endpoints...")
        success, airports = self.run_test("Get airports", "GET", "airports", 200)
        if success and airports:
            print(f"   Found {len(airports)} airports")
            return airports
        return []

    def test_categories_and_brands(self):
        """Test categories and brands"""
        print("\n🔍 Testing Categories and Brands...")
        self.run_test("Get categories", "GET", "categories", 200)
        success, brands = self.run_test("Get brands", "GET", "brands", 200)
        if success and brands:
            print(f"   Found {len(brands)} brands")
            return brands
        return []

    def test_products(self):
        """Test product endpoints"""
        print("\n🔍 Testing Product Endpoints...")
        success, products_response = self.run_test("Get products", "GET", "products", 200)
        
        if success and products_response.get('products'):
            products = products_response['products']
            print(f"   Found {len(products)} products")
            
            # Test individual product
            if products:
                product_id = products[0]['id']
                self.run_test("Get single product", "GET", f"products/{product_id}", 200)
            
            # Test with filters
            self.run_test("Filter by category", "GET", "products?category=Perfumes", 200)
            self.run_test("Filter duty free", "GET", "products?duty_free=true", 200)
            
            return products
        return []

    def test_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@jetshop.com",
            "mobile": f"+1234567{timestamp[-3:]}",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test("User registration", "POST", "auth/register", 200, test_user)
        
        if success and response.get('token'):
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {response['user']['name']}")
            print(f"   Loyalty ID: {response['user']['loyalty_id']}")
            print(f"   Welcome points: {response['user']['loyalty_points']}")
            return test_user
        return None

    def test_user_login(self, user_data):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        if not user_data:
            return False
            
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        success, response = self.run_test("User login", "POST", "auth/login", 200, login_data)
        
        if success and response.get('token'):
            self.token = response['token']
            print(f"   Logged in as: {response['user']['name']}")
            return True
        return False

    def test_user_profile(self):
        """Test user profile endpoint"""
        print("\n🔍 Testing User Profile...")
        
        if not self.token:
            self.log_test("Get user profile", False, "No authentication token")
            return
            
        self.run_test("Get user profile", "GET", "auth/me", 200)

    def test_cart_operations(self, products):
        """Test cart operations"""
        print("\n🔍 Testing Cart Operations...")
        
        if not self.token:
            self.log_test("Cart operations", False, "No authentication token")
            return
            
        if not products:
            self.log_test("Cart operations", False, "No products available")
            return

        # Get empty cart
        self.run_test("Get empty cart", "GET", "cart", 200)
        
        # Add item to cart
        product_id = products[0]['id']
        cart_item = {
            "product_id": product_id,
            "quantity": 2
        }
        
        success, _ = self.run_test("Add to cart", "POST", "cart/add", 200, cart_item)
        
        if success:
            # Get cart with items
            success, cart = self.run_test("Get cart with items", "GET", "cart", 200)
            if success and cart.get('items'):
                print(f"   Cart has {len(cart['items'])} items")
                print(f"   Subtotal: ${cart.get('subtotal', 0):.2f}")
                
                # Update cart
                updated_items = [{
                    "product_id": product_id,
                    "quantity": 3
                }]
                self.run_test("Update cart", "POST", "cart/update", 200, {"items": updated_items})
                
                # Remove item
                self.run_test("Remove from cart", "DELETE", f"cart/item/{product_id}", 200)

    def test_checkout_calculation(self):
        """Test checkout calculation"""
        print("\n🔍 Testing Checkout Calculation...")
        
        if not self.token:
            self.log_test("Checkout calculation", False, "No authentication token")
            return
            
        # Add item to cart first
        checkout_data = {
            "delivery_details": {
                "delivery_type": "airport",
                "terminal": "T1",
                "gate": "A12"
            },
            "use_loyalty_points": 0,
            "use_wallet_amount": 0
        }
        
        self.run_test("Calculate checkout", "POST", "checkout/calculate", 400)  # Should fail with empty cart

    def test_loyalty_and_wallet(self):
        """Test loyalty and wallet endpoints"""
        print("\n🔍 Testing Loyalty and Wallet...")
        
        if not self.token:
            self.log_test("Loyalty endpoints", False, "No authentication token")
            return
            
        self.run_test("Get loyalty info", "GET", "loyalty", 200)
        self.run_test("Get wallet info", "GET", "wallet", 200)

    def test_orders(self):
        """Test order endpoints"""
        print("\n🔍 Testing Order Endpoints...")
        
        if not self.token:
            self.log_test("Order endpoints", False, "No authentication token")
            return
            
        self.run_test("Get orders", "GET", "orders", 200)

    def test_recommendations(self):
        """Test AI recommendations"""
        print("\n🔍 Testing AI Recommendations...")
        
        if not self.token:
            self.log_test("AI recommendations", False, "No authentication token")
            return
            
        success, recommendations = self.run_test("Get recommendations", "GET", "recommendations", 200)
        if success and recommendations.get('recommendations'):
            print(f"   Got {len(recommendations['recommendations'])} recommendations")

    def test_seed_data(self):
        """Test seed data endpoint"""
        print("\n🔍 Testing Seed Data...")
        success, response = self.run_test("Seed data", "POST", "seed-data", 200)
        if success:
            print(f"   Seeded {response.get('brands', 0)} brands and {response.get('products', 0)} products")

    def test_admin_unified_login(self):
        """Test Admin Unified Login API"""
        print("\n🔍 Testing Admin Unified Login...")
        
        # Test admin1 login
        admin1_data = {
            "email": "admin1@jetshop.com",
            "password": "admin123"
        }
        
        success, response = self.run_test("Admin1 unified login", "POST", "super-admin/unified-login", 200, admin1_data)
        if success and response.get('token'):
            print(f"   Admin1 login successful - Role: {response.get('role')}")
            if response.get('role') == 'super_admin':
                self.admin_token = response['token']
                self.admin_user = response['user']
            else:
                self.log_test("Admin1 role check", False, f"Expected super_admin, got {response.get('role')}")
        
        # Test admin2 login
        admin2_data = {
            "email": "admin2@jetshop.com", 
            "password": "admin123"
        }
        
        success, response = self.run_test("Admin2 unified login", "POST", "super-admin/unified-login", 200, admin2_data)
        if success and response.get('role') == 'super_admin':
            print(f"   Admin2 login successful - Role: {response.get('role')}")
        
        # Test invalid credentials
        invalid_data = {
            "email": "invalid@jetshop.com",
            "password": "wrongpass"
        }
        
        self.run_test("Invalid admin login", "POST", "super-admin/unified-login", 401, invalid_data)

    def test_admin_dashboard(self):
        """Test Admin Dashboard API"""
        print("\n🔍 Testing Admin Dashboard...")
        
        if not hasattr(self, 'admin_token') or not self.admin_token:
            self.log_test("Admin dashboard", False, "No admin token available")
            return
        
        # Temporarily store current token and set admin token
        user_token = self.token
        self.token = self.admin_token
        
        success, dashboard = self.run_test("Admin dashboard stats", "GET", "super-admin/dashboard", 200)
        if success:
            stats = ['total_brands', 'total_products', 'total_orders', 'total_customers', 'pending_orders', 'total_revenue']
            for stat in stats:
                if stat in dashboard:
                    print(f"   {stat}: {dashboard[stat]}")
        
        # Restore user token
        self.token = user_token

    def test_admin_create_brand_account(self):
        """Test Admin Create Brand Account"""
        print("\n🔍 Testing Admin Create Brand Account...")
        
        if not hasattr(self, 'admin_token') or not self.admin_token:
            self.log_test("Admin create brand", False, "No admin token available")
            return
        
        # Get airports first for airport_id
        airports_success, airports = self.run_test("Get airports for brand creation", "GET", "airports", 200)
        if not airports_success or not airports:
            self.log_test("Admin create brand", False, "No airports available")
            return
        
        airport_id = airports[0]['id']
        
        # Temporarily store current token and set admin token
        user_token = self.token
        self.token = self.admin_token
        
        timestamp = datetime.now().strftime('%H%M%S')
        brand_data = {
            "name": f"Test Brand Admin {timestamp}",
            "email": f"testbrand{timestamp}@example.com",
            "mobile": f"+1234567{timestamp[-3:]}",
            "password": "brand123",
            "brand_name": "Test Brand Store",
            "brand_description": "A test brand created by admin",
            "brand_category": "Electronics",
            "airport_id": airport_id
        }
        
        success, response = self.run_test("Admin create brand account", "POST", "super-admin/brands/create-account", 200, brand_data)
        if success:
            print(f"   Created brand: {response.get('brand', {}).get('name')}")
            print(f"   Brand user: {response.get('user', {}).get('email')}")
            self.test_brand_email = brand_data['email']
            self.test_brand_password = brand_data['password']
        
        # Restore user token
        self.token = user_token

    def test_brand_unified_login(self):
        """Test Brand Login via Unified Login"""
        print("\n🔍 Testing Brand Unified Login...")
        
        if not hasattr(self, 'test_brand_email') or not self.test_brand_email:
            self.log_test("Brand unified login", False, "No test brand created")
            return
        
        brand_login_data = {
            "email": self.test_brand_email,
            "password": self.test_brand_password
        }
        
        success, response = self.run_test("Brand unified login", "POST", "super-admin/unified-login", 200, brand_login_data)
        if success and response.get('token'):
            print(f"   Brand login successful - Role: {response.get('role')}")
            if response.get('role') == 'brand_admin':
                self.brand_token = response['token']
                self.brand_user = response['user']
                self.brand_info = response.get('brand')
                print(f"   Brand: {self.brand_info.get('name') if self.brand_info else 'Unknown'}")
            else:
                self.log_test("Brand role check", False, f"Expected brand_admin, got {response.get('role')}")

    def test_brand_products_api(self):
        """Test Brand Products API"""
        print("\n🔍 Testing Brand Products API...")
        
        if not hasattr(self, 'brand_token') or not self.brand_token:
            self.log_test("Brand products API", False, "No brand token available")
            return
        
        # Temporarily store current token and set brand token
        user_token = self.token
        self.token = self.brand_token
        
        success, products_response = self.run_test("Brand products", "GET", "brand-admin/products", 200)
        if success:
            products = products_response.get('products', [])
            total = products_response.get('total', 0)
            print(f"   Found {len(products)} products (total: {total}) for brand")
        
        # Restore user token
        self.token = user_token

    def test_brand_orders_api(self):
        """Test Brand Orders API"""
        print("\n🔍 Testing Brand Orders API...")
        
        if not hasattr(self, 'brand_token') or not self.brand_token:
            self.log_test("Brand orders API", False, "No brand token available")
            return
        
        # Temporarily store current token and set brand token
        user_token = self.token
        self.token = self.brand_token
        
        success, orders_response = self.run_test("Brand orders", "GET", "brand-admin/orders", 200)
        if success:
            orders = orders_response.get('orders', [])
            total = orders_response.get('total', 0)
            print(f"   Found {len(orders)} orders (total: {total}) for brand")
        
        # Restore user token
        self.token = user_token

    def test_admin_panel_apis(self):
        """Test all Admin Panel APIs"""
        print("\n🚀 Testing Admin Panel Backend APIs...")
        
        # Initialize admin-specific attributes
        self.admin_token = None
        self.admin_user = None
        self.brand_token = None
        self.brand_user = None
        self.brand_info = None
        self.test_brand_email = None
        self.test_brand_password = None
        
        # Test admin login
        self.test_admin_unified_login()
        
        # Test admin dashboard
        self.test_admin_dashboard()
        
        # Test admin create brand account
        self.test_admin_create_brand_account()
        
        # Test brand login
        self.test_brand_unified_login()
        
        # Test brand APIs
        self.test_brand_products_api()
        self.test_brand_orders_api()

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting JetShop API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Basic health checks
        self.test_health_check()
        
        # Seed data first
        self.test_seed_data()
        
        # Test public endpoints
        airports = self.test_airports()
        brands = self.test_categories_and_brands()
        products = self.test_products()
        
        # Test authentication
        user_data = self.test_user_registration()
        if user_data:
            self.test_user_login(user_data)
            self.test_user_profile()
            
            # Test authenticated endpoints
            self.test_cart_operations(products)
            self.test_checkout_calculation()
            self.test_loyalty_and_wallet()
            self.test_orders()
            self.test_recommendations()
        
        # Test Admin Panel APIs
        self.test_admin_panel_apis()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed < self.tests_run:
            print(f"\n❌ Failed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = JetShopAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())