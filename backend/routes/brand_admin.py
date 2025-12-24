"""
Brand Admin API Routes
Handles: Authentication, Product Management, Inventory, Orders, Banking
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
import hashlib

from models.rbac import (
    UserRole, BrandAdminCreate, BrandAdminLogin, BrandProfile, 
    BrandBankDetails, ProductCreate, ProductUpdate, InventoryItem,
    InventoryLog, BrandOrder, AuditLog
)

# Router
brand_router = APIRouter(prefix="/api/brand-admin", tags=["Brand Admin"])

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'airport-ecom-secret-key-2024')
JWT_ALGORITHM = "HS256"

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ============== HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, role: str, brand_id: str = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "brand_id": brand_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def mask_sensitive_data(data: str, visible_chars: int = 4) -> str:
    """Mask sensitive data like account numbers"""
    if len(data) <= visible_chars:
        return "*" * len(data)
    return "*" * (len(data) - visible_chars) + data[-visible_chars:]

async def get_brand_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify and return brand admin user"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != UserRole.BRAND_ADMIN.value:
            raise HTTPException(status_code=403, detail="Brand admin access required")
        
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user or not user.get("is_active"):
            raise HTTPException(status_code=401, detail="User not found or inactive")
        
        user["brand_id"] = payload.get("brand_id")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def log_audit(user_id: str, role: str, action: str, resource_type: str, resource_id: str, details: dict, request: Request = None):
    """Log audit trail for security"""
    audit = AuditLog(
        user_id=user_id,
        user_role=role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    await db.audit_logs.insert_one(audit.model_dump())

# ============== AUTHENTICATION ==============

@brand_router.post("/register")
async def register_brand_admin(data: BrandAdminCreate, request: Request):
    """Register a new brand admin with their brand"""
    # Check if email exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password strength
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "mobile": data.mobile,
        "password_hash": hash_password(data.password),
        "role": UserRole.BRAND_ADMIN.value,
        "is_active": True,
        "is_verified": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    # Create brand profile
    brand_id = str(uuid.uuid4())
    brand = BrandProfile(
        id=brand_id,
        name=data.brand_name,
        description=data.brand_description,
        logo_url="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200",
        category=data.brand_category,
        airport_id=data.airport_id,
        gst_number=data.gst_number,
        pan_number=data.pan_number
    )
    await db.brands.insert_one(brand.model_dump())
    
    # Link admin to brand
    brand_admin = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "brand_id": brand_id,
        "permissions": ["view_products", "manage_products", "view_orders", "manage_orders", "view_inventory", "manage_inventory", "view_analytics", "manage_banking"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.brand_admins.insert_one(brand_admin)
    
    # Audit log
    await log_audit(user_id, UserRole.BRAND_ADMIN.value, "register", "brand", brand_id, {"brand_name": data.brand_name}, request)
    
    token = create_token(user_id, data.email, UserRole.BRAND_ADMIN.value, brand_id)
    
    return {
        "message": "Brand registration successful",
        "token": token,
        "user": {
            "id": user_id,
            "name": data.name,
            "email": data.email,
            "role": UserRole.BRAND_ADMIN.value
        },
        "brand": {
            "id": brand_id,
            "name": data.brand_name,
            "category": data.brand_category
        }
    }

@brand_router.post("/login")
async def login_brand_admin(credentials: BrandAdminLogin, request: Request):
    """Login for brand admin"""
    user = await db.users.find_one({"email": credentials.email, "role": UserRole.BRAND_ADMIN.value}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active"):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    # Get brand
    brand_admin = await db.brand_admins.find_one({"user_id": user["id"]}, {"_id": 0})
    if not brand_admin:
        raise HTTPException(status_code=404, detail="Brand admin profile not found")
    
    brand = await db.brands.find_one({"id": brand_admin["brand_id"]}, {"_id": 0})
    
    # Audit log
    await log_audit(user["id"], UserRole.BRAND_ADMIN.value, "login", "user", user["id"], {"email": credentials.email}, request)
    
    token = create_token(user["id"], user["email"], UserRole.BRAND_ADMIN.value, brand_admin["brand_id"])
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        },
        "brand": brand
    }

@brand_router.get("/me")
async def get_brand_admin_profile(admin: dict = Depends(get_brand_admin)):
    """Get current brand admin profile"""
    brand = await db.brands.find_one({"id": admin["brand_id"]}, {"_id": 0})
    return {
        "user": {
            "id": admin["id"],
            "name": admin["name"],
            "email": admin["email"],
            "mobile": admin.get("mobile"),
            "role": admin["role"]
        },
        "brand": brand
    }

# ============== BRAND PROFILE ==============

@brand_router.get("/brand/profile")
async def get_brand_profile(admin: dict = Depends(get_brand_admin)):
    """Get brand profile"""
    brand = await db.brands.find_one({"id": admin["brand_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand

@brand_router.put("/brand/profile")
async def update_brand_profile(
    updates: dict,
    request: Request,
    admin: dict = Depends(get_brand_admin)
):
    """Update brand profile"""
    allowed_fields = ["name", "description", "logo_url", "category", "business_address", 
                      "contact_email", "contact_phone", "store_location", "operating_hours"]
    
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.brands.update_one(
        {"id": admin["brand_id"]},
        {"$set": update_data}
    )
    
    await log_audit(admin["id"], admin["role"], "update", "brand", admin["brand_id"], update_data, request)
    
    return {"message": "Brand profile updated"}

# ============== BANKING DETAILS ==============

@brand_router.post("/banking")
async def add_bank_details(
    bank_data: dict,
    request: Request,
    admin: dict = Depends(get_brand_admin)
):
    """Add or update bank details for payouts"""
    # Check if bank details exist
    existing = await db.brand_bank_details.find_one({"brand_id": admin["brand_id"]}, {"_id": 0})
    
    bank_details = BrandBankDetails(
        brand_id=admin["brand_id"],
        account_holder_name=bank_data["account_holder_name"],
        account_number=bank_data["account_number"],  # In production, encrypt this
        bank_name=bank_data["bank_name"],
        ifsc_code=bank_data["ifsc_code"],
        branch_name=bank_data.get("branch_name", ""),
        account_type=bank_data.get("account_type", "current")
    )
    
    if existing:
        await db.brand_bank_details.update_one(
            {"brand_id": admin["brand_id"]},
            {"$set": bank_details.model_dump()}
        )
        action = "update"
    else:
        await db.brand_bank_details.insert_one(bank_details.model_dump())
        action = "create"
    
    # Update brand with bank details reference
    await db.brands.update_one(
        {"id": admin["brand_id"]},
        {"$set": {"bank_details_id": bank_details.id}}
    )
    
    # Audit log (mask sensitive data)
    await log_audit(admin["id"], admin["role"], action, "bank_details", bank_details.id, 
                   {"account_number_masked": mask_sensitive_data(bank_data["account_number"])}, request)
    
    return {"message": "Bank details saved successfully", "id": bank_details.id}

@brand_router.get("/banking")
async def get_bank_details(admin: dict = Depends(get_brand_admin)):
    """Get bank details (masked)"""
    bank = await db.brand_bank_details.find_one({"brand_id": admin["brand_id"]}, {"_id": 0})
    if not bank:
        return None
    
    # Mask sensitive data
    bank["account_number"] = mask_sensitive_data(bank.get("account_number", ""))
    return bank

# ============== PRODUCT MANAGEMENT ==============

@brand_router.get("/products")
async def get_brand_products(
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    category: str = None,
    admin: dict = Depends(get_brand_admin)
):
    """Get all products for this brand"""
    query = {"brand_id": admin["brand_id"]}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}}
        ]
    if category:
        query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents(query)
    
    return {"products": products, "total": total}

@brand_router.post("/products")
async def create_product(
    product: ProductCreate,
    request: Request,
    admin: dict = Depends(get_brand_admin)
):
    """Create a new product"""
    # Check SKU uniqueness for this brand
    existing = await db.products.find_one({"brand_id": admin["brand_id"], "sku": product.sku})
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists for this brand")
    
    # Get brand name
    brand = await db.brands.find_one({"id": admin["brand_id"]}, {"_id": 0, "name": 1})
    brand_name = brand.get("name", "") if brand else ""
    
    product_id = str(uuid.uuid4())
    product_data = {
        "id": product_id,
        "brand_id": admin["brand_id"],
        "brand_name": brand_name,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "sku": product.sku,
        "stock": product.stock,
        "category": product.category,
        "image_url": product.image_url,
        "loyalty_points_earn": product.loyalty_points_earn,
        "is_duty_free": product.is_duty_free,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product_data)
    
    # Create inventory entry
    inventory = InventoryItem(
        brand_id=admin["brand_id"],
        product_id=product_id,
        sku=product.sku,
        quantity=product.stock
    )
    await db.inventory.insert_one(inventory.model_dump())
    
    # Audit log
    await log_audit(admin["id"], admin["role"], "create", "product", product_id, 
                   {"name": product.name, "sku": product.sku}, request)
    
    # Return without _id
    if "_id" in product_data:
        del product_data["_id"]
    return {"message": "Product created", "id": product_id, "product": product_data}

@brand_router.put("/products/{product_id}")
async def update_product(
    product_id: str,
    updates: ProductUpdate,
    request: Request,
    admin: dict = Depends(get_brand_admin)
):
    """Update a product"""
    # Verify product belongs to brand
    product = await db.products.find_one({"id": product_id, "brand_id": admin["brand_id"]})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    # Update inventory if stock changed
    if "stock" in update_data:
        await db.inventory.update_one(
            {"product_id": product_id},
            {"$set": {"quantity": update_data["stock"], "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    await log_audit(admin["id"], admin["role"], "update", "product", product_id, update_data, request)
    
    return {"message": "Product updated"}

@brand_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    request: Request,
    admin: dict = Depends(get_brand_admin)
):
    """Soft delete a product"""
    product = await db.products.find_one({"id": product_id, "brand_id": admin["brand_id"]})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await log_audit(admin["id"], admin["role"], "delete", "product", product_id, {}, request)
    
    return {"message": "Product deleted"}

# ============== INVENTORY MANAGEMENT ==============

@brand_router.get("/inventory")
async def get_inventory(
    low_stock: bool = False,
    admin: dict = Depends(get_brand_admin)
):
    """Get inventory for brand"""
    query = {"brand_id": admin["brand_id"]}
    if low_stock:
        query["$expr"] = {"$lte": ["$quantity", "$min_stock_level"]}
    
    inventory = await db.inventory.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with product details
    for item in inventory:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0, "name": 1, "image_url": 1})
        item["product"] = product
    
    return inventory

@brand_router.put("/inventory/{product_id}")
async def update_inventory(
    product_id: str,
    quantity_change: int,
    reason: str,
    request: Request,
    admin: dict = Depends(get_brand_admin)
):
    """Update inventory quantity"""
    inventory = await db.inventory.find_one({"product_id": product_id, "brand_id": admin["brand_id"]})
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    previous_qty = inventory["quantity"]
    new_qty = previous_qty + quantity_change
    
    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    await db.inventory.update_one(
        {"product_id": product_id},
        {
            "$set": {
                "quantity": new_qty,
                "last_restocked": datetime.now(timezone.utc).isoformat() if quantity_change > 0 else inventory.get("last_restocked"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Update product stock
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"stock": new_qty}}
    )
    
    # Log inventory change
    log = InventoryLog(
        inventory_id=inventory["id"],
        brand_id=admin["brand_id"],
        product_id=product_id,
        action="stock_in" if quantity_change > 0 else "stock_out",
        quantity_change=quantity_change,
        previous_quantity=previous_qty,
        new_quantity=new_qty,
        reason=reason,
        performed_by=admin["id"]
    )
    await db.inventory_logs.insert_one(log.model_dump())
    
    await log_audit(admin["id"], admin["role"], "update", "inventory", inventory["id"], 
                   {"quantity_change": quantity_change, "reason": reason}, request)
    
    return {"message": "Inventory updated", "previous": previous_qty, "new": new_qty}

@brand_router.get("/inventory/logs")
async def get_inventory_logs(
    product_id: str = None,
    limit: int = 50,
    admin: dict = Depends(get_brand_admin)
):
    """Get inventory change logs"""
    query = {"brand_id": admin["brand_id"]}
    if product_id:
        query["product_id"] = product_id
    
    logs = await db.inventory_logs.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return logs

# ============== ORDER MANAGEMENT ==============

@brand_router.get("/orders")
async def get_brand_orders(
    status: str = None,
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(get_brand_admin)
):
    """Get orders containing products from this brand"""
    # Find orders that have items from this brand
    pipeline = [
        {"$match": {"items.brand_id": admin["brand_id"]}},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    if status:
        pipeline[0]["$match"]["order_status"] = status
    
    orders = await db.orders.aggregate(pipeline).to_list(limit)
    
    # Process to show only brand's items
    result = []
    for order in orders:
        brand_items = [item for item in order.get("items", []) if item.get("brand_id") == admin["brand_id"]]
        
        # Populate product details
        for item in brand_items:
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            item["product"] = product
        
        order_data = {
            "id": order["id"],
            "order_id": order["id"],
            "customer_id": order["user_id"],
            "items": brand_items,
            "subtotal": sum((item.get("product", {}).get("price", 0) * item["quantity"]) for item in brand_items),
            "order_status": order.get("order_status"),
            "payment_status": order.get("payment_status"),
            "delivery_type": order.get("delivery_type"),
            "delivery_details": order.get("airport_delivery_details") or order.get("delivery_address"),
            "created_at": order.get("created_at")
        }
        result.append(order_data)
    
    total = await db.orders.count_documents({"items.brand_id": admin["brand_id"]})
    
    return {"orders": result, "total": total}

@brand_router.put("/orders/{order_id}/status")
async def update_brand_order_status(
    order_id: str,
    status: str,
    request: Request,
    admin: dict = Depends(get_brand_admin)
):
    """Update order status from brand side"""
    valid_statuses = ["accepted", "preparing", "ready_for_pickup", "shipped", "out_for_delivery", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid: {valid_statuses}")
    
    # Verify order has items from this brand
    order = await db.orders.find_one({"id": order_id, "items.brand_id": admin["brand_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Map brand status to order status
    status_mapping = {
        "accepted": "confirmed",
        "preparing": "processing",
        "ready_for_pickup": "ready_for_pickup",
        "shipped": "shipped",
        "out_for_delivery": "out_for_delivery",
        "delivered": "delivered",
        "cancelled": "cancelled"
    }
    
    order_status = status_mapping.get(status, status)
    
    # Get brand name for tracking
    brand = await db.brands.find_one({"id": admin["brand_id"]}, {"_id": 0, "name": 1})
    brand_name = brand.get("name", "Brand") if brand else "Brand"
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {"order_status": order_status},
            "$push": {"tracking_status": {
                "status": order_status,
                "message": f"{brand_name}: Order {status}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "updated_by": "brand",
                "brand_id": admin["brand_id"]
            }}
        }
    )
    
    await log_audit(admin["id"], admin["role"], "update_status", "order", order_id, {"status": status}, request)
    
    return {"message": "Order status updated", "status": order_status}

@brand_router.put("/orders/{order_id}/tracking")
async def update_brand_order_tracking(
    order_id: str,
    status: str,
    message: str = None,
    request: Request = None,
    admin: dict = Depends(get_brand_admin)
):
    """Update order tracking with custom message"""
    # Verify order has items from this brand
    order = await db.orders.find_one({"id": order_id, "items.brand_id": admin["brand_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get brand name
    brand = await db.brands.find_one({"id": admin["brand_id"]}, {"_id": 0, "name": 1})
    brand_name = brand.get("name", "Brand") if brand else "Brand"
    
    tracking_entry = {
        "status": status,
        "message": message or f"{brand_name}: {status}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "updated_by": "brand",
        "brand_id": admin["brand_id"],
        "brand_name": brand_name
    }
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {"order_status": status},
            "$push": {"tracking_status": tracking_entry}
        }
    )
    
    if request:
        await log_audit(admin["id"], admin["role"], "update_tracking", "order", order_id, {"status": status, "message": message}, request)
    
    return {"message": "Tracking updated", "tracking": tracking_entry}


# ============== ANALYTICS ==============

@brand_router.get("/analytics/dashboard")
async def get_brand_dashboard(admin: dict = Depends(get_brand_admin)):
    """Get dashboard analytics for brand"""
    brand_id = admin["brand_id"]
    
    # Count products
    total_products = await db.products.count_documents({"brand_id": brand_id, "is_active": True})
    
    # Count orders
    total_orders = await db.orders.count_documents({"items.brand_id": brand_id})
    pending_orders = await db.orders.count_documents({"items.brand_id": brand_id, "order_status": {"$in": ["pending", "confirmed", "processing"]}})
    
    # Calculate revenue (simplified)
    pipeline = [
        {"$match": {"items.brand_id": brand_id, "payment_status": "paid"}},
        {"$unwind": "$items"},
        {"$match": {"items.brand_id": brand_id}},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": {"$multiply": ["$items.quantity", {"$ifNull": ["$items.price", 0]}]}}
        }}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    # Low stock items
    low_stock_count = await db.inventory.count_documents({
        "brand_id": brand_id,
        "$expr": {"$lte": ["$quantity", "$min_stock_level"]}
    })
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue,
        "low_stock_count": low_stock_count
    }

@brand_router.get("/analytics/sales")
async def get_sales_analytics(
    period: str = "7d",  # 7d, 30d, 90d
    admin: dict = Depends(get_brand_admin)
):
    """Get sales analytics"""
    days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 7)
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    pipeline = [
        {"$match": {
            "items.brand_id": admin["brand_id"],
            "payment_status": "paid",
            "created_at": {"$gte": start_date}
        }},
        {"$unwind": "$items"},
        {"$match": {"items.brand_id": admin["brand_id"]}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": {"$dateFromString": {"dateString": "$created_at"}}}},
            "orders": {"$sum": 1},
            "revenue": {"$sum": {"$multiply": ["$items.quantity", {"$ifNull": ["$items.price", 0]}]}}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    sales_data = await db.orders.aggregate(pipeline).to_list(days)
    
    return {"period": period, "data": sales_data}
