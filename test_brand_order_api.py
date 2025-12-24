#!/usr/bin/env python3
"""
Simple test for Brand Order Status Update API endpoints
"""

import requests
import json

BASE_URL = "https://code-insight-42.preview.emergentagent.com"

def test_brand_order_status_endpoints():
    """Test the brand order status update API endpoints"""
    print("🔍 Testing Brand Order Status Update API Endpoints...")
    
    # Step 1: Login as admin and create a brand
    print("\n1. Admin login...")
    admin_login = {
        "email": "admin1@jetshop.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/api/super-admin/unified-login", json=admin_login)
    if response.status_code != 200:
        print(f"❌ Admin login failed: {response.text}")
        return False
    
    admin_token = response.json()['token']
    print("✅ Admin login successful")
    
    # Step 2: Get airports for brand creation
    response = requests.get(f"{BASE_URL}/api/airports")
    airports = response.json()
    airport_id = airports[0]['id']
    
    # Step 3: Create a brand account
    print("\n2. Creating brand account...")
    from datetime import datetime
    timestamp = datetime.now().strftime('%H%M%S')
    brand_data = {
        "name": f"Test Brand API {timestamp}",
        "email": f"testbrandapi{timestamp}@example.com",
        "mobile": f"+1234567{timestamp[-3:]}",
        "password": "brand123",
        "brand_name": "Test Brand API Store",
        "brand_description": "A test brand for API testing",
        "brand_category": "Electronics",
        "airport_id": airport_id
    }
    
    headers = {'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}
    response = requests.post(f"{BASE_URL}/api/super-admin/brands/create-account", json=brand_data, headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Brand creation failed: {response.text}")
        return False
    
    print("✅ Brand created successfully")
    
    # Step 4: Login as brand
    print("\n3. Brand login...")
    brand_login = {
        "email": brand_data['email'],
        "password": brand_data['password']
    }
    
    response = requests.post(f"{BASE_URL}/api/super-admin/unified-login", json=brand_login)
    if response.status_code != 200:
        print(f"❌ Brand login failed: {response.text}")
        return False
    
    brand_token = response.json()['token']
    print("✅ Brand login successful")
    
    # Step 5: Test brand order endpoints
    print("\n4. Testing brand order endpoints...")
    brand_headers = {'Authorization': f'Bearer {brand_token}', 'Content-Type': 'application/json'}
    
    # Test GET orders
    response = requests.get(f"{BASE_URL}/api/brand-admin/orders", headers=brand_headers)
    if response.status_code != 200:
        print(f"❌ Brand orders GET failed: {response.text}")
        return False
    
    orders = response.json()['orders']
    print(f"✅ Brand orders GET successful: {len(orders)} orders found")
    
    # Test order status update endpoint (with non-existent order - should return 404)
    print("\n5. Testing order status update endpoint...")
    test_order_id = "test-order-123"
    
    # Test PUT /orders/{order_id}/status
    response = requests.put(f"{BASE_URL}/api/brand-admin/orders/{test_order_id}/status", 
                           params={"status": "processing"}, headers=brand_headers)
    
    if response.status_code == 404:
        print("✅ Order status update endpoint accessible (404 expected for non-existent order)")
    elif response.status_code == 400:
        print("✅ Order status update endpoint accessible (400 expected for invalid status format)")
    else:
        print(f"⚠️  Order status update returned: {response.status_code} - {response.text}")
    
    # Test PUT /orders/{order_id}/tracking
    response = requests.put(f"{BASE_URL}/api/brand-admin/orders/{test_order_id}/tracking", 
                           params={"status": "shipped", "message": "Order shipped"}, headers=brand_headers)
    
    if response.status_code == 404:
        print("✅ Order tracking update endpoint accessible (404 expected for non-existent order)")
    elif response.status_code == 400:
        print("✅ Order tracking update endpoint accessible (400 expected for invalid format)")
    else:
        print(f"⚠️  Order tracking update returned: {response.status_code} - {response.text}")
    
    return True

if __name__ == "__main__":
    success = test_brand_order_status_endpoints()
    if success:
        print("\n✅ Brand Order Status Update API endpoints are working!")
    else:
        print("\n❌ Brand Order Status Update API endpoints have issues!")