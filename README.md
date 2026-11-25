<div align="center">

# Vaxi-Track

### AI-Powered Child Immunization Tracking System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Twilio](https://img.shields.io/badge/Twilio-Voice_&_SMS-F22F46?style=for-the-badge&logo=twilio&logoColor=white)](https://www.twilio.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

**Vaxi-Track** is a full-stack platform that helps healthcare workers, parents, and administrators track child vaccinations across India. It automates reminders via **AI-generated voice calls** and **SMS**, follows India's official **Universal Immunization Programme (UIP)** schedule, and provides real-time analytics dashboards.

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Architecture](#architecture) · [API Reference](#api-reference)

</div>

---

## Features

### Automated Communication
- **AI Voice Calls** — Twilio-powered calls with Amazon Polly (Indian English) voice
- **AI SMS Reminders** — Fast2SMS integration for instant text messages
- **Personalized Messages** — Gemini 2.0 Flash writes a unique message for each parent, with a fixed template as a fallback
- **Daily Cron Jobs** — Auto-reminders at 9 AM, auto follow-ups at 10 AM

### Child & Vaccine Management
- **Auto Vaccine Schedule** — 28 vaccines auto-generated per child (India's UIP)
- **QR Code System** — Unique QR per child for instant lookup at health centers
- **Birth Certificate Upload** — Supports JPEG, PNG, WebP, PDF
- **Overdue Detection** — Past-due vaccines auto-marked as "missed"

### Role-Based Portals
- **Parent Portal** — View children, vaccine timeline, upcoming/missed vaccines, call history
- **Worker Portal** — Scan QR codes, administer vaccines, make calls/SMS, run campaigns
- **Admin Panel** — User management, platform analytics, vaccination reports, CSV export

### Analytics & Reporting
- **Dashboard Stats** — Total children, completed/pending vaccines, call counts
- **Coverage Charts** — Monthly vaccination trends (Recharts)
- **Campaign Analytics** — Call success rates (answered/missed/busy)
- **CSV Export** — Full vaccination data download

---

## Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### Backend
- **Python 3.11** + **FastAPI** 0.111
- **MongoDB Atlas** + **Beanie** ODM
- **JWT** authentication + **bcrypt** hashing
- **Twilio** SDK (voice calls)
- **Fast2SMS** API (SMS)
- **Google Gemini 2.0 Flash** (AI)
- **Mistral AI** (AI fallback)
- **APScheduler** (cron jobs)
- **qrcode + Pillow** (QR generation)

</td>
<td valign="top" width="50%">

### Frontend
- **Next.js 15** + **React 19**
- **TypeScript** 5.8
- **Tailwind CSS** 4.1
- **Zustand** (state management)
- **Recharts** (data visualization)
- **React Hook Form** (forms)
- **Axios** (HTTP client)
- **Lucide React** (icons)
- **React Hot Toast** (notifications)

</td>
</tr>
</table>

---

## Getting Started

### Prerequisites
- **Python** 3.11+
- **Node.js** 18+
- **MongoDB Atlas** account (or local MongoDB)
- **Twilio** account (for voice calls)
- **Fast2SMS** account (for SMS)
- **Google AI Studio** API key (for Gemini)

### 1. Clone the Repository

```bash
git clone https://github.com/mithileshofficial06/VaxiTrack.git
cd VaxiTrack
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials (see Environment Variables below)

# Start the server
cd backend
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:3000** with the API at **http://localhost:8000**.

### 4. Seed Initial Users

```bash
python scripts/create_admin.py     # Create an admin account
python scripts/create_worker.py    # Create a healthcare worker account
```

### Environment Variables

Create a `backend/.env` file with these keys:

```env
# Database
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
DB_NAME=vaxitrack

# Authentication
JWT_SECRET=your-secret-key

# Twilio (Voice Calls)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# AI Services
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx
MISTRAL_API_KEY=xxxxxxxxxxxxxxxxx

# SMS (Fast2SMS)
FAST2SMS_API_KEY=xxxxxxxxxxxxxxxxx

# Server URLs
BASE_URL=http://localhost:8000
NGROK_URL=https://xxxx.ngrok-free.app    # Required for Twilio webhooks in dev
DEFAULT_PARENT_PHONE=+910000000000
```

---

## Architecture

```
vaxi-track/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── config.py               # Environment configuration
│   │   ├── database.py             # MongoDB + Beanie initialization
│   │   ├── models/                 # Database models
│   │   │   ├── user.py             # User document (parent/worker/admin)
│   │   │   ├── child.py            # Child document
│   │   │   ├── vaccine.py          # Vaccine record document
│   │   │   └── call_log.py         # Call/SMS log document
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── routers/                # API route handlers
│   │   │   ├── auth.py             # Authentication (register/login/me)
│   │   │   ├── children.py         # Child CRUD + QR + birth certificates
│   │   │   ├── vaccines.py         # Vaccine scheduling & status
│   │   │   ├── calls.py            # Voice calls, SMS, campaigns
│   │   │   ├── analytics.py        # Dashboard stats & charts
│   │   │   └── admin.py            # Admin panel endpoints
│   │   ├── services/               # Business logic layer
│   │   │   ├── voice_service.py    # Twilio voice call integration
│   │   │   ├── sms_service.py      # Fast2SMS integration
│   │   │   ├── gemini_service.py   # Google Gemini AI
│   │   │   ├── mistral_service.py  # Mistral AI
│   │   │   ├── vaccine_service.py  # UIP schedule generator
│   │   │   ├── scheduler_service.py# APScheduler cron jobs
│   │   │   └── qr_service.py       # QR code generation
│   │   ├── middleware/             # RBAC access control
│   │   └── utils/                  # JWT, hashing, phone formatting
│   ├── static/                     # QR codes, call files, certificates
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js pages
│   │   │   ├── (auth)/             # Login & Register
│   │   │   ├── parent/             # Parent portal (5 pages)
│   │   │   ├── worker/             # Worker portal (5 pages)
│   │   │   └── admin/              # Admin panel (7 pages)
│   │   ├── components/             # Reusable UI components
│   │   ├── hooks/                  # 9 custom React hooks
│   │   ├── lib/                    # API client & utilities
│   │   ├── store/                  # Zustand state stores
│   │   └── types/                  # TypeScript type definitions
│   ├── package.json
│   └── tailwind.config.js
├── scripts/                        # Admin/Worker seed scripts
├── docker-compose.yml
└── .gitignore
```

---

## API Reference

The backend exposes **47 REST endpoints** across 6 routers:

| Router | Prefix | Endpoints | Description |
|---|---|---|---|
| **Auth** | `/api/auth` | 3 | Register, login, get profile |
| **Children** | `/api/children` | 8 | Child CRUD, QR lookup, birth certificates |
| **Vaccines** | `/api/vaccines` | 6 | Schedule, update status, timeline |
| **Calls** | `/api/calls` | 11 | Voice calls, SMS, campaigns, follow-ups, logs |
| **Analytics** | `/api/analytics` | 4 | Dashboard stats, coverage, reports |
| **Admin** | `/api/admin` | 15 | User/child management, reports, analytics |

> **Interactive API docs** available at `http://localhost:8000/docs` (Swagger UI)

---

## Database Schema

Four MongoDB collections:

| Collection | Description | Key Fields |
|---|---|---|
| **users** | All user accounts | name, email, role, phone_number, is_active |
| **children** | Registered children | name, dob, parent_id, qr_code, birth_certificate |
| **vaccines** | Vaccination records | child_id, vaccine_name, scheduled_date, status |
| **call_logs** | Call/SMS history | child_id, parent_phone, status, ai_response, call_type |

---

## Vaccine Schedule

Auto-generates **28 vaccines** per child following India's **Universal Immunization Programme**:

| Age | Vaccines |
|---|---|
| Birth | BCG, OPV-0, Hepatitis B |
| 6 Weeks | OPV-1, Pentavalent-1, Rotavirus-1, fIPV-1, PCV-1 |
| 10 Weeks | OPV-2, Pentavalent-2, Rotavirus-2 |
| 14 Weeks | OPV-3, Pentavalent-3, fIPV-2, Rotavirus-3, PCV-2 |
| 9–12 Months | MR-1, JE-1, PCV-Booster, Vitamin A |
| 16–24 Months | MR-2, JE-2, DPT Booster-1, OPV Booster, Vitamin A |
| 5–6 Years | DPT Booster-2 |
| 10 & 16 Years | Td (Tetanus-Diphtheria) |

---

## Security

- **JWT Authentication** with HS256 signing
- **bcrypt** password hashing (never stored in plain text)
- **Role-Based Access Control (RBAC)** — `parent`, `worker`, `admin`
- **Next.js middleware** guards admin routes on the frontend
- **MongoDB Atlas TLS** encryption with certificate verification
- **CORS** restricted to allowed origins
- **Pydantic validation** on all API inputs

---

## AI Integration

Messages sent via voice calls and SMS are AI-generated so each parent hears their own child's name, vaccine and date:

1. **Google Gemini 2.0 Flash** writes a short two-to-three sentence reminder or missed-dose follow-up.
2. **Gemini** also classifies a parent's spoken reply to a call and generates the response.
3. **Fixed template fallback** guarantees the reminder still goes out if the AI service is unavailable.

All messages are sanitized for TwiML compatibility before being spoken by **Amazon Polly.Aditi** (Indian English voice).

---

## Automated Scheduling

| Schedule | Action |
|---|---|
| **Daily 9:00 AM** | Auto-call parents for vaccines due tomorrow |
| **Daily 10:00 AM** | Mark overdue vaccines as missed + follow-up calls |

Powered by **APScheduler** with async cron triggers. Starts automatically when the backend boots.

---

## Development

```bash
# Run backend with auto-reload
cd backend && uvicorn app.main:app --reload --port 8000

# Run frontend with hot reload
cd frontend && npm run dev

# For Twilio webhooks in development, use ngrok:
ngrok http 8000
# Then set NGROK_URL in backend/.env
```
