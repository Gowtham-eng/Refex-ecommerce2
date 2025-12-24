from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
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
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'airport-ecom-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI(title="JetShop - Airport E-commerce Portal")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ============== MODELS ==============

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    password: str
    travel_details: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OTPVerify(BaseModel):
    mobile: str
    otp: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    mobile: str
    loyalty_id: str = Field(default_factory=lambda: f"LYL-{str(uuid.uuid4())[:8].upper()}")
    loyalty_points: int = 100  # Welcome points
    wallet_balance: float = 0.0
    tier: str = "Bronze"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Brand(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    logo_url: str
    category: str
    airport_id: str
    is_active: bool = True
    payment_gateway_config: Optional[Dict] = None
    logistics_webhook_url: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    brand_id: str
    name: str
    description: str
    price: float
    discount_price: Optional[float] = None
    image_url: str
    category: str
    sku: str
    stock: int = 100
    loyalty_points_earn: int = 0
    is_duty_free: bool = False
    variants: Optional[List[Dict]] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int
    variant: Optional[Dict] = None

class CartUpdate(BaseModel):
    items: List[CartItem]

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[Dict]
    subtotal: float
    shipping_fee: float
    loyalty_points_used: int = 0
    wallet_amount_used: float = 0.0
    total: float
    delivery_type: str  # 'airport' or 'home'
    delivery_address: Optional[Dict] = None
    airport_delivery_details: Optional[Dict] = None
    payment_status: str = "pending"
    order_status: str = "pending"
    tracking_status: List[Dict] = []
    loyalty_points_earned: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DeliveryDetails(BaseModel):
    delivery_type: str
    # For airport delivery
    terminal: Optional[str] = None
    gate: Optional[str] = None
    lounge: Optional[str] = None
    # For home delivery
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    contact_number: Optional[str] = None

class CheckoutRequest(BaseModel):
    delivery_details: DeliveryDetails
    use_loyalty_points: int = 0
    use_wallet_amount: float = 0.0

class Airport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    city: str
    country: str
    terminals: List[str]

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    order_id: str
    session_id: str
    amount: float
    currency: str = "usd"
    payment_status: str = "initiated"
    metadata: Optional[Dict] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        mobile=user_data.mobile
    )
    
    user_dict = user.model_dump()
    user_dict["password_hash"] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    token = create_token(user.id, user.email)
    
    return {
        "message": "Registration successful",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "loyalty_id": user.loyalty_id,
            "loyalty_points": user.loyalty_points,
            "wallet_balance": user.wallet_balance,
            "tier": user.tier
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "loyalty_id": user["loyalty_id"],
            "loyalty_points": user.get("loyalty_points", 0),
            "wallet_balance": user.get("wallet_balance", 0.0),
            "tier": user.get("tier", "Bronze")
        }
    }

