import os
from dotenv import load_dotenv
load_dotenv()

class Settings:
    MONGODB_URL = os.getenv("MONGODB_URL")
    DB_NAME = os.getenv("DB_NAME", "vaxitrack")
    JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")
    JWT_ALGORITHM = "HS256"
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
    TWILIO_PHONE = TWILIO_PHONE_NUMBER
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    BASE_URL = os.getenv("BASE_URL")
    NGROK_URL = os.getenv("NGROK_URL")
    DEFAULT_PARENT_PHONE = os.getenv("DEFAULT_PARENT_PHONE", "+910000000000")

settings = Settings()
