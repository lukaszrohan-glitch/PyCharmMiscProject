from pydantic import BaseModel, Field, condecimal, field_validator, ConfigDict
from typing import Optional, List
from datetime import date
from decimal import Decimal
from enum import Enum


class OrderStatus(str, Enum):
    New = "New"
    Planned = "Planned"
    InProd = "InProd"
    Done = "Done"
    Invoiced = "Invoiced"


class InventoryReason(str, Enum):
    PO = "PO"
    WO = "WO"
    Sale = "Sale"
    Adjust = "Adjust"


class Order(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: str
    customer_id: str
    status: OrderStatus
    order_date: Optional[date] = None
    due_date: Optional[date] = None


class Finance(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: str
    revenue: Optional[condecimal(max_digits=18, decimal_places=4)] = None
    material_cost: Optional[condecimal(max_digits=18, decimal_places=4)] = None
    labor_cost: Optional[condecimal(max_digits=18, decimal_places=4)] = None
    gross_margin: Optional[condecimal(max_digits=18, decimal_places=4)] = None


# ----- WRITE MODELS (requests) -----
class OrderCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: str = Field(..., min_length=1)
    customer_id: str = Field(..., min_length=1)
    status: OrderStatus = OrderStatus.New
    due_date: Optional[date] = None


class OrderUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    customer_id: Optional[str] = None
    status: Optional[OrderStatus] = None
    due_date: Optional[date] = None


class OrderLineCreate(BaseModel):
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
        if v is None:
            return Decimal("0")
        try:
            d = Decimal(str(v))
            return d.quantize(Decimal("0.0001"))
        except Exception:
            return Decimal("0")


class TimesheetCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    emp_id: str
    ts_date: Optional[date] = None
    order_id: Optional[str] = None
    operation_no: Optional[int] = None
    hours: condecimal(max_digits=10, decimal_places=2) = Field(..., ge=0)
    notes: Optional[str] = None


class InventoryCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    txn_id: str
    txn_date: Optional[date] = None
    product_id: str
    qty_change: condecimal(max_digits=18, decimal_places=4)
    reason: InventoryReason
    lot: Optional[str] = None
    location: Optional[str] = None


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: str
    email: str
    company_id: Optional[str] = None
    is_admin: bool = False
    active: bool = True
    subscription_plan: Optional[str] = None


class UserCreateAdmin(BaseModel):
    email: str = Field(..., min_length=5)
    company_id: Optional[str] = None
    is_admin: bool = False
    subscription_plan: Optional[str] = "free"
    password: Optional[str] = None  # optional initial password supplied by admin


class UserLogin(BaseModel):
    email: str
    password: str


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)


class SubscriptionPlanCreate(BaseModel):
    plan_id: str
    name: str
    max_orders: Optional[int] = None
    max_users: Optional[int] = None
    features: Optional[List[str]] = None


class SubscriptionPlan(BaseModel):
    plan_id: str
    name: str
    max_orders: Optional[int] = None
    max_users: Optional[int] = None
    features: Optional[List[str]] = None


class PasswordResetRequest(BaseModel):
    email: str = Field(..., min_length=5)


class PasswordReset(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class Product(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: str
    name: str
    unit: str = "pcs"
    std_cost: Optional[Decimal] = Decimal("0")
    price: Optional[Decimal] = Decimal("0")
    vat_rate: Optional[Decimal] = Decimal("23")


class ProductCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    unit: str = "pcs"
    std_cost: Optional[Decimal] = Decimal("0")
    price: Optional[Decimal] = Decimal("0")
    vat_rate: Optional[Decimal] = Decimal("23")


class ProductUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: Optional[str] = None
    unit: Optional[str] = None
    std_cost: Optional[Decimal] = None
    price: Optional[Decimal] = None
    vat_rate: Optional[Decimal] = None


class Customer(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    customer_id: str
    name: str
    nip: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None


class CustomerCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    customer_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    nip: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None


class CustomerUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: Optional[str] = None
    nip: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None


class Employee(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    emp_id: str
    name: str
    role: Optional[str] = None
    hourly_rate: Optional[Decimal] = Decimal("0")


class EmployeeCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    emp_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    role: Optional[str] = None
    hourly_rate: Optional[Decimal] = Decimal("0")


class EmployeeUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: Optional[str] = None
    role: Optional[str] = None
    hourly_rate: Optional[Decimal] = None


class Timesheet(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    ts_id: int
    emp_id: str
    ts_date: date
    order_id: Optional[str] = None
    operation_no: Optional[int] = None
    hours: Decimal
    notes: Optional[str] = None


class TimesheetUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    emp_id: Optional[str] = None
    ts_date: Optional[date] = None
    order_id: Optional[str] = None
    operation_no: Optional[int] = None
    hours: Optional[Decimal] = None
    notes: Optional[str] = None


class Inventory(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    txn_id: str
    txn_date: date
    product_id: str
    qty_change: Decimal
    reason: InventoryReason
    lot: Optional[str] = None
    location: Optional[str] = None


class InventoryUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    txn_date: Optional[date] = None
    product_id: Optional[str] = None
    qty_change: Optional[Decimal] = None
    reason: Optional[InventoryReason] = None
    lot: Optional[str] = None
    location: Optional[str] = None
