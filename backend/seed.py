import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from models import (
    Company, UserInDB, RoleEnum, OfficeLocation, Corridor, Ride, RideTypeEnum, PoolerProfile, VisibilityModeEnum
)
from datetime import datetime, timedelta
import random

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password):
    return pwd_context.hash(password)

async def seed():
    mongo_url = os.environ.get('MONGO_URL', "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    await db.companies.drop()
    await db.users.drop()
    await db.offices.drop()
    await db.corridors.drop()
    await db.rides.drop()
    await db.bookings.drop()
    await db.pooler_profiles.drop()

    print("DB Cleared. Seeding Nexora Technologies...")

    # Company with benefits enabled
    company = Company(
        name="Nexora Technologies", 
        allowed_email_domains=["nexora.com"],
        opt_in_status="ACTIVE",
        benefits_enabled=True,
        fuel_voucher_enabled=True,
        rewards_enabled=True
    )
    await db.companies.insert_one(company.dict())
    c_id = company.id

    # Offices
    offices = [
        OfficeLocation(company_id=c_id, name="Whitefield Tech Park", address="Whitefield, Bangalore", latitude=12.9698, longitude=77.7499),
        OfficeLocation(company_id=c_id, name="Manyata Tech Park", address="Hebbal, Bangalore", latitude=13.0450, longitude=77.6200),
    ]
    for o in offices:
        await db.offices.insert_one(o.dict())

    # Users
    password = get_password_hash("password123")
    users = [
        UserInDB(company_id=c_id, name="Ananya Sharma", email="ananya@nexora.com", password_hash=password, role=RoleEnum.EMPLOYEE, home_area="Koramangala", office_location_id=offices[0].id),
        UserInDB(company_id=c_id, name="Arjun Rao", email="arjun@nexora.com", password_hash=password, role=RoleEnum.DRIVER, home_area="BTM Layout", office_location_id=offices[0].id),
        UserInDB(company_id=c_id, name="Meera Iyer", email="meera@nexora.com", password_hash=password, role=RoleEnum.COMPANY_ADMIN),
        UserInDB(company_id=c_id, name="Priya Nair", email="priya@nexora.com", password_hash=password, role=RoleEnum.EMPLOYEE, home_area="Indiranagar", office_location_id=offices[0].id),
    ]
    for u in users:
        await db.users.insert_one(u.dict())
    
    # Pooler Profiles
    arjun_profile = PoolerProfile(
        company_id=c_id,
        user_id=users[1].id, # Arjun
        usual_origin_area="BTM Layout",
        usual_destination_area="Whitefield Tech Park",
        usual_departure_time="08:15 AM",
        vehicle_type="Hyundai i20",
        rating=4.8,
        review_count=28,
        completed_rides_count=42,
        trust_score="High",
        verified_status=True,
        current_latitude=12.9165,
        current_longitude=77.6101,
        is_live_available=True
    )
    await db.pooler_profiles.insert_one(arjun_profile.dict())

    priya_profile = PoolerProfile(
        company_id=c_id,
        user_id=users[3].id, # Priya
        usual_origin_area="Indiranagar",
        usual_destination_area="Whitefield Tech Park",
        usual_departure_time="08:45 AM",
        vehicle_type="Honda City",
        rating=4.9,
        review_count=15,
        completed_rides_count=20,
        trust_score="High",
        verified_status=True,
        current_latitude=12.9781,
        current_longitude=77.6408,
        is_live_available=True
    )
    await db.pooler_profiles.insert_one(priya_profile.dict())

    # Ride from Arjun
    tomorrow = datetime.utcnow() + timedelta(days=1)
    tomorrow = tomorrow.replace(hour=8, minute=15)
    ride = Ride(
        company_id=c_id,
        visibility_mode=VisibilityModeEnum.COMPANY_CIRCLE,
        driver_user_id=users[1].id, # Arjun Rao
        ride_type=RideTypeEnum.CARPOOL,
        origin_area="BTM Layout",
        destination_area="Whitefield Tech Park",
        destination_office_id=offices[0].id,
        departure_time=tomorrow,
        estimated_arrival_time=tomorrow + timedelta(hours=1),
        available_seats=2,
        total_seats=4,
        current_passenger_count=2, # 2 already booked
        origin_latitude=12.9165,
        origin_longitude=77.6101,
        destination_latitude=12.9698,
        destination_longitude=77.7499,
        route_coordinates=[
            {"latitude": 12.9165, "longitude": 77.6101}, # BTM
            {"latitude": 12.9352, "longitude": 77.6245}, # Koramangala
            {"latitude": 12.9781, "longitude": 77.6408}, # Indiranagar
            {"latitude": 12.9698, "longitude": 77.7499}  # Whitefield
        ],
        stop_sequence=[
            {"area": "BTM Layout", "time": "08:15 AM", "type": "PICKUP", "latitude": 12.9165, "longitude": 77.6101},
            {"area": "Koramangala", "time": "08:30 AM", "type": "PICKUP", "latitude": 12.9352, "longitude": 77.6245},
            {"area": "Indiranagar", "time": "08:45 AM", "type": "DROP", "latitude": 12.9781, "longitude": 77.6408},
            {"area": "Whitefield Tech Park", "time": "09:15 AM", "type": "DROP", "latitude": 12.9698, "longitude": 77.7499}
        ],
        direct_eta_minutes=45,
        shared_eta_minutes=57,
        detour_minutes=12,
        route_match_score=86
    )
    await db.rides.insert_one(ride.dict())

    print("Seeding Done! Added Arjun's Ride and Pooler Profiles.")

if __name__ == "__main__":
    asyncio.run(seed())
