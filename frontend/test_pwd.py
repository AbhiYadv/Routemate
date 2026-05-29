from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash = '$2b$12$yEvaGcR4ofUFS1jnqfgo5.VhUCM8QyVaLYfc1zihfeP3uV9HYVQta'
print(pwd_context.verify("password123", hash))
