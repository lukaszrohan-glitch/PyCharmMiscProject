"""Pydantic models (schemas) for data validation and serialization."""

from pydantic import BaseModel, Field, condecimal, field_validator, ConfigDict
from typing import Optional, List
from datetime import date
from decimal import Decimal, InvalidOperation
from enum import Enum


class OrderStatus(str, Enum):
    """Enum for order statuses."""
    New = "New"
    Planned = "Planned"
    InProd = "InProd"
    Done = "Done"
    Invoiced = "Invoiced"


class InventoryReason(str, Enum):
    """Enum for inventory transaction reasons."""
    PO = "PO"
    WO = "WO"
    Sale = "Sale"
    Adjust = "Adjust"
    Adjustment = "Adjustment"


class Order(BaseModel):
    """Read model for an order."""
    model_config = ConfigDict(from_attributes=True)

    order_id: str
    customer_id: str
    status: OrderStatus
    order_date: Optional[date] = None
    due_date: Optional[date] = None
    contact_person: Optional[str] = None


class Finance(BaseModel):
    """Read model for financial data related to an order."""
    model_config = ConfigDict(from_attributes=True)

    order_id: str
    revenue: Optional[condecimal(max_digits=18, decimal_places=4)] = None
    material_cost: Optional[condecimal(max_digits=18, decimal_places=4)] = None
    labor_cost: Optional[condecimal(max_digits=18, decimal_places=4)] = None
    gross_margin: Optional[condecimal(max_digits=18, decimal_places=4)] = None


# ----- WRITE MODELS (requests) -----
class OrderCreate(BaseModel):
    """Write model for creating a new order."""
    model_config = ConfigDict(from_attributes=True)

    order_id: str = Field(..., min_length=1)
    customer_id: str = Field(..., min_length=1)
    status: OrderStatus = OrderStatus.New
    due_date: Optional[date] = None
    contact_person: Optional[str] = None


class OrderUpdate(BaseModel):
    """Write model for updating an existing order."""
    model_config = ConfigDict(from_attributes=True)

    customer_id: Optional[str] = None
    status: Optional[OrderStatus] = None
    due_date: Optional[date] = None
    contact_person: Optional[str] = None


class OrderLineCreate(BaseModel):
    """Write model for creating a new order line."""
    model_config = ConfigDict(from_attributes=True)

    order_id: str
    line_no: int = Field(..., gt=0)
    product_id: str
    qty: condecimal(max_digits=18, decimal_places=4) = Field(..., gt=0)
    unit_price: condecimal(max_digits=18, decimal_places=4) = Field(..., ge=0)
    discount_pct: condecimal(max_digits=6, decimal_places=4) = Field(
        Decimal("0"), ge=0, le=Decimal("0.9")
    )
    graphic_id: Optional[str] = None

    @field_validator("discount_pct", mode="before")
    def normalize_discount(cls, v):
        """Normalize discount value to a Decimal with 4 places."""
        if v is None:
            return Decimal("0")
        try:
            d = Decimal(str(v))
            return d.quantize(Decimal("0.0001"))
        except (InvalidOperation, TypeError):
            return Decimal("0")


class TimesheetCreate(BaseModel):
    """Write model for creating a new timesheet entry."""
    model_config = ConfigDict(from_attributes=True)

    emp_id: str
    ts_date: Optional[date] = None
    order_id: Optional[str] = None
    operation_no: Optional[int] = None
    hours: condecimal(max_digits=10, decimal_places=2) = Field(..., ge=0)
    notes: Optional[str] = None


class InventoryCreate(BaseModel):
    """Write model for creating a new inventory transaction."""
    model_config = ConfigDict(from_attributes=True)

    txn_id: str
    txn_date: Optional[date] = None
    product_id: str
    qty_change: condecimal(max_digits=18, decimal_places=4)
    reason: InventoryReason
    lot: Optional[str] = None
    location: Optional[str] = None


class UserPublic(BaseModel):
    """Public-facing user model, safe to return from API."""
    model_config = ConfigDict(from_attributes=True)
    user_id: str
    email: str
    company_id: Optional[str] = None
    is_admin: bool = False
    active: bool = True
    subscription_plan: Optional[str] = None


class UserCreateAdmin(BaseModel):
    """Model for an admin creating a new user."""
    email: str = Field(..., min_length=5)
    company_id: Optional[str] = None
    is_admin: bool = False
    subscription_plan: Optional[str] = "free"
    password: Optional[str] = None  # optional initial password supplied by admin


class UserLogin(BaseModel):
    """Model for user login request."""
    email: str
    password: str


class PasswordChange(BaseModel):
    """Model for user changing their own password."""
    old_password: str
    new_password: str = Field(..., min_length=8)


class SubscriptionPlanCreate(BaseModel):
    """Model for creating a new subscription plan."""
    plan_id: str
    name: str
    max_orders: Optional[int] = None
    max_users: Optional[int] = None
    features: Optional[List[str]] = None


