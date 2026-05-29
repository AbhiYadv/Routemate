from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext

from models import (
    Company, UserInDB, UserCreate, RoleEnum, Ride, Booking, PoolerProfile,
    HelplineTicket, SafetyEvent, OfficeLocation, Corridor, RideStatusEnum, VisibilityModeEnum, BookingStatusEnum
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("JWT_SECRET", "supersecretkey12345")
ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
def get_password_hash(password):
    return pwd_context.hash(password)
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=60*24*7))
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
        if email is None: raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = await db.users.find_one({"email": email})
    if user is None: raise credentials_exception
    return UserInDB(**user)

# --- Auth ---
class LoginData(BaseModel):
    email: str
    password: str

@api_router.post("/auth/login")
async def login(data: LoginData):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer", "user": UserInDB(**user).dict()}

@api_router.get("/auth/me")
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

# --- Search & Discovery ---
@api_router.get("/rides/search")
async def search_rides(
    source: Optional[str] = None, 
    destination: Optional[str] = None, 
    passengers: int = 1,
    current_user: UserInDB = Depends(get_current_user)
):
    query = {
        "company_id": current_user.company_id,
        "status": {"$in": [RideStatusEnum.SCHEDULED.value, RideStatusEnum.ACTIVE.value]},
        "available_seats": {"$gte": passengers}
    }
    if source and source.strip() != "":
        query["$or"] = [
            {"origin_area": {"$regex": source, "$options": "i"}},
            {"stop_sequence.area": {"$regex": source, "$options": "i"}}
        ]

    rides = await db.rides.find(query).to_list(100)
    
    # Fetch company name once to optimize
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
        r["visibility_badge"] = "Company Circle" if r.get("visibility_mode") == VisibilityModeEnum.COMPANY_CIRCLE.value else "Verified Community"
        
    return rides

@api_router.get("/rides/{ride_id}")
async def get_ride(ride_id: str, current_user: UserInDB = Depends(get_current_user)):
    ride = await db.rides.find_one({"id": ride_id, "company_id": current_user.company_id})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
        
    ride.pop("_id", None)
    
    driver = await db.users.find_one({"id": ride["driver_user_id"]})
    if driver: driver.pop("_id", None)
    pooler = await db.pooler_profiles.find_one({"user_id": ride["driver_user_id"]})
    if pooler: pooler.pop("_id", None)
    company = await db.companies.find_one({"id": ride["company_id"]})
    
    ride["driver"] = driver
    ride["pooler"] = pooler
    ride["company_name"] = company.get("name") if company else "Verified Company"
    return ride

@api_router.post("/rides/{ride_id}/book")
async def book_ride(ride_id: str, current_user: UserInDB = Depends(get_current_user)):
    ride = await db.rides.find_one({"id": ride_id})
    if not ride or ride["available_seats"] <= 0:
        raise HTTPException(status_code=400, detail="Ride not available")
    
    # Decrease seats
    await db.rides.update_one(
        {"id": ride_id},
        {"$inc": {"available_seats": -1, "current_passenger_count": 1}}
    )
    
    booking = Booking(
        company_id=current_user.company_id,
        ride_id=ride_id,
        user_id=current_user.id
    )
    await db.bookings.insert_one(booking.dict())
    
    return {"message": "Booking successful", "booking_id": booking.id}

@api_router.get("/poolers/{user_id}")
async def get_pooler(user_id: str, current_user: UserInDB = Depends(get_current_user)):
    pooler = await db.pooler_profiles.find_one({"user_id": user_id})
    if not pooler:
        raise HTTPException(status_code=404, detail="Pooler not found")
    pooler.pop("_id", None)
    user = await db.users.find_one({"id": user_id})
    if user: user.pop("_id", None)
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
    await db.users.update_one({"id": current_user.id}, {"$set": {"current_latitude": data.latitude, "current_longitude": data.longitude, "last_location_updated_at": now, "location_permission_status": "GRANTED"}})
    await db.pooler_profiles.update_one({"user_id": current_user.id}, {"$set": {"current_latitude": data.latitude, "current_longitude": data.longitude, "last_location_updated_at": now}})
    return {"status": "success"}

@api_router.get("/location/me")
async def get_my_location(current_user: UserInDB = Depends(get_current_user)):
    return {"latitude": current_user.current_latitude, "longitude": current_user.current_longitude, "last_updated": current_user.last_location_updated_at}

@api_router.get("/map/config")
async def get_map_config():
    return {"mapsEnabled": True, "provider": "google", "clientKeyAvailable": bool(os.environ.get("GOOGLE_MAPS_API_KEY"))}

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
            ride["visibility_badge"] = "Company Circle" if ride.get("visibility_mode") == VisibilityModeEnum.COMPANY_CIRCLE.value else "Verified Community"
        b["ride"] = ride
    return bookings

@api_router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, current_user: UserInDB = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id, "user_id": current_user.id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] == BookingStatusEnum.CANCELLED.value:
        raise HTTPException(status_code=400, detail="Already cancelled")
    
    # Update Booking Status
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": BookingStatusEnum.CANCELLED.value, "cancelled_at": datetime.utcnow()}}
    )
    
    # Restore the seat in the Ride
    await db.rides.update_one(
        {"id": booking["ride_id"]},
        {"$inc": {"available_seats": 1, "current_passenger_count": -1}}
    )
    
    return {"status": "success"}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
