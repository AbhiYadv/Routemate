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
    HelplineTicket, SafetyEvent, OfficeLocation, Corridor, RideStatusEnum
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
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
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=60*24*7) # 7 days
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

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

# --- Auth Endpoints ---
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
    return {"access_token": access_token, "token_type": "bearer", "user": UserInDB(**user).dict()}

@api_router.get("/auth/me")
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

# --- Rides & Bookings ---
@api_router.get("/rides")
async def get_rides(current_user: UserInDB = Depends(get_current_user)):
    rides = await db.rides.find({
        "company_id": current_user.company_id,
        "status": {"$in": [RideStatusEnum.SCHEDULED.value, RideStatusEnum.ACTIVE.value]}
    }).to_list(1000)
    return rides

@api_router.get("/my-bookings")
async def get_my_bookings(current_user: UserInDB = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": current_user.id}).to_list(100)
    for b in bookings:
        ride = await db.rides.find_one({"id": b["ride_id"]})
        b["ride"] = ride
    return bookings

# --- Location & Map APIs (Milestone 1) ---
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
            "location_permission_status": "GRANTED"
        }}
    )
    # If user is also a pooler, update pooler profile
    await db.pooler_profiles.update_one(
        {"user_id": current_user.id},
        {"$set": {
            "current_latitude": data.latitude,
            "current_longitude": data.longitude,
            "last_location_updated_at": now
        }}
    )
    return {"status": "success"}

@api_router.get("/location/me")
async def get_my_location(current_user: UserInDB = Depends(get_current_user)):
    return {
        "latitude": current_user.current_latitude,
        "longitude": current_user.current_longitude,
        "last_updated": current_user.last_location_updated_at
    }

@api_router.get("/rides/nearby")
async def get_nearby_rides(lat: float, lng: float, current_user: UserInDB = Depends(get_current_user)):
    # Mocking nearby query for MVP by just returning active rides
    rides = await db.rides.find({
        "company_id": current_user.company_id,
        "status": {"$in": [RideStatusEnum.SCHEDULED.value, RideStatusEnum.ACTIVE.value]}
    }).to_list(100)
    return rides

@api_router.get("/poolers/nearby")
async def get_nearby_poolers(lat: float, lng: float, current_user: UserInDB = Depends(get_current_user)):
    # Mocking nearby poolers 
    poolers = await db.pooler_profiles.find({
        "company_id": current_user.company_id
    }).to_list(100)
    
    # Attach names from user table
    for p in poolers:
        u = await db.users.find_one({"id": p["user_id"]})
        if u:
            p["name"] = u.get("name")
    return poolers

@api_router.get("/map/config")
async def get_map_config():
    return {
        "mapsEnabled": True,
        "provider": "google",
        "clientKeyAvailable": bool(os.environ.get("GOOGLE_MAPS_API_KEY"))
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
