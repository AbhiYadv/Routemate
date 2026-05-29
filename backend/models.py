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

class VisibilityModeEnum(str, Enum):
    COMPANY_CIRCLE = "COMPANY_CIRCLE"
    PARTNER_NETWORK = "PARTNER_NETWORK"
    VERIFIED_COMMUNITY = "VERIFIED_COMMUNITY"

# Models
class Company(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    allowed_email_domains: List[str] = []
    status: str = "ACTIVE"
    opt_in_status: str = "ACTIVE" # ACTIVE, INACTIVE, TRIAL
    benefits_enabled: bool = False
    fuel_voucher_enabled: bool = False
    rewards_enabled: bool = False
    partner_network_enabled: bool = False
    verified_community_enabled: bool = False
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
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    location_permission_status: Optional[str] = None
    last_location_updated_at: Optional[datetime] = None

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
    type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Ride(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    visibility_mode: VisibilityModeEnum = VisibilityModeEnum.COMPANY_CIRCLE
    corridor_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    driver_user_id: Optional[str] = None
    vendor_id: Optional[str] = None
    ride_type: RideTypeEnum
    origin_area: str
    destination_area: str
    destination_office_id: Optional[str] = None
    departure_time: datetime
    estimated_arrival_time: datetime
    available_seats: int
    total_seats: int
    current_passenger_count: int = 0
    status: RideStatusEnum = RideStatusEnum.SCHEDULED
    pickup_points: List[str] = []
    notes: Optional[str] = None
    planned_route_summary: Optional[str] = None
    stop_sequence: List[Dict[str, Any]] = []
    direct_eta_minutes: Optional[int] = None
    shared_eta_minutes: Optional[int] = None
    detour_minutes: Optional[int] = None
    route_match_score: Optional[int] = None
    origin_latitude: Optional[float] = None
    origin_longitude: Optional[float] = None
    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None
    route_polyline: Optional[str] = None
    route_coordinates: Optional[List[Dict[str, float]]] = None
    driver_current_latitude: Optional[float] = None
    driver_current_longitude: Optional[float] = None
    last_driver_location_updated_at: Optional[datetime] = None
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
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    drop_latitude: Optional[float] = None
    drop_longitude: Optional[float] = None
    booked_at: datetime = Field(default_factory=datetime.utcnow)
    cancelled_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PoolerProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    user_id: str
    profile_photo_url: Optional[str] = None
    usual_origin_area: Optional[str] = None
    usual_destination_area: Optional[str] = None
    usual_departure_time: Optional[str] = None
    usual_arrival_time: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number_masked: Optional[str] = None
    rating: float = 5.0
    review_count: int = 0
    completed_rides_count: int = 0
    trust_score: str = "High"
    verified_status: bool = True
    frequent_pickup_areas: List[str] = []
    frequent_drop_areas: List[str] = []
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    last_location_updated_at: Optional[datetime] = None
    is_live_available: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RideRating(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    ride_id: str
    reviewer_user_id: str
    reviewed_user_id: str
    punctuality_rating: int = 5
    safety_rating: int = 5
    route_accuracy_rating: int = 5
    communication_rating: int = 5
    overall_rating: int = 5
    feedback: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RideReward(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    ride_id: str
    driver_user_id: str
    completed_bookings_count: int = 0
    average_rating: float = 5.0
    voucher_status: str = "ELIGIBLE" # NOT_ELIGIBLE, ELIGIBLE, ISSUED
    estimated_fuel_voucher_amount: int = 0
    reward_points: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RideMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    ride_id: str
    sender_id: str
    receiver_id: str
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None

class CallLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    ride_id: str
    caller_id: str
    receiver_id: str
    status: str = "COMPLETED"
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None

class HelplineTicket(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    user_id: str
    ride_id: Optional[str] = None
    type: str = "HELP"
    status: EventStatusEnum = EventStatusEnum.OPEN
    priority: str = "LOW"
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

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
