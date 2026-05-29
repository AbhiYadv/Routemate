import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from models import (
    Company, UserInDB, RoleEnum, OfficeLocation, Corridor, Ride, RideTypeEnum
)
from datetime import datetime, timedelta
import random

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password):
    return pwd_context.hash(password)

async def seed():
    # use env or fallback to local
    mongo_url = os.environ.get('MONGO_URL', "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get("DB_NAME", "test_database")]
    
    # clear db
    await db.companies.drop()
    await db.users.drop()
    await db.offices.drop()
    await db.corridors.drop()
    await db.rides.drop()
    await db.bookings.drop()

    print("DB Cleared. Seeding Nexora Technologies...")

    # Company
    company = Company(name="Nexora Technologies", allowed_email_domains=["nexora.com"])
    await db.companies.insert_one(company.dict())
    c_id = company.id

    # Offices
    offices = [
        OfficeLocation(company_id=c_id, name="Whitefield Tech Park", address="Whitefield, Bangalore"),
        OfficeLocation(company_id=c_id, name="Manyata Tech Park", address="Hebbal, Bangalore"),
        OfficeLocation(company_id=c_id, name="Electronic City Campus", address="Electronic City, Bangalore"),
    ]
    for o in offices:
        await db.offices.insert_one(o.dict())

    # Corridors
    corridors = [
        Corridor(company_id=c_id, name="Koramangala to Whitefield", origin_area="Koramangala", destination_office_id=offices[0].id),
        Corridor(company_id=c_id, name="HSR Layout to Electronic City", origin_area="HSR Layout", destination_office_id=offices[2].id),
    ]
    for c in corridors:
        await db.corridors.insert_one(c.dict())

    # Users
    password = get_password_hash("password123")
    users = [
        UserInDB(company_id=c_id, name="Ananya Sharma", email="ananya@nexora.com", password_hash=password, role=RoleEnum.EMPLOYEE, home_area="Koramangala", office_location_id=offices[0].id),
        UserInDB(company_id=c_id, name="Rohan Mehta", email="rohan@nexora.com", password_hash=password, role=RoleEnum.EMPLOYEE, home_area="Indiranagar"),
        UserInDB(company_id=c_id, name="Arjun Rao", email="arjun@nexora.com", password_hash=password, role=RoleEnum.DRIVER, home_area="BTM Layout", office_location_id=offices[0].id),
        UserInDB(company_id=c_id, name="Meera Iyer", email="meera@nexora.com", password_hash=password, role=RoleEnum.COMPANY_ADMIN),
        UserInDB(company_id=c_id, name="Raj Malhotra", email="raj@nexora.com", password_hash=password, role=RoleEnum.VENDOR_ADMIN)
    ]
    for u in users:
        await db.users.insert_one(u.dict())
    
    # Ride
    tomorrow = datetime.utcnow() + timedelta(days=1)
    tomorrow = tomorrow.replace(hour=8, minute=15) # 8:15 AM
    ride = Ride(
        company_id=c_id,
        driver_user_id=users[2].id, # Arjun Rao
        ride_type=RideTypeEnum.CARPOOL,
        origin_area="BTM Layout",
        destination_office_id=offices[0].id,
        departure_time=tomorrow,
        estimated_arrival_time=tomorrow + timedelta(hours=1),
        available_seats=3,
        total_seats=4,
        pickup_points=["BTM", "Koramangala", "Indiranagar"],
        planned_route_summary="Arjun usually drives from BTM Layout to Whitefield...",
        stop_sequence=[
            {"area": "BTM Layout", "time": "08:15 AM", "type": "PICKUP"},
            {"area": "Koramangala", "time": "08:30 AM", "type": "PICKUP"},
            {"area": "Indiranagar", "time": "08:45 AM", "type": "DROP"},
            {"area": "Whitefield Tech Park", "time": "09:15 AM", "type": "DROP"}
        ],
        direct_eta_minutes=45,
        shared_eta_minutes=60,
        detour_minutes=15,
        route_match_score=85
    )
    await db.rides.insert_one(ride.dict())

    print("Seeding Done! Use ananya@nexora.com / password123 to login.")

if __name__ == "__main__":
    asyncio.run(seed())
