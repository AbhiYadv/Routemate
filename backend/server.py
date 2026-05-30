from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import sys
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import jwt
import bcrypt as _bcrypt_lib

from models import (
    Company, UserInDB, UserPublic, UserCreate, RoleEnum, Ride, Booking, PoolerProfile,
    HelplineTicket, SafetyEvent, OfficeLocation, Corridor, RideStatusEnum,
    VisibilityModeEnum, BookingStatusEnum, RideMessage, CallLog
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_url = os.environ.get('MONGO_URL', "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

ALGORITHM = "HS256"

# Fail fast on missing JWT secret in non-dev environments
_raw_secret = os.environ.get("JWT_SECRET")
_app_env = os.environ.get("APP_ENV", "development").lower()

if not _raw_secret:
    if _app_env not in ("development", "dev", "local"):
        logger.critical("JWT_SECRET environment variable is required. Exiting.")
        sys.exit(1)
    _raw_secret = "dev-only-secret-change-in-production"
    logger.warning(
        "JWT_SECRET not set. Using insecure dev fallback. "
        "Set JWT_SECRET and APP_ENV=production before deploying."
    )

SECRET_KEY: str = _raw_secret

# CORS: never use wildcard with credentials
_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:8081,http://localhost:19006,http://localhost:8082,exp://localhost:8081"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app = FastAPI()
api_router = APIRouter(prefix="/api")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return _bcrypt_lib.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )

def get_password_hash(password: str) -> str:
    return _bcrypt_lib.hashpw(
        password.encode("utf-8"), _bcrypt_lib.gensalt(12)
    ).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=60 * 24 * 7))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return UserInDB(**user)


# --- Startup: indexes + validation ---
@app.on_event("startup")
async def startup():
    try:
        await db.users.create_index([("id", 1)], unique=True, background=True)
        await db.users.create_index([("email", 1)], unique=True, background=True)
        await db.users.create_index([("company_id", 1)], background=True)
        await db.rides.create_index([("id", 1)], unique=True, background=True)
        await db.rides.create_index(
            [("company_id", 1), ("status", 1), ("available_seats", 1)],
            background=True,
        )
        await db.rides.create_index([("origin_area", 1)], background=True)
        await db.rides.create_index([("destination_area", 1)], background=True)
        await db.bookings.create_index([("id", 1)], unique=True, background=True)
        await db.bookings.create_index([("ride_id", 1), ("user_id", 1)], background=True)
        await db.bookings.create_index([("user_id", 1)], background=True)
        await db.bookings.create_index([("company_id", 1)], background=True)
        await db.ride_messages.create_index(
            [("ride_id", 1), ("sender_id", 1), ("receiver_id", 1)],
            background=True,
        )
        await db.pooler_profiles.create_index([("id", 1)], unique=True, background=True)
        await db.pooler_profiles.create_index([("user_id", 1)], background=True)
        await db.pooler_profiles.create_index([("company_id", 1)], background=True)
        logger.info("MongoDB indexes ensured.")
    except Exception as e:
        logger.warning(f"Index creation note (may already exist): {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# --- Auth ---
class LoginData(BaseModel):
    email: str
    password: str

@api_router.post("/auth/login")
async def login(data: LoginData):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = create_access_token(data={"sub": user["email"]})
    # Never return password_hash — use UserPublic
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserPublic(**user).dict(),
    }

@api_router.get("/auth/me")
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return UserPublic(**current_user.dict())


# --- Search & Discovery ---
@api_router.get("/rides/search")
async def search_rides(
    source: Optional[str] = None,
    destination: Optional[str] = None,
    passengers: int = 1,
    current_user: UserInDB = Depends(get_current_user),
):
    query = {
        "company_id": current_user.company_id,
        "status": {"$in": [RideStatusEnum.SCHEDULED.value, RideStatusEnum.ACTIVE.value]},
        "available_seats": {"$gte": passengers},
    }
    if source and source.strip():
        # Escape user input before building regex to prevent ReDoS / injection
        escaped = re.escape(source.strip())
        query["$or"] = [
            {"origin_area": {"$regex": escaped, "$options": "i"}},
            {"stop_sequence.area": {"$regex": escaped, "$options": "i"}},
        ]

    rides = await db.rides.find(query).to_list(100)

    company = await db.companies.find_one({"id": current_user.company_id})
    company_name = company.get("name") if company else "Verified Company"

    for r in rides:
        r.pop("_id", None)
        driver = await db.users.find_one({"id": r["driver_user_id"]})
        if driver:
            r["driver_name"] = driver.get("name")
        pooler = await db.pooler_profiles.find_one({"user_id": r["driver_user_id"]})
        if pooler:
            r["driver_rating"] = pooler.get("rating")
            r["driver_reviews"] = pooler.get("review_count")
            r["driver_vehicle"] = pooler.get("vehicle_type")
            r["driver_avatar"] = pooler.get("profile_photo_url")
        r["company_name"] = company_name
        r["visibility_badge"] = (
            "Company Circle"
            if r.get("visibility_mode") == VisibilityModeEnum.COMPANY_CIRCLE.value
            else "Verified Community"
        )

    return rides