class SubscriptionPlan(BaseModel):
    """Read model for a subscription plan."""
    plan_id: str
    name: str
    max_orders: Optional[int] = None
    max_users: Optional[int] = None
    features: Optional[List[str]] = None


class PasswordResetRequest(BaseModel):
    """Model for requesting a password reset."""
    email: str = Field(..., min_length=5)


class PasswordReset(BaseModel):
    """Model for performing a password reset with a token."""
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class Product(BaseModel):
    """Read model for a product."""
    model_config = ConfigDict(from_attributes=True)
    product_id: str
    name: str
    unit: str = "pcs"
    std_cost: Optional[Decimal] = Decimal("0")
    price: Optional[Decimal] = Decimal("0")
    vat_rate: Optional[Decimal] = Decimal("23")


class ProductCreate(BaseModel):
    """Write model for creating a new product."""
    model_config = ConfigDict(from_attributes=True)
    product_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    unit: str = "pcs"
    std_cost: Optional[Decimal] = Decimal("0")
    price: Optional[Decimal] = Decimal("0")
    vat_rate: Optional[Decimal] = Decimal("23")


class ProductUpdate(BaseModel):
    """Write model for updating an existing product."""
    model_config = ConfigDict(from_attributes=True)
    name: Optional[str] = None
    unit: Optional[str] = None
    std_cost: Optional[Decimal] = None
    price: Optional[Decimal] = None
    vat_rate: Optional[Decimal] = None


class Customer(BaseModel):
    """Read model for a customer."""
    model_config = ConfigDict(from_attributes=True)
    customer_id: str
    name: str
    nip: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    contact_person: Optional[str] = None


class CustomerCreate(BaseModel):
    """Write model for creating a new customer."""
    model_config = ConfigDict(from_attributes=True)
    customer_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    nip: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    contact_person: Optional[str] = None


class CustomerUpdate(BaseModel):
    """Write model for updating an existing customer."""
    model_config = ConfigDict(from_attributes=True)
    name: Optional[str] = None
    nip: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    contact_person: Optional[str] = None


class Employee(BaseModel):
    """Read model for an employee."""
    model_config = ConfigDict(from_attributes=True)
    emp_id: str
    name: str
    role: Optional[str] = None
    hourly_rate: Optional[Decimal] = Decimal("0")


class EmployeeCreate(BaseModel):
    """Write model for creating a new employee."""
    model_config = ConfigDict(from_attributes=True)
    emp_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    role: Optional[str] = None
    hourly_rate: Optional[Decimal] = Decimal("0")


class EmployeeUpdate(BaseModel):
    """Write model for updating an existing employee."""
    model_config = ConfigDict(from_attributes=True)
    name: Optional[str] = None
    role: Optional[str] = None
    hourly_rate: Optional[Decimal] = None


class Timesheet(BaseModel):
    """Read model for a timesheet entry."""
    model_config = ConfigDict(from_attributes=True)
    ts_id: int
    emp_id: str
    ts_date: date
    order_id: Optional[str] = None
    operation_no: Optional[int] = None
    hours: Decimal
    notes: Optional[str] = None


class TimesheetUpdate(BaseModel):
    """Write model for updating an existing timesheet entry."""
    model_config = ConfigDict(from_attributes=True)
    emp_id: Optional[str] = None
    ts_date: Optional[date] = None
    order_id: Optional[str] = None
    operation_no: Optional[int] = None
    hours: Optional[Decimal] = None
    notes: Optional[str] = None


class Inventory(BaseModel):
    """Read model for an inventory transaction."""
    model_config = ConfigDict(from_attributes=True)
    txn_id: str
    txn_date: date
    product_id: str
    qty_change: Decimal
    reason: InventoryReason
    lot: Optional[str] = None
    location: Optional[str] = None


class InventoryUpdate(BaseModel):
    """Write model for updating an existing inventory transaction."""
    model_config = ConfigDict(from_attributes=True)
    txn_date: Optional[date] = None
    product_id: Optional[str] = None
    qty_change: Optional[Decimal] = None
    reason: Optional[InventoryReason] = None
    lot: Optional[str] = None
    location: Optional[str] = None


class RevenueByMonth(BaseModel):
    month: date
    revenue: Decimal = Decimal("0")
    margin: Decimal = Decimal("0")
    margin_pct: Optional[Decimal] = None


class TopCustomer(BaseModel):
    customer_id: str
    name: Optional[str] = None
    revenue: Decimal = Decimal("0")
    margin: Decimal = Decimal("0")
    orders_count: int = 0


class TopOrder(BaseModel):
    order_id: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    revenue: Decimal = Decimal("0")
    margin: Decimal = Decimal("0")


class AnalyticsSummary(BaseModel):
    total_revenue: Decimal = Decimal("0")
    total_margin: Decimal = Decimal("0")
    margin_pct: Optional[Decimal] = None
    revenue_yoy_change_pct: Optional[Decimal] = None
    top_customer: Optional[TopCustomer] = None

