import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["emergent_app"]
    u = await db.users.find_one({"email": "ananya@nexora.com"})
    print(u)

asyncio.run(test())