@api_router.get("/rides/{ride_id}")
async def get_ride(ride_id: str, current_user: UserInDB = Depends(get_current_user)):
    ride = await db.rides.find_one({"id": ride_id, "company_id": current_user.company_id})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    ride.pop("_id", None)
    driver = await db.users.find_one({"id": ride["driver_user_id"]})
    if driver:
        driver.pop("_id", None)
    pooler = await db.pooler_profiles.find_one({"user_id": ride["driver_user_id"]})
    if pooler:
        pooler.pop("_id", None)
    company = await db.companies.find_one({"id": ride["company_id"]})
    ride["driver"] = driver
    ride["pooler"] = pooler
    ride["company_name"] = company.get("name") if company else "Verified Company"
    return ride


@api_router.post("/rides/{ride_id}/book")
async def book_ride(ride_id: str, current_user: UserInDB = Depends(get_current_user)):
    # Guard: prevent duplicate booking by same user
    existing = await db.bookings.find_one({
        "ride_id": ride_id,
        "user_id": current_user.id,
        "status": {"$ne": BookingStatusEnum.CANCELLED.value},
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already booked this ride")

    # Atomic seat decrement: scoped to company + seats > 0 — prevents TOCTOU and cross-tenant booking
    result = await db.rides.update_one(
        {
            "id": ride_id,
            "company_id": current_user.company_id,
            "available_seats": {"$gt": 0},
            "status": {"$in": [RideStatusEnum.SCHEDULED.value, RideStatusEnum.ACTIVE.value]},
        },
        {"$inc": {"available_seats": -1, "current_passenger_count": 1}},
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Ride not available or no seats left")

    booking = Booking(
        company_id=current_user.company_id,
        ride_id=ride_id,
        user_id=current_user.id,
    )
    try:
        await db.bookings.insert_one(booking.dict())
    except Exception:
        # Compensate: restore seat if booking insert fails
        await db.rides.update_one(
            {"id": ride_id},
            {"$inc": {"available_seats": 1, "current_passenger_count": -1}},
        )
        raise HTTPException(status_code=500, detail="Booking failed. Please try again.")

    return {"message": "Booking successful", "booking_id": booking.id}


@api_router.get("/messages/{ride_id}/{receiver_id}")
async def get_messages(
    ride_id: str, receiver_id: str, current_user: UserInDB = Depends(get_current_user)
):
    messages = await db.ride_messages.find({
        "ride_id": ride_id,
        "$or": [
            {"sender_id": current_user.id, "receiver_id": receiver_id},
            {"sender_id": receiver_id, "receiver_id": current_user.id},
        ],
    }).sort("created_at", 1).to_list(100)
    for m in messages:
        m.pop("_id", None)
    return messages


class MessageCreate(BaseModel):
    message: str

@api_router.post("/messages/{ride_id}/{receiver_id}")
async def send_message(
    ride_id: str,
    receiver_id: str,
    data: MessageCreate,
    current_user: UserInDB = Depends(get_current_user),
):
    # Validate ride belongs to sender's company
    ride = await db.rides.find_one({"id": ride_id, "company_id": current_user.company_id})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    # Validate receiver exists in the same company
    receiver = await db.users.find_one({"id": receiver_id, "company_id": current_user.company_id})
    if not receiver:
        raise HTTPException(status_code=404, detail="Recipient not found")

    # Validate sender or receiver is ride driver or an active booking participant
    is_driver = ride.get("driver_user_id") in (current_user.id, receiver_id)
    sender_booking = await db.bookings.find_one({
        "ride_id": ride_id,
        "user_id": current_user.id,
        "status": {"$ne": BookingStatusEnum.CANCELLED.value},
    })
    receiver_booking = await db.bookings.find_one({
        "ride_id": ride_id,
        "user_id": receiver_id,
        "status": {"$ne": BookingStatusEnum.CANCELLED.value},
    })

    if not is_driver and not sender_booking and not receiver_booking:
        raise HTTPException(status_code=403, detail="You are not a participant in this ride")

    msg = RideMessage(
        company_id=current_user.company_id,
        ride_id=ride_id,
        sender_id=current_user.id,
        receiver_id=receiver_id,
        message=data.message,
    )
    await db.ride_messages.insert_one(msg.dict())
    return {"status": "success", "message_id": msg.id}


class CallCreate(BaseModel):
    ride_id: str
    receiver_id: str

@api_router.post("/calls")
async def log_call(data: CallCreate, current_user: UserInDB = Depends(get_current_user)):
    call_log = CallLog(
        company_id=current_user.company_id,
        ride_id=data.ride_id,
        caller_id=current_user.id,
        receiver_id=data.receiver_id,
    )
    await db.call_logs.insert_one(call_log.dict())
    return {"status": "success"}


@api_router.get("/poolers/nearby")
async def get_nearby_poolers(
    lat: float = 0.0, lng: float = 0.0, current_user: UserInDB = Depends(get_current_user)
):
    poolers = await db.pooler_profiles.find({"company_id": current_user.company_id}).to_list(100)
    for p in poolers:
        p.pop("_id", None)
        u = await db.users.find_one({"id": p["user_id"]})
        if u:
            p["name"] = u.get("name")
    return poolers


@api_router.get("/poolers/{user_id}")
async def get_pooler(user_id: str, current_user: UserInDB = Depends(get_current_user)):
    pooler = await db.pooler_profiles.find_one({"user_id": user_id})
    if not pooler:
        raise HTTPException(status_code=404, detail="Pooler not found")
    pooler.pop("_id", None)
    user = await db.users.find_one({"id": user_id})
    if user:
        user.pop("_id", None)
    company = await db.companies.find_one({"id": pooler["company_id"]})
    pooler["user"] = user
    pooler["company_name"] = company.get("name") if company else "Verified Company"
    return pooler


# --- Location & Map APIs ---
class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

@api_router.post("/location/update")
async def update_location(data: LocationUpdate, current_user: UserInDB = Depends(get_current_user)):
    now = datetime.utcnow()
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "current_latitude": data.latitude,
            "current_longitude": data.longitude,
            "last_location_updated_at": now,
            "location_permission_status": "GRANTED",
        }},
    )
    await db.pooler_profiles.update_one(
        {"user_id": current_user.id},
        {"$set": {
            "current_latitude": data.latitude,
            "current_longitude": data.longitude,
            "last_location_updated_at": now,
        }},
    )
    return {"status": "success"}

