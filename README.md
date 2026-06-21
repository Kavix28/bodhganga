# BodhGanga Academy

> India's premier platform for government exam preparation — covering all 28 States and 8 Union Territories

[![CI](https://github.com/your-org/bodhganga/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/bodhganga/actions)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.5-green)
![React](https://img.shields.io/badge/React-18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)

---

## What Is BodhGanga?

BodhGanga is a full-stack educational SaaS platform that provides:

- **State-wise study content** — notes, question banks, and solutions for all 36 regions
- **Course management** — enroll, track progress, and complete courses
- **Digital marketplace** — buy and download premium study bundles
- **Blog** — exam strategies, current affairs, and knowledge articles
- **Admin panel** — full content management system

**Target users:** UPSC, SSC, State PSC, Railway, Banking, and Police exam aspirants across India.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, React Query |
| Backend | Spring Boot 3.4.5, Java 17, Spring Security |
| Database | MongoDB 7.0 |
| Auth | JWT (stateless) + BCrypt |
| Payments | Razorpay |
| Email/OTP | Spring Mail (Gmail/SES) |
| Storage | AWS S3 |
| Deployment | Docker + docker-compose |
| CI/CD | GitHub Actions |

---

## Quick Start

### Prerequisites
- Java 17+
- Node.js 20+
- MongoDB 7.0 (local or Atlas)
- Maven 3.9+

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/bodhganga.git
cd bodhganga

# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` — **required:**
```env
JWT_SECRET=your-64-char-secret-here   # openssl rand -base64 64
MONGO_URI=mongodb://localhost:27017/bodhganga
```

Edit `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:9090/api
```

### 2. Start Backend

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
# Windows: mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

Backend starts on **http://localhost:9090**

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on **http://localhost:5173**

### 4. Default Admin Credentials

```
Email:    admin@bodhganga.in
Password: Admin@123
```

> ⚠️ Change these immediately in production.

---

## Docker Deployment (Production)

```bash
# Copy and fill in production values
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Services:
- **Frontend** → http://localhost:80
- **Backend** → http://localhost:9090
- **MongoDB** → localhost:27017

---

## API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login (email or phone) |
| POST | `/api/auth/admin/login` | Public | Admin login |
| POST | `/api/auth/otp/send` | Public | Send email OTP |
| POST | `/api/auth/otp/verify` | Public | Verify OTP |

### Courses
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/courses/list` | Public | List courses (paginated) |
| GET | `/api/courses/{id}` | Public | Course detail |
| POST | `/api/courses/enroll/{id}` | User | Enroll in course |
| GET | `/api/courses/my-courses` | User | My enrolled courses |

### Profile & Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/profile` | User | Get profile |
| PUT | `/api/profile/settings/update` | User | Update profile |
| GET | `/api/dashboard/stats` | User | Dashboard statistics |

### Blog
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/blog/posts` | Public | List posts (paginated) |
| GET | `/api/blog/posts/search` | Public | Search posts |
| GET | `/api/blog/{slug}` | Public | Single post |
| POST | `/api/blog/posts` | Admin | Create post |
| PUT | `/api/blog/posts/{id}` | Admin | Update post |
| DELETE | `/api/blog/posts/{id}` | Admin | Delete post |

### Payments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payment/create-order` | User | Create Razorpay order |
| POST | `/api/payment/verify` | User | Verify payment signature |
| POST | `/api/payment/webhook` | Public | Razorpay webhook |

---

## Project Structure

```
bodhganga/
├── backend/                    # Spring Boot API
│   ├── src/main/java/
│   │   └── com/bodhganga/
│   │       ├── config/         # Security, CORS, Exception handling
│   │       ├── controllers/    # REST endpoints
│   │       ├── dto/            # Request/Response DTOs
│   │       ├── entity/         # MongoDB documents
│   │       ├── repo/           # Spring Data repositories
│   │       ├── service/        # Business logic
│   │       └── util/           # JWT utilities
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Auth, Theme contexts
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Page layouts
│   │   ├── pages/              # Route pages
│   │   │   └── admin/          # Admin panel pages
│   │   ├── services/           # API service layer
│   │   ├── styles/             # Global CSS
│   │   └── utils/              # Helpers, constants
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── .github/workflows/ci.yml    # GitHub Actions CI/CD
├── docker-compose.yml          # Full stack deployment
├── .env.example                # Environment template
└── README.md
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | **YES** | Min 64-char secret. Generate: `openssl rand -base64 64` |
| `MONGO_URI` | YES | MongoDB connection string |
| `RAZORPAY_KEY_ID` | For payments | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | For payments | Razorpay secret |
| `SMTP_USER` | For OTP | Gmail address |
| `SMTP_PASS` | For OTP | Gmail App Password |
| `AWS_ACCESS_KEY_ID` | For uploads | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | For uploads | AWS credentials |
| `ALLOWED_ORIGINS` | Production | Comma-separated allowed origins |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | **YES** | Backend API URL |

---

## Deployment Guides

### Vercel (Frontend)
1. Connect GitHub repo to Vercel
2. Set root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add env var: `VITE_API_BASE_URL=https://api.bodhganga.in/api`

### Railway (Backend)
1. Connect GitHub repo
2. Set root directory: `backend`
3. Add all env vars from `backend/.env.example`
4. Railway auto-detects Maven and builds

### MongoDB Atlas
1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user
3. Whitelist Railway/Render IP
4. Copy connection string to `MONGO_URI`

### Razorpay Setup
1. Create account at [razorpay.com](https://razorpay.com)
2. Get API keys from Dashboard → Settings → API Keys
3. Add webhook URL: `https://api.bodhganga.in/api/payment/webhook`
4. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

---

## Security

- JWT tokens (24h expiry, stateless)
- BCrypt password hashing (strength 10)
- Role-based access control (USER / ADMIN)
- Email OTP verification (10-min expiry, 5-attempt limit)
- HMAC-SHA256 payment signature verification
- Global exception handler (no stack traces in responses)
- CORS restricted to configured origins
- Actuator endpoints restricted to ADMIN role

---

## License

Proprietary — BodhGanga Academy © 2026. All rights reserved.
