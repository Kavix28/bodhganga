# BodhGanga — Command Reference

## Setup

| Purpose | Command | Notes |
|---|---|---|
| Copy env template | `cp .env.example .env` | Fill in real values |
| Copy backend env | `cp backend/.env.example backend/.env` | Fill in JWT_SECRET |
| Install frontend deps | `npm ci` | Run in `/frontend` |

## Development

| Purpose | Command | Working Directory |
|---|---|---|
| Start frontend dev server | `npm run dev` | `frontend/` |
| Start backend (dev profile) | `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev` | `backend/` |
| Start backend (Windows) | `mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev` | `backend/` |
| Lint frontend | `npm run lint` | `frontend/` |
| Build frontend | `npm run build` | `frontend/` |
| Compile backend | `./mvnw compile` | `backend/` |
| Run backend tests | `./mvnw test` | `backend/` |

## Docker (Production)

| Purpose | Command | Notes |
|---|---|---|
| Start all services | `docker-compose up -d` | Requires `.env` |
| Stop all services | `docker-compose down` | |
| View logs | `docker-compose logs -f` | |
| Rebuild images | `docker-compose up -d --build` | After code changes |
| Backend only | `docker-compose up -d mongodb backend` | |
| Check health | `curl http://localhost:9090/api/auth/health` | |

## Database

| Purpose | Command | Notes |
|---|---|---|
| Connect to MongoDB | `mongosh mongodb://localhost:27017/bodhganga` | Local dev |
| List collections | `show collections` | In mongosh |
| Count users | `db.users.countDocuments()` | In mongosh |

## Environment Variables Required

| Variable | Where | Required |
|---|---|---|
| `JWT_SECRET` | backend `.env` | **YES** — min 64 chars |
| `MONGO_URI` | backend `.env` | YES (defaults to localhost) |
| `VITE_API_BASE_URL` | frontend `.env` | YES |
| `RAZORPAY_KEY_ID` | backend `.env` | For payments |
| `RAZORPAY_KEY_SECRET` | backend `.env` | For payments |
| `SMTP_USER` | backend `.env` | For OTP emails |
| `SMTP_PASS` | backend `.env` | For OTP emails |

## Generate JWT Secret

```bash
# Linux/Mac
openssl rand -base64 64

# Windows PowerShell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```