@api_router.get("/location/me")
async def get_my_location(current_user: UserInDB = Depends(get_current_user)):
    return {
        "latitude": current_user.current_latitude,
        "longitude": current_user.current_longitude,
        "last_updated": current_user.last_location_updated_at,
    }

@api_router.get("/map/config")
async def get_map_config():
    return {
        "mapsEnabled": True,
        "provider": "google",
        "clientKeyAvailable": bool(os.environ.get("GOOGLE_MAPS_API_KEY")),
    }


# --- Bookings & My Rides ---
@api_router.get("/my-bookings")
async def get_my_bookings(current_user: UserInDB = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": current_user.id}).sort("created_at", -1).to_list(100)
    for b in bookings:
        b.pop("_id", None)
        ride = await db.rides.find_one({"id": b["ride_id"]})
        if ride:
            ride.pop("_id", None)
            driver = await db.users.find_one({"id": ride["driver_user_id"]})
            if driver:
                ride["driver_name"] = driver.get("name")
            pooler = await db.pooler_profiles.find_one({"user_id": ride["driver_user_id"]})
            if pooler:
                ride["driver_avatar"] = pooler.get("profile_photo_url")
            company = await db.companies.find_one({"id": ride.get("company_id")})
            ride["company_name"] = company.get("name") if company else "Verified Company"
            ride["visibility_badge"] = (
                "Company Circle"
                if ride.get("visibility_mode") == VisibilityModeEnum.COMPANY_CIRCLE.value
                else "Verified Community"
            )
        b["ride"] = ride
    return bookings


@api_router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, current_user: UserInDB = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id, "user_id": current_user.id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] == BookingStatusEnum.CANCELLED.value:
        raise HTTPException(status_code=400, detail="Already cancelled")

    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": BookingStatusEnum.CANCELLED.value, "cancelled_at": datetime.utcnow()}},
    )
    await db.rides.update_one(
        {"id": booking["ride_id"]},
        {"$inc": {"available_seats": 1, "current_passenger_count": -1}},
    )
    return {"status": "success"}


# --- Safety ---
class SOSCreate(BaseModel):
    ride_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None

@api_router.post("/safety/sos")
async def trigger_sos(data: SOSCreate, current_user: UserInDB = Depends(get_current_user)):
    event = SafetyEvent(
        company_id=current_user.company_id,
        ride_id=data.ride_id,
        user_id=current_user.id,
        event_type="SOS",
        description=data.description or "Emergency SOS triggered from app",
        latitude=data.latitude,
        longitude=data.longitude,
    )
    await db.safety_events.insert_one(event.dict())
    logger.warning(
        f"SOS triggered: user={current_user.id} company={current_user.company_id} "
        f"ride={data.ride_id} lat={data.latitude} lng={data.longitude}"
    )
    return {"status": "sos_received", "event_id": event.id, "message": "Emergency alert sent to company security"}


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
