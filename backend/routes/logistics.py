"""
Logistics Partner API Routes
Handles: Authentication, Delivery Management, Runner Management
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
import random
import string

# Router
logistics_router = APIRouter(prefix="/api/logistics", tags=["Logistics Partner"])

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'airport-ecom-secret-key-2024')
JWT_ALGORITHM = "HS256"

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ============== MODELS ==============

class LogisticsRegister(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    password: str
    company_name: str
    service_type: str  # airport_delivery, home_delivery, both
    airport_ids: List[str]

class LogisticsLogin(BaseModel):
    email: EmailStr
    password: str

class RunnerCreate(BaseModel):
    name: str
    mobile: str
    email: Optional[str] = None
    airport_id: str

# ============== HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, role: str, partner_id: str = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "partner_id": partner_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))

async def get_logistics_partner(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify and return logistics partner user"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "logistics_partner":
            raise HTTPException(status_code=403, detail="Logistics partner access required")
        
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user or not user.get("is_active"):
            raise HTTPException(status_code=401, detail="User not found or inactive")
        
        user["partner_id"] = payload.get("partner_id")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== AUTHENTICATION ==============

@logistics_router.post("/register")
async def register_logistics_partner(data: LogisticsRegister):
    """Register a new logistics partner"""
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
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
        "role": "logistics_partner",
        "is_active": True,
        "is_verified": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    # Create logistics partner profile
    partner_id = str(uuid.uuid4())
    partner = {
        "id": partner_id,
        "user_id": user_id,
        "company_name": data.company_name,
        "service_type": data.service_type,
        "airport_ids": data.airport_ids,
        "contact_email": data.email,
        "contact_phone": data.mobile,
        "is_active": True,
        "is_verified": False,
        "total_deliveries": 0,
        "successful_deliveries": 0,
        "rating": 5.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.logistics_partners.insert_one(partner)
    
    token = create_token(user_id, data.email, "logistics_partner", partner_id)
    
    return {
        "message": "Registration successful",
        "token": token,
        "user": {"id": user_id, "name": data.name, "email": data.email, "role": "logistics_partner"},
        "partner": {"id": partner_id, "company_name": data.company_name}
    }

@logistics_router.post("/login")
async def login_logistics_partner(credentials: LogisticsLogin):
    """Login for logistics partner"""
    user = await db.users.find_one({"email": credentials.email, "role": "logistics_partner"}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    partner = await db.logistics_partners.find_one({"user_id": user["id"]}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    
    token = create_token(user["id"], user["email"], "logistics_partner", partner["id"])
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
        "partner": partner
    }

@logistics_router.get("/me")
async def get_partner_profile(partner: dict = Depends(get_logistics_partner)):
    """Get current logistics partner profile"""
    profile = await db.logistics_partners.find_one({"id": partner["partner_id"]}, {"_id": 0})
    return {"user": partner, "partner": profile}

# ============== RUNNER MANAGEMENT ==============

@logistics_router.get("/runners")
async def get_runners(partner: dict = Depends(get_logistics_partner)):
    """Get all runners for this logistics partner"""
    runners = await db.runners.find({"logistics_partner_id": partner["partner_id"]}, {"_id": 0}).to_list(100)
    return runners

@logistics_router.post("/runners")
async def create_runner(runner: RunnerCreate, partner: dict = Depends(get_logistics_partner)):
    """Add a new delivery runner"""
    runner_id = str(uuid.uuid4())
    runner_data = {
        "id": runner_id,
        "logistics_partner_id": partner["partner_id"],
        "name": runner.name,
        "mobile": runner.mobile,
        "email": runner.email,
        "airport_id": runner.airport_id,
        "is_active": True,
        "is_available": True,
        "current_order_id": None,
        "total_deliveries": 0,
        "rating": 5.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.runners.insert_one(runner_data)
    return {"message": "Runner added", "runner": runner_data}

@logistics_router.put("/runners/{runner_id}/availability")
async def update_runner_availability(
    runner_id: str,
    is_available: bool,
    partner: dict = Depends(get_logistics_partner)
):
    """Update runner availability"""
    result = await db.runners.update_one(
        {"id": runner_id, "logistics_partner_id": partner["partner_id"]},
        {"$set": {"is_available": is_available}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Runner not found")
    return {"message": "Availability updated"}

# ============== DELIVERY MANAGEMENT ==============

@logistics_router.get("/deliveries")
async def get_deliveries(
    status: str = None,
    partner: dict = Depends(get_logistics_partner)
):
    """Get all deliveries for this logistics partner"""
    query = {"logistics_partner_id": partner["partner_id"]}
    if status:
        query["status"] = status
    
    deliveries = await db.delivery_assignments.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich with order details
    for delivery in deliveries:
        order = await db.orders.find_one({"id": delivery["order_id"]}, {"_id": 0})
        if order:
            delivery["order"] = {
                "id": order["id"],
                "items_count": len(order.get("items", [])),
                "total": order.get("total"),
                "delivery_type": order.get("delivery_type")
            }
    
    return deliveries

@logistics_router.get("/deliveries/pending")
async def get_pending_deliveries(partner: dict = Depends(get_logistics_partner)):
    """Get pending deliveries that need runner assignment"""
    # Get partner's airport IDs
    partner_profile = await db.logistics_partners.find_one({"id": partner["partner_id"]}, {"_id": 0})
    airport_ids = partner_profile.get("airport_ids", [])
    
    # Find orders ready for pickup in partner's airports
    orders = await db.orders.find({
        "order_status": "ready_for_pickup",
        "payment_status": "paid"
    }, {"_id": 0}).to_list(100)
    
    pending = []
    for order in orders:
        # Check if already assigned
        existing = await db.delivery_assignments.find_one({"order_id": order["id"]})
        if not existing:
            pending.append({
                "order_id": order["id"],
                "delivery_type": order.get("delivery_type"),
                "delivery_details": order.get("airport_delivery_details") or order.get("delivery_address"),
                "items_count": len(order.get("items", [])),
                "total": order.get("total"),
                "created_at": order.get("created_at")
            })
    
    return pending

@logistics_router.post("/deliveries/assign")
async def assign_delivery(
    order_id: str,
    runner_id: str,
    partner: dict = Depends(get_logistics_partner)
):
    """Assign a delivery to a runner"""
    # Verify runner belongs to partner
    runner = await db.runners.find_one({"id": runner_id, "logistics_partner_id": partner["partner_id"]})
    if not runner:
        raise HTTPException(status_code=404, detail="Runner not found")
    
    if not runner.get("is_available"):
        raise HTTPException(status_code=400, detail="Runner is not available")
    
    # Get order
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Create delivery assignment
    assignment_id = str(uuid.uuid4())
    otp = generate_otp()
    
    assignment = {
        "id": assignment_id,
        "order_id": order_id,
        "logistics_partner_id": partner["partner_id"],
        "runner_id": runner_id,
        "delivery_type": order.get("delivery_type"),
        "pickup_location": "Brand Store",  # Would be filled from brand location
        "delivery_location": str(order.get("airport_delivery_details") or order.get("delivery_address")),
        "status": "assigned",
        "customer_otp": otp,
        "tracking_updates": [
            {"status": "assigned", "timestamp": datetime.now(timezone.utc).isoformat(), "note": f"Assigned to {runner['name']}"}
        ],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.delivery_assignments.insert_one(assignment)
    
    # Update runner
    await db.runners.update_one(
        {"id": runner_id},
        {"$set": {"is_available": False, "current_order_id": order_id}}
    )
    
    # Update order status
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {"order_status": "out_for_delivery"},
            "$push": {"tracking_status": {"status": "Runner assigned", "timestamp": datetime.now(timezone.utc).isoformat()}}
        }
    )
    
    return {"message": "Delivery assigned", "assignment_id": assignment_id, "otp": otp}

@logistics_router.put("/deliveries/{assignment_id}/status")
async def update_delivery_status(
    assignment_id: str,
    status: str,
    note: str = None,
    partner: dict = Depends(get_logistics_partner)
):
    """Update delivery status"""
    valid_statuses = ["picked_up", "in_transit", "delivered", "failed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid: {valid_statuses}")
    
    assignment = await db.delivery_assignments.find_one({
        "id": assignment_id,
        "logistics_partner_id": partner["partner_id"]
    })
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    update = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    tracking_update = {"status": status, "timestamp": datetime.now(timezone.utc).isoformat()}
    if note:
        tracking_update["note"] = note
    
    if status == "delivered":
        update["actual_delivery_time"] = datetime.now(timezone.utc).isoformat()
        # Free up runner
        await db.runners.update_one(
            {"id": assignment["runner_id"]},
            {
                "$set": {"is_available": True, "current_order_id": None},
                "$inc": {"total_deliveries": 1}
            }
        )
        # Update order
        await db.orders.update_one(
            {"id": assignment["order_id"]},
            {
                "$set": {"order_status": "delivered"},
                "$push": {"tracking_status": {"status": "Delivered", "timestamp": datetime.now(timezone.utc).isoformat()}}
            }
        )
    elif status == "picked_up":
        update["actual_pickup_time"] = datetime.now(timezone.utc).isoformat()
    
    await db.delivery_assignments.update_one(
        {"id": assignment_id},
        {"$set": update, "$push": {"tracking_updates": tracking_update}}
    )
    
    return {"message": "Status updated"}

@logistics_router.post("/deliveries/{assignment_id}/verify")
async def verify_delivery(
    assignment_id: str,
    otp: str,
    partner: dict = Depends(get_logistics_partner)
):
    """Verify delivery with customer OTP"""
    assignment = await db.delivery_assignments.find_one({
        "id": assignment_id,
        "logistics_partner_id": partner["partner_id"]
    })
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment.get("customer_otp") != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Mark as delivered
    await update_delivery_status(assignment_id, "delivered", "Verified with OTP", partner)
    
    return {"message": "Delivery verified and completed"}

# ============== ANALYTICS ==============

@logistics_router.get("/analytics/dashboard")
async def get_logistics_dashboard(partner: dict = Depends(get_logistics_partner)):
    """Get dashboard analytics"""
    partner_id = partner["partner_id"]
    
    # Count runners
    total_runners = await db.runners.count_documents({"logistics_partner_id": partner_id})
    available_runners = await db.runners.count_documents({"logistics_partner_id": partner_id, "is_available": True})
    
    # Count deliveries
    total_deliveries = await db.delivery_assignments.count_documents({"logistics_partner_id": partner_id})
    pending_deliveries = await db.delivery_assignments.count_documents({"logistics_partner_id": partner_id, "status": {"$in": ["assigned", "picked_up", "in_transit"]}})
    completed_deliveries = await db.delivery_assignments.count_documents({"logistics_partner_id": partner_id, "status": "delivered"})
    
    # Get partner profile for rating
    profile = await db.logistics_partners.find_one({"id": partner_id}, {"_id": 0})
    
    return {
        "total_runners": total_runners,
        "available_runners": available_runners,
        "total_deliveries": total_deliveries,
        "pending_deliveries": pending_deliveries,
        "completed_deliveries": completed_deliveries,
        "success_rate": (completed_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0,
        "rating": profile.get("rating", 5.0)
    }