@api_router.post("/auth/send-otp")
async def send_otp(mobile: str):
    # Generate OTP (In production, send via SMS)
    otp = ''.join(random.choices(string.digits, k=6))
    await db.otps.update_one(
        {"mobile": mobile},
        {"$set": {"otp": otp, "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    # In production, send via Twilio/SMS service
    return {"message": "OTP sent successfully", "otp": otp}  # Remove otp in production

@api_router.post("/auth/verify-otp")
async def verify_otp(data: OTPVerify):
    stored = await db.otps.find_one({"mobile": data.mobile}, {"_id": 0})
    if not stored or stored.get("otp") != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    await db.otps.delete_one({"mobile": data.mobile})
    return {"message": "OTP verified successfully", "verified": True}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "mobile": user.get("mobile", ""),
        "loyalty_id": user["loyalty_id"],
        "loyalty_points": user.get("loyalty_points", 0),
        "wallet_balance": user.get("wallet_balance", 0.0),
        "tier": user.get("tier", "Bronze")
    }

# ============== AIRPORT ROUTES ==============

@api_router.get("/airports")
async def get_airports():
    airports = await db.airports.find({}, {"_id": 0}).to_list(100)
    if not airports:
        # Seed default airports
        default_airports = [
            {"id": str(uuid.uuid4()), "name": "Indira Gandhi International Airport", "code": "DEL", "city": "New Delhi", "country": "India", "terminals": ["T1", "T2", "T3"]},
            {"id": str(uuid.uuid4()), "name": "Chhatrapati Shivaji Maharaj International Airport", "code": "BOM", "city": "Mumbai", "country": "India", "terminals": ["T1", "T2"]},
            {"id": str(uuid.uuid4()), "name": "Kempegowda International Airport", "code": "BLR", "city": "Bangalore", "country": "India", "terminals": ["T1", "T2"]},
            {"id": str(uuid.uuid4()), "name": "Dubai International Airport", "code": "DXB", "city": "Dubai", "country": "UAE", "terminals": ["T1", "T2", "T3"]},
            {"id": str(uuid.uuid4()), "name": "Singapore Changi Airport", "code": "SIN", "city": "Singapore", "country": "Singapore", "terminals": ["T1", "T2", "T3", "T4"]},
        ]
        await db.airports.insert_many(default_airports)
        airports = default_airports
    # Remove duplicates by code
    seen = set()
    unique = []
    for a in airports:
        if a["code"] not in seen:
            seen.add(a["code"])
            unique.append(a)
    return unique

@api_router.post("/airports")
async def create_airport(airport: Airport):
    # Check if airport with same code exists
    existing = await db.airports.find_one({"code": airport.code})
    if existing:
        return {"message": "Airport already exists", "id": existing.get("id")}
    airport_dict = airport.model_dump()
    await db.airports.insert_one(airport_dict)
    return await db.airports.find_one({"id": airport.id}, {"_id": 0})

# ============== BRAND ROUTES ==============

@api_router.get("/brands")
async def get_brands(airport_id: Optional[str] = None, category: Optional[str] = None):
    query = {"is_active": True}
    if airport_id:
        query["airport_id"] = airport_id
    if category:
        query["category"] = category
    
    brands = await db.brands.find(query, {"_id": 0}).to_list(100)
    return brands

@api_router.get("/brands/{brand_id}")
async def get_brand(brand_id: str):
    brand = await db.brands.find_one({"id": brand_id}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand

@api_router.post("/brands")
async def create_brand(brand: Brand):
    brand_dict = brand.model_dump()
    await db.brands.insert_one(brand_dict)
    created = await db.brands.find_one({"id": brand.id}, {"_id": 0})
    return created

# ============== PRODUCT ROUTES ==============

@api_router.get("/products")
async def get_products(
    brand_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    duty_free: Optional[bool] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {}
    if brand_id:
        query["brand_id"] = brand_id
    if category:
        query["category"] = category
    if duty_free is not None:
        query["is_duty_free"] = duty_free
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents(query)
    
    return {"products": products, "total": total}

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get brand info
    brand = await db.brands.find_one({"id": product["brand_id"]}, {"_id": 0})
    product["brand"] = brand
    
    return product

@api_router.post("/products")
async def create_product(product: Product):
    product_dict = product.model_dump()
    result = await db.products.insert_one(product_dict)
    # Return without _id
    created = await db.products.find_one({"id": product.id}, {"_id": 0})
    return created

# ============== CART ROUTES ==============

@api_router.get("/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart:
        return {"items": [], "subtotal": 0, "loyalty_points_earnable": 0}
    
    # Populate product details
    items_with_details = []
    subtotal = 0
    loyalty_points_earnable = 0
    
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            price = product.get("discount_price") or product["price"]
            item_total = price * item["quantity"]
            subtotal += item_total
            loyalty_points_earnable += product.get("loyalty_points_earn", 0) * item["quantity"]
            
            items_with_details.append({
                **item,
                "product": product,
                "item_total": item_total
            })
    
    return {
        "items": items_with_details,
        "subtotal": subtotal,
        "loyalty_points_earnable": loyalty_points_earnable
    }

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]})
    
    if not cart:
        cart = {"user_id": user["id"], "items": []}
    
    # Check if item already exists
    existing_idx = None
    for idx, existing_item in enumerate(cart.get("items", [])):
        if existing_item["product_id"] == item.product_id:
            existing_idx = idx
            break
    
    if existing_idx is not None:
        cart["items"][existing_idx]["quantity"] += item.quantity
    else:
        cart["items"].append(item.model_dump())
    
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$set": {"items": cart["items"]}},
        upsert=True
    )
    
    return {"message": "Item added to cart"}

@api_router.post("/cart/update")
async def update_cart(cart_update: CartUpdate, user: dict = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$set": {"items": [item.model_dump() for item in cart_update.items]}},
        upsert=True
    )
    return {"message": "Cart updated"}

@api_router.delete("/cart/item/{product_id}")
async def remove_from_cart(product_id: str, user: dict = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart(user: dict = Depends(get_current_user)):
    await db.carts.delete_one({"user_id": user["id"]})
    return {"message": "Cart cleared"}

# ============== CHECKOUT & PAYMENT ROUTES ==============

@api_router.post("/checkout/calculate")
async def calculate_checkout(checkout: CheckoutRequest, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate subtotal
    subtotal = 0
    loyalty_points_earnable = 0
    
    for item in cart["items"]:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            price = product.get("discount_price") or product["price"]
            subtotal += price * item["quantity"]
            loyalty_points_earnable += product.get("loyalty_points_earn", 0) * item["quantity"]
    
    # Calculate shipping
    shipping_fee = 0.0
    if checkout.delivery_details.delivery_type == "home":
        if subtotal < 100:
            shipping_fee = 10.0
        elif subtotal < 200:
            shipping_fee = 5.0
    elif checkout.delivery_details.delivery_type == "airport":
        if subtotal < 50:
            shipping_fee = 2.0
    
    # Apply loyalty points (1 point = $0.01)
    loyalty_discount = min(checkout.use_loyalty_points * 0.01, subtotal * 0.2)  # Max 20% discount
    available_points = user.get("loyalty_points", 0)
    if checkout.use_loyalty_points > available_points:
        raise HTTPException(status_code=400, detail="Insufficient loyalty points")
    
    # Apply wallet
    wallet_discount = min(checkout.use_wallet_amount, user.get("wallet_balance", 0), subtotal - loyalty_discount)
    
    total = subtotal + shipping_fee - loyalty_discount - wallet_discount
    
    return {
        "subtotal": subtotal,
        "shipping_fee": shipping_fee,
        "loyalty_discount": loyalty_discount,
        "wallet_discount": wallet_discount,
        "total": max(total, 0),
        "loyalty_points_earnable": loyalty_points_earnable
    }

@api_router.post("/checkout/create-payment")
async def create_payment(checkout: CheckoutRequest, request: Request, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    # Calculate totals
    calculation = await calculate_checkout(checkout, user)
    
    if calculation["total"] <= 0:
        raise HTTPException(status_code=400, detail="Invalid total amount")
    
    # Get cart items for metadata
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    
    # Create order first
    order = Order(
        user_id=user["id"],
        items=cart["items"],
        subtotal=calculation["subtotal"],
        shipping_fee=calculation["shipping_fee"],
        loyalty_points_used=checkout.use_loyalty_points,
        wallet_amount_used=calculation["wallet_discount"],
        total=calculation["total"],
        delivery_type=checkout.delivery_details.delivery_type,
        delivery_address=checkout.delivery_details.model_dump() if checkout.delivery_details.delivery_type == "home" else None,
        airport_delivery_details=checkout.delivery_details.model_dump() if checkout.delivery_details.delivery_type == "airport" else None,
        loyalty_points_earned=calculation["loyalty_points_earnable"]
    )
    
    order_dict = order.model_dump()
    await db.orders.insert_one(order_dict)
    
    # Setup Stripe
    api_key = os.environ.get('STRIPE_API_KEY')
    host_url = str(request.base_url).rstrip('/')
    
    # For frontend URLs, use the origin header or construct from env
    frontend_url = request.headers.get('origin', os.environ.get('FRONTEND_URL', host_url))
    
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    success_url = f"{frontend_url}/order-confirmation?session_id={{CHECKOUT_SESSION_ID}}&order_id={order.id}"
    cancel_url = f"{frontend_url}/cart"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(calculation["total"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order.id,
            "user_id": user["id"],
            "user_email": user["email"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    payment_txn = PaymentTransaction(
        user_id=user["id"],
        order_id=order.id,
        session_id=session.session_id,
        amount=calculation["total"],
        currency="usd",
        payment_status="initiated",
        metadata={"order_id": order.id}
    )
    await db.payment_transactions.insert_one(payment_txn.model_dump())
    
    return {
        "checkout_url": session.url,
        "session_id": session.session_id,
        "order_id": order.id
    }

@api_router.get("/checkout/status/{session_id}")
async def get_payment_status(session_id: str, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update payment transaction
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": status.payment_status}}
    )
    
    # If paid, update order and user balances
    if status.payment_status == "paid":
        txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if txn:
            order = await db.orders.find_one({"id": txn["order_id"]}, {"_id": 0})
            if order and order.get("payment_status") != "paid":
                # Update order status
                await db.orders.update_one(
                    {"id": txn["order_id"]},
                    {
                        "$set": {
                            "payment_status": "paid",
                            "order_status": "confirmed",
                            "tracking_status": [{"status": "Order Confirmed", "timestamp": datetime.now(timezone.utc).isoformat()}]
                        }
                    }
                )
                
                # Deduct loyalty points and wallet
                if order.get("loyalty_points_used", 0) > 0 or order.get("wallet_amount_used", 0) > 0:
                    await db.users.update_one(
                        {"id": user["id"]},
                        {
                            "$inc": {
                                "loyalty_points": -order.get("loyalty_points_used", 0) + order.get("loyalty_points_earned", 0),
                                "wallet_balance": -order.get("wallet_amount_used", 0)
                            }
                        }
                    )
                else:
                    # Just add earned points
                    await db.users.update_one(
                        {"id": user["id"]},
                        {"$inc": {"loyalty_points": order.get("loyalty_points_earned", 0)}}
                    )
                
                # Clear cart
                await db.carts.delete_one({"user_id": user["id"]})
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key)
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            # Update order
            order_id = webhook_response.metadata.get("order_id")
            if order_id:
                await db.orders.update_one(
                    {"id": order_id},
                    {
                        "$set": {
                            "payment_status": "paid",
                            "order_status": "confirmed"
                        }
                    }
                )
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ============== ORDER ROUTES ==============

@api_router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Populate product details
    items_with_details = []
    for item in order.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            items_with_details.append({**item, "product": product})
    
    order["items"] = items_with_details
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status_user(order_id: str, status: str, user: dict = Depends(get_current_user)):
    """Update order status - for testing purposes"""
    valid_statuses = ["pending", "confirmed", "processing", "ready_for_pickup", "shipped", "in_transit", "out_for_delivery", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid: {valid_statuses}")
    
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {"order_status": status},
            "$push": {"tracking_status": {"status": status, "timestamp": datetime.now(timezone.utc).isoformat()}}
        }
    )
    
    return {"message": "Order status updated", "status": status}

# ============== WALLET & LOYALTY ROUTES ==============

@api_router.get("/wallet")
async def get_wallet(user: dict = Depends(get_current_user)):
    transactions = await db.wallet_transactions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {
        "balance": user.get("wallet_balance", 0),
        "transactions": transactions
    }

@api_router.get("/loyalty")
async def get_loyalty(user: dict = Depends(get_current_user)):
    tier_benefits = {
        "Bronze": {"discount": 0, "free_shipping_threshold": 200, "points_multiplier": 1},
        "Silver": {"discount": 5, "free_shipping_threshold": 150, "points_multiplier": 1.5},
        "Gold": {"discount": 10, "free_shipping_threshold": 100, "points_multiplier": 2},
        "Platinum": {"discount": 15, "free_shipping_threshold": 0, "points_multiplier": 3}
    }
    
    current_tier = user.get("tier", "Bronze")
    
    return {
        "loyalty_id": user["loyalty_id"],
        "points": user.get("loyalty_points", 0),
        "tier": current_tier,
        "benefits": tier_benefits.get(current_tier, tier_benefits["Bronze"]),
        "next_tier": "Silver" if current_tier == "Bronze" else "Gold" if current_tier == "Silver" else "Platinum" if current_tier == "Gold" else None,
        "points_to_next_tier": 500 if current_tier == "Bronze" else 1000 if current_tier == "Silver" else 2000 if current_tier == "Gold" else 0
    }

# ============== AI RECOMMENDATIONS ==============

@api_router.get("/recommendations")
async def get_recommendations(user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Get user's recent orders and browsing history
    recent_orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    # Get all products for recommendation
    products = await db.products.find({}, {"_id": 0}).limit(20).to_list(20)
    
    if not products:
        return {"recommendations": [], "message": "No products available"}
    
    # Create product summary for AI
    product_summary = [{"id": p["id"], "name": p["name"], "category": p["category"], "price": p["price"]} for p in products]
    
    order_history = []
    for order in recent_orders:
        for item in order.get("items", []):
            prod = await db.products.find_one({"id": item["product_id"]}, {"_id": 0, "name": 1, "category": 1})
            if prod:
                order_history.append(prod.get("category", ""))
    
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=f"rec-{user['id']}",
            system_message="You are a shopping assistant. Based on the user's purchase history and available products, recommend 4-6 product IDs that would interest them. Return ONLY a JSON array of product IDs, nothing else."
        ).with_model("openai", "gpt-5.1")
        
        user_message = UserMessage(
            text=f"User's purchase categories: {order_history if order_history else 'None yet'}. Available products: {product_summary}. Recommend products."
        )
        
        response = await chat.send_message(user_message)
        
        # Parse response to get product IDs
        import json
        try:
            # Try to extract JSON from response
            recommended_ids = json.loads(response.strip())
            if isinstance(recommended_ids, list):
                recommended_products = [p for p in products if p["id"] in recommended_ids]
                return {"recommendations": recommended_products}
        except:
            pass
        
        # Fallback: return random products
        import random
        random.shuffle(products)
        return {"recommendations": products[:6]}
        
    except Exception as e:
        logging.error(f"AI recommendation error: {e}")
        # Fallback to random recommendations
        import random
        random.shuffle(products)
        return {"recommendations": products[:6]}

# ============== BRAND DASHBOARD ROUTES ==============

@api_router.get("/brand-dashboard/orders")
async def get_brand_orders(brand_id: str, user: dict = Depends(get_current_user)):
    # In production, verify user owns this brand
    orders = await db.orders.find(
        {"items.brand_id": brand_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders

@api_router.post("/brand-dashboard/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user: dict = Depends(get_current_user)):
    valid_statuses = ["pending", "confirmed", "processing", "ready_for_pickup", "out_for_delivery", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {"order_status": status},
            "$push": {"tracking_status": {"status": status, "timestamp": datetime.now(timezone.utc).isoformat()}}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# ============== SEED DATA ==============

@api_router.post("/seed-data")
async def seed_data():
    # Check if data already exists
    existing_products = await db.products.count_documents({})
    if existing_products > 0:
        return {"message": "Data already seeded"}
    
    # Get airports
    airports = await db.airports.find({}, {"_id": 0}).to_list(10)
    if not airports:
        airports = await get_airports()
    
    delhi_airport_id = next((a["id"] for a in airports if a["code"] == "DEL"), airports[0]["id"])
    
    # Seed brands
    brands = [
        {"id": str(uuid.uuid4()), "name": "Dior", "description": "Luxury French fashion house", "logo_url": "https://images.unsplash.com/photo-1587304946976-cbbbafce2133?w=200", "category": "Perfumes", "airport_id": delhi_airport_id, "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Johnnie Walker", "description": "Premium Scotch whisky", "logo_url": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=200", "category": "Spirits", "airport_id": delhi_airport_id, "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Godiva", "description": "Belgian luxury chocolates", "logo_url": "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=200", "category": "Chocolates", "airport_id": delhi_airport_id, "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Ray-Ban", "description": "Iconic sunglasses brand", "logo_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=200", "category": "Accessories", "airport_id": delhi_airport_id, "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Montblanc", "description": "Luxury writing instruments", "logo_url": "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=200", "category": "Accessories", "airport_id": delhi_airport_id, "is_active": True},
    ]
    await db.brands.insert_many(brands)
    
    # Seed products
    products = [
        # Dior products
        {"id": str(uuid.uuid4()), "brand_id": brands[0]["id"], "name": "Sauvage Eau de Parfum", "description": "A bold, fresh fragrance with notes of bergamot and Sichuan pepper", "price": 125.00, "discount_price": 99.00, "image_url": "https://images.unsplash.com/photo-1587304946976-cbbbafce2133?w=500", "category": "Perfumes", "sku": "DIOR-SAU-100", "stock": 50, "loyalty_points_earn": 25, "is_duty_free": True},
        {"id": str(uuid.uuid4()), "brand_id": brands[0]["id"], "name": "Miss Dior Blooming Bouquet", "description": "A delicate floral fragrance for women", "price": 110.00, "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500", "category": "Perfumes", "sku": "DIOR-MIS-100", "stock": 40, "loyalty_points_earn": 22, "is_duty_free": True},
        
        # Johnnie Walker products
        {"id": str(uuid.uuid4()), "brand_id": brands[1]["id"], "name": "Blue Label", "description": "The pinnacle of Johnnie Walker whisky", "price": 229.00, "discount_price": 199.00, "image_url": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=500", "category": "Spirits", "sku": "JW-BLUE-750", "stock": 30, "loyalty_points_earn": 50, "is_duty_free": True},
        {"id": str(uuid.uuid4()), "brand_id": brands[1]["id"], "name": "Gold Label Reserve", "description": "Smooth and creamy with honey and fruit notes", "price": 79.00, "image_url": "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=500", "category": "Spirits", "sku": "JW-GOLD-750", "stock": 45, "loyalty_points_earn": 16, "is_duty_free": True},
        
        # Godiva products
        {"id": str(uuid.uuid4()), "brand_id": brands[2]["id"], "name": "Gold Collection Gift Box", "description": "Assorted Belgian chocolates in elegant gold box", "price": 65.00, "discount_price": 55.00, "image_url": "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=500", "category": "Chocolates", "sku": "GOD-GOLD-36", "stock": 60, "loyalty_points_earn": 13, "is_duty_free": True},
        {"id": str(uuid.uuid4()), "brand_id": brands[2]["id"], "name": "Dark Chocolate Truffles", "description": "Rich dark chocolate truffles", "price": 45.00, "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500", "category": "Chocolates", "sku": "GOD-DARK-24", "stock": 55, "loyalty_points_earn": 9, "is_duty_free": True},
        
        # Ray-Ban products
        {"id": str(uuid.uuid4()), "brand_id": brands[3]["id"], "name": "Aviator Classic", "description": "Iconic gold frame aviator sunglasses", "price": 175.00, "discount_price": 149.00, "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500", "category": "Accessories", "sku": "RB-AVI-GLD", "stock": 35, "loyalty_points_earn": 35, "is_duty_free": False},
        {"id": str(uuid.uuid4()), "brand_id": brands[3]["id"], "name": "Wayfarer", "description": "Classic black wayfarer sunglasses", "price": 155.00, "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500", "category": "Accessories", "sku": "RB-WAY-BLK", "stock": 40, "loyalty_points_earn": 31, "is_duty_free": False},
        
        # Montblanc products
        {"id": str(uuid.uuid4()), "brand_id": brands[4]["id"], "name": "Meisterstück Gold Ballpoint", "description": "Iconic luxury ballpoint pen", "price": 495.00, "discount_price": 449.00, "image_url": "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=500", "category": "Accessories", "sku": "MB-MEIS-BP", "stock": 20, "loyalty_points_earn": 100, "is_duty_free": False},
        {"id": str(uuid.uuid4()), "brand_id": brands[4]["id"], "name": "Explorer Leather Wallet", "description": "Premium black leather wallet", "price": 325.00, "image_url": "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500", "category": "Accessories", "sku": "MB-EXP-WAL", "stock": 25, "loyalty_points_earn": 65, "is_duty_free": False},
    ]
    await db.products.insert_many(products)
    
    return {"message": "Data seeded successfully", "brands": len(brands), "products": len(products)}

# ============== CATEGORIES ==============

@api_router.get("/categories")
async def get_categories():
    categories = await db.products.distinct("category")
    return categories if categories else ["Perfumes", "Spirits", "Chocolates", "Accessories", "Electronics", "Fashion"]

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "JetShop API - Airport E-commerce Portal"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

# Include Brand Admin and Logistics routes
try:
    from routes.brand_admin import brand_router
    app.include_router(brand_router)
except ImportError as e:
    logging.warning(f"Could not import brand_router: {e}")

try:
    from routes.logistics import logistics_router
    app.include_router(logistics_router)
except ImportError as e:
    logging.warning(f"Could not import logistics_router: {e}")

try:
    from routes.super_admin import admin_router
    app.include_router(admin_router)
except ImportError as e:
    logging.warning(f"Could not import admin_router: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
