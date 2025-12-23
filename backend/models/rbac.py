"""
RBAC (Role-Based Access Control) Module for JetShop
Supports: Customers, Brand Admins, Logistics Partners, Super Admins
"""

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid
from datetime import datetime, timezone

# ============== ENUMS ==============

class UserRole(str, Enum):
    CUSTOMER = "customer"
    BRAND_ADMIN = "brand_admin"
    LOGISTICS_PARTNER = "logistics_partner"
    SUPER_ADMIN = "super_admin"

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    READY_FOR_PICKUP = "ready_for_pickup"
    SHIPPED = "shipped"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    INITIATED = "initiated"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"

# ============== BASE USER MODEL ==============

class BaseUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    mobile: str
    role: UserRole
    is_active: bool = True
    is_verified: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============== BRAND ADMIN MODELS ==============

class BrandAdminCreate(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    password: str
    brand_name: str
    brand_description: str
    brand_category: str
    airport_id: str
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None

class BrandAdminLogin(BaseModel):
    email: EmailStr
    password: str

class BrandBankDetails(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    brand_id: str
    account_holder_name: str
    account_number: str  # Will be encrypted
    bank_name: str
    ifsc_code: str
    branch_name: str
    account_type: str = "current"  # current/savings
    # Stripe Connect details
    stripe_account_id: Optional[str] = None
    stripe_account_status: str = "pending"  # pending/active/restricted
    payout_enabled: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BrandAdmin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # References BaseUser
    brand_id: str  # References Brand
    permissions: List[str] = ["view_products", "manage_products", "view_orders", "manage_orders", "view_inventory", "manage_inventory", "view_analytics"]
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BrandProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    logo_url: str
    category: str
    airport_id: str
    is_active: bool = True
    is_verified: bool = False
    # Business details
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    business_address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    # Payment config
    commission_rate: float = 10.0  # Platform commission percentage
    bank_details_id: Optional[str] = None
    stripe_account_id: Optional[str] = None
    # Logistics config
    logistics_partner_id: Optional[str] = None
    logistics_webhook_url: Optional[str] = None
    # Store config
    store_location: Optional[str] = None
    operating_hours: Optional[Dict] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============== LOGISTICS PARTNER MODELS ==============

class LogisticsPartnerCreate(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    password: str
    company_name: str
    service_type: str  # airport_delivery, home_delivery, both
    airport_ids: List[str]

class LogisticsPartner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # References BaseUser
    company_name: str
    service_type: str
    airport_ids: List[str]
    is_active: bool = True
    is_verified: bool = False
    # Contact details
    contact_email: str
    contact_phone: str
    # Performance metrics
    total_deliveries: int = 0
    successful_deliveries: int = 0
    avg_delivery_time_mins: float = 0.0
    rating: float = 5.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DeliveryRunner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    logistics_partner_id: str
    name: str
    mobile: str
    email: Optional[str] = None
    airport_id: str
    is_active: bool = True
    is_available: bool = True
    current_order_id: Optional[str] = None
    total_deliveries: int = 0
    rating: float = 5.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============== INVENTORY MODELS ==============

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    brand_id: str
    product_id: str
    sku: str
    quantity: int = 0
    reserved_quantity: int = 0  # Reserved for pending orders
    min_stock_level: int = 10
    max_stock_level: int = 1000
    reorder_point: int = 20
    location: Optional[str] = None  # Store location in airport
    last_restocked: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class InventoryLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    inventory_id: str
    brand_id: str
    product_id: str
    action: str  # stock_in, stock_out, adjustment, reserve, release
    quantity_change: int
    previous_quantity: int
    new_quantity: int
    reason: str
    performed_by: str  # User ID
    order_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============== PRODUCT MANAGEMENT ==============

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    discount_price: Optional[float] = None
    image_url: str
    images: Optional[List[str]] = None
    category: str
    sku: str
    stock: int = 100
    loyalty_points_earn: int = 0
    is_duty_free: bool = False
    variants: Optional[List[Dict]] = None
    weight: Optional[float] = None
    dimensions: Optional[Dict] = None
    tax_rate: Optional[float] = None
    hsn_code: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    loyalty_points_earn: Optional[int] = None
    is_duty_free: Optional[bool] = None
    is_active: Optional[bool] = None
    variants: Optional[List[Dict]] = None

# ============== ORDER MANAGEMENT FOR BRANDS ==============

class BrandOrderItem(BaseModel):
    product_id: str
    product_name: str
    sku: str
    quantity: int
    unit_price: float
    total_price: float
    status: str = "pending"  # pending, accepted, preparing, ready, picked_up

class BrandOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    order_id: str  # Main order ID
    brand_id: str
    customer_id: str
    items: List[BrandOrderItem]
    subtotal: float
    commission_amount: float
    net_amount: float  # Amount to be paid to brand
    status: str = "pending"
    delivery_type: str
    delivery_details: Dict
    accepted_at: Optional[str] = None
    prepared_at: Optional[str] = None
    picked_up_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============== DELIVERY ASSIGNMENT ==============

class DeliveryAssignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    brand_order_id: str
    logistics_partner_id: str
    runner_id: Optional[str] = None
    delivery_type: str  # airport, home
    pickup_location: str
    delivery_location: str
    status: str = "pending"  # pending, assigned, picked_up, in_transit, delivered, failed
    estimated_pickup_time: Optional[str] = None
    actual_pickup_time: Optional[str] = None
    estimated_delivery_time: Optional[str] = None
    actual_delivery_time: Optional[str] = None
    tracking_updates: List[Dict] = []
    customer_otp: Optional[str] = None  # For delivery verification
    delivery_proof: Optional[str] = None  # Image URL
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============== SETTLEMENT/PAYOUT ==============

class Settlement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    brand_id: str
    period_start: str
    period_end: str
    total_orders: int
    total_sales: float
    total_commission: float
    total_deductions: float
    net_payout: float
    status: str = "pending"  # pending, processing, completed, failed
    payout_reference: Optional[str] = None
    payout_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============== AUDIT LOG ==============

class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_role: str
    action: str
    resource_type: str  # product, order, inventory, user, etc.
    resource_id: str
    details: Dict
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
