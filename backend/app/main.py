from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import admin, analytics, auth, calls, children, vaccines
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Vaxi-Track API",
    description="AI Powered Immunization Tracking System",
    version="3.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(children.router)
app.include_router(vaccines.router)
app.include_router(calls.router)
app.include_router(analytics.router)
app.include_router(admin.router)

os.makedirs("static/qr_codes", exist_ok=True)
os.makedirs("static/calls", exist_ok=True)
os.makedirs("static/birth_certificates", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def root():
    return {"message": "Welcome to Vaxi-Track API", "status": "running"}
