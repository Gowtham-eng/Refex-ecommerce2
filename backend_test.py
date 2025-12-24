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