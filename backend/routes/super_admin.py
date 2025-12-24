"""
Super Admin API Routes
Full platform access - manages all brands, products, orders
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional
import os
import uuid
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr

from models.rbac import UserRole

# Router
admin_router = APIRouter(prefix="/api/super-admin", tags=["Super Admin"])

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'airport-ecom-secret-key-2024')
JWT_ALGORITHM = "HS256"

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Default super admin credentials - 2 admins
DEFAULT_ADMINS = [
    {"email": "admin1@jetshop.com", "password": "admin123", "name": "Admin One"},
    {"email": "admin2@jetshop.com", "password": "admin123", "name": "Admin Two"}
]

# ============== HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_super_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify and return super admin user"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Super admin access required")
        
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def ensure_super_admin_exists():
    """Create default super admin if not exists"""
    existing = await db.users.find_one({"email": SUPER_ADMIN_EMAIL, "role": "super_admin"})
    if not existing:
        admin_id = str(uuid.uuid4())
        admin = {
            "id": admin_id,
            "name": "Super Admin",
            "email": SUPER_ADMIN_EMAIL,
            "mobile": "+911234567890",
            "password_hash": hash_password(SUPER_ADMIN_PASSWORD),
            "role": "super_admin",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin)
        print(f"Super admin created: {SUPER_ADMIN_EMAIL}")

# ============== AUTHENTICATION ==============

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

@admin_router.post("/login")
async def login_super_admin(credentials: AdminLogin):
    """Login for super admin"""
    # Ensure super admin exists
    await ensure_super_admin_exists()
    
    user = await db.users.find_one({"email": credentials.email, "role": "super_admin"}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"], "super_admin")
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": "super_admin"
        }
    }

@admin_router.get("/me")
async def get_admin_profile(admin: dict = Depends(get_super_admin)):
    """Get super admin profile"""
    return {
        "id": admin["id"],
        "name": admin["name"],
        "email": admin["email"],
        "role": "super_admin"
    }

# ============== DASHBOARD STATS ==============

@admin_router.get("/dashboard")
async def get_dashboard_stats(admin: dict = Depends(get_super_admin)):
    """Get platform-wide statistics"""
    total_brands = await db.brands.count_documents({"is_active": True})
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_customers = await db.users.count_documents({"role": {"$in": ["customer", None]}})
    pending_orders = await db.orders.count_documents({"order_status": {"$in": ["pending", "confirmed", "processing"]}})
    
    # Calculate total revenue
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_brands": total_brands,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_customers": total_customers,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue
    }

# ============== BRAND MANAGEMENT ==============

@admin_router.get("/brands")
async def get_all_brands(
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    admin: dict = Depends(get_super_admin)
):
    """Get all brands"""
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}}
        ]
    
    brands = await db.brands.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.brands.count_documents(query)
    
    # Get product count for each brand
    for brand in brands:
        brand["product_count"] = await db.products.count_documents({"brand_id": brand["id"]})
        brand["order_count"] = await db.orders.count_documents({"items.brand_id": brand["id"]})
    
    return {"brands": brands, "total": total}

@admin_router.get("/brands/{brand_id}")
async def get_brand_details(brand_id: str, admin: dict = Depends(get_super_admin)):
    """Get brand details with products"""
    brand = await db.brands.find_one({"id": brand_id}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    products = await db.products.find({"brand_id": brand_id}, {"_id": 0}).to_list(100)
    orders = await db.orders.count_documents({"items.brand_id": brand_id})
    
    return {
        "brand": brand,
        "products": products,
        "order_count": orders
    }

@admin_router.put("/brands/{brand_id}/status")
async def update_brand_status(
    brand_id: str,
    is_active: bool,
    admin: dict = Depends(get_super_admin)
):
    """Activate/deactivate a brand"""
    result = await db.brands.update_one(
        {"id": brand_id},
        {"$set": {"is_active": is_active, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {"message": f"Brand {'activated' if is_active else 'deactivated'}"}

@admin_router.put("/brands/{brand_id}/verify")
async def verify_brand(brand_id: str, admin: dict = Depends(get_super_admin)):
    """Verify a brand"""
    result = await db.brands.update_one(
        {"id": brand_id},
        {"$set": {"is_verified": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {"message": "Brand verified"}

# ============== PRODUCT MANAGEMENT ==============

@admin_router.get("/products")
async def get_all_products(
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    brand_id: str = None,
    category: str = None,
    admin: dict = Depends(get_super_admin)
):
    """Get all products across all brands"""
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}}
        ]
    if brand_id:
        query["brand_id"] = brand_id
    if category:
        query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents(query)
    
    # Add brand name to each product
    for product in products:
        brand = await db.brands.find_one({"id": product["brand_id"]}, {"_id": 0, "name": 1})
        product["brand_name"] = brand.get("name") if brand else "Unknown"
    
    return {"products": products, "total": total}

@admin_router.post("/products")
async def create_product_admin(
    product_data: dict,
    admin: dict = Depends(get_super_admin)
):
    """Create a product (admin can assign to any brand)"""
    product_id = str(uuid.uuid4())
    product = {
        "id": product_id,
        "brand_id": product_data["brand_id"],
        "name": product_data["name"],
        "description": product_data.get("description", ""),
        "price": product_data["price"],
        "discount_price": product_data.get("discount_price"),
        "image_url": product_data.get("image_url", "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500"),
        "category": product_data.get("category", "General"),
        "sku": product_data.get("sku", f"SKU-{product_id[:8]}"),
        "stock": product_data.get("stock", 100),
        "loyalty_points_earn": product_data.get("loyalty_points_earn", 5),
        "is_duty_free": product_data.get("is_duty_free", False),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product)
    
    # Create inventory entry
    inventory = {
        "id": str(uuid.uuid4()),
        "brand_id": product["brand_id"],
        "product_id": product_id,
        "sku": product["sku"],
        "quantity": product["stock"],
        "min_stock_level": 10,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.inventory.insert_one(inventory)
    
    return {"message": "Product created", "product": product}

@admin_router.put("/products/{product_id}")
async def update_product_admin(
    product_id: str,
    updates: dict,
    admin: dict = Depends(get_super_admin)
):
    """Update any product"""
    allowed_fields = ["name", "description", "price", "discount_price", "image_url", 
                      "category", "stock", "loyalty_points_earn", "is_duty_free", "is_active"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated"}

@admin_router.delete("/products/{product_id}")
async def delete_product_admin(product_id: str, admin: dict = Depends(get_super_admin)):
    """Delete a product"""
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {"is_active": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ============== ORDER MANAGEMENT ==============

@admin_router.get("/orders")
async def get_all_orders(
    skip: int = 0,
    limit: int = 50,
    status: str = None,
    brand_id: str = None,
    admin: dict = Depends(get_super_admin)
):
    """Get all orders"""
    query = {}
    if status:
        query["order_status"] = status
    if brand_id:
        query["items.brand_id"] = brand_id
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    
    # Populate product and customer details
    for order in orders:
        # Get customer info
        customer = await db.users.find_one({"id": order["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        order["customer"] = customer
        
        # Populate product details
        for item in order.get("items", []):
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            if product:
                item["product"] = product
                brand = await db.brands.find_one({"id": product["brand_id"]}, {"_id": 0, "name": 1})
                item["brand_name"] = brand.get("name") if brand else "Unknown"
    
    return {"orders": orders, "total": total}

@admin_router.get("/orders/{order_id}")
async def get_order_details(order_id: str, admin: dict = Depends(get_super_admin)):
    """Get order details"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get customer
    customer = await db.users.find_one({"id": order["user_id"]}, {"_id": 0, "name": 1, "email": 1, "mobile": 1})
    order["customer"] = customer
    
    # Populate products
    for item in order.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            item["product"] = product
    
    return order

@admin_router.put("/orders/{order_id}/status")
async def update_order_status_admin(
    order_id: str,
    status: str,
    admin: dict = Depends(get_super_admin)
):
    """Update order status"""
    valid_statuses = ["pending", "confirmed", "processing", "ready_for_pickup", 
                      "shipped", "in_transit", "out_for_delivery", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {"order_status": status},
            "$push": {"tracking_status": {
                "status": status,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "updated_by": "admin"
            }}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# ============== USER MANAGEMENT ==============

@admin_router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    role: str = None,
    admin: dict = Depends(get_super_admin)
):
    """Get all users"""
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total}

# ============== CATEGORIES ==============

@admin_router.get("/categories")
async def get_all_categories(admin: dict = Depends(get_super_admin)):
    """Get all product categories"""
    categories = await db.products.distinct("category")
    return categories

# ============== AIRPORTS ==============

@admin_router.get("/airports")
async def get_all_airports(admin: dict = Depends(get_super_admin)):
    """Get all airports"""
    airports = await db.airports.find({}, {"_id": 0}).to_list(100)
    return airports
