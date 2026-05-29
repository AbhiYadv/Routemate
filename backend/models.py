from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any, Dict
import uuid
from datetime import datetime
from enum import Enum

class RoleEnum(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    DRIVER = "DRIVER"
    COMPANY_ADMIN = "COMPANY_ADMIN"
    VENDOR_ADMIN = "VENDOR_ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"

class RideTypeEnum(str, Enum):
    CARPOOL = "CARPOOL"
    SHUTTLE = "SHUTTLE"
    CAB = "CAB"

class RideStatusEnum(str, Enum):
    SCHEDULED = "SCHEDULED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class BookingStatusEnum(str, Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"

class SeverityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class EventStatusEnum(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"

# Models
class Company(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    allowed_email_domains: List[str] = []
    status: str = "ACTIVE"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: RoleEnum = RoleEnum.EMPLOYEE
    home_area: Optional[str] = None
    office_location_id: Optional[str] = None
    usual_start_time: Optional[str] = None
    usual_return_time: Optional[str] = None
    preferred_commute_mode: Optional[str] = None
    safety_preference: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    company_id: str

class UserInDB(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    password_hash: str
    verification_status: str = "VERIFIED"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OfficeLocation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    name: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Corridor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    name: str
    origin_area: str
    destination_office_id: str
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StopDetail(BaseModel):
    area: str
    time: str
    type: str # "PICKUP" or "DROP"

class Ride(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    corridor_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    driver_user_id: Optional[str] = None
    vendor_id: Optional[str] = None
    ride_type: RideTypeEnum
    origin_area: str
    destination_office_id: str
    departure_time: datetime
    estimated_arrival_time: datetime
    available_seats: int
    total_seats: int
    status: RideStatusEnum = RideStatusEnum.SCHEDULED
    pickup_points: List[str] = []
    notes: Optional[str] = None
    planned_route_summary: Optional[str] = None
    stop_sequence: List[Dict[str, Any]] = []
    direct_eta_minutes: Optional[int] = None
    shared_eta_minutes: Optional[int] = None
    detour_minutes: Optional[int] = None
    route_match_score: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    ride_id: str
    user_id: str
    status: BookingStatusEnum = BookingStatusEnum.CONFIRMED
    pickup_point: Optional[str] = None
    drop_point: Optional[str] = None
    pickup_area: Optional[str] = None
    drop_area: Optional[str] = None
    pickup_sequence_order: Optional[int] = None
    drop_sequence_order: Optional[int] = None
    estimated_pickup_time: Optional[datetime] = None
    estimated_drop_time: Optional[datetime] = None
    booked_at: datetime = Field(default_factory=datetime.utcnow)
    cancelled_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class HelplineTicket(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    user_id: str
    ride_id: Optional[str] = None
    message: str
    status: EventStatusEnum = EventStatusEnum.OPEN
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SafetyEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    ride_id: Optional[str] = None
    user_id: str
    event_type: str = "SOS"
    severity: SeverityEnum = SeverityEnum.CRITICAL
    status: EventStatusEnum = EventStatusEnum.OPEN
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
