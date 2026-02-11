# 🎓 BodhGanga - Complete Project Knowledge Base

> **Last Updated:** February 5, 2026  
> **Purpose:** Comprehensive documentation for LLMs and developers to understand the project architecture, previous fixes, and guide future debugging/upgrades.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Deep Dive](#architecture-deep-dive)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Authentication Flow](#authentication-flow)
8. [Previous Issues & Fixes](#previous-issues--fixes)
9. [Running the Project](#running-the-project)
10. [Key Configuration Files](#key-configuration-files)
11. [Frontend Components](#frontend-components)
12. [Backend Services](#backend-services)
13. [Common Debugging Scenarios](#common-debugging-scenarios)
14. [Future Enhancement Guidelines](#future-enhancement-guidelines)

---

## 🎯 Project Overview

**BodhGanga** is a full-stack educational platform (Learning Management System) that provides free, quality education for everyone. The platform allows users to:

- 📚 Browse and enroll in courses
- 🎥 Watch course videos with progress tracking
- 👤 Manage their profile and learning journey
- 📊 Access a personalized dashboard
- 🗺️ Explore educational content about Indian states and union territories
- 📝 Read educational blog posts
- 🔐 Secure authentication with JWT tokens

### Key Features:

- **User Registration & Authentication** (Email/Phone + Password)
- **Course Management** (Browse, Enroll, Track Progress)
- **Video Player** with auto-progress tracking
- **Admin Panel** for content management
- **Indian Tricolor Theme** with modern UI/UX
- **Responsive Design** with Tailwind CSS
- **RESTful API** architecture

---

## 🛠️ Technology Stack

### Backend

- **Framework:** Spring Boot 4.0.0
- **Language:** Java 17
- **Database:** MongoDB (NoSQL)
- **Security:** Spring Security + JWT
- **Password Encryption:** BCrypt (Spring Security Crypto 6.4.5)
- **JWT Library:** io.jsonwebtoken (JJWT 0.12.3)
- **Build Tool:** Maven
- **Server Port:** 9090
- **Database Port:** 27017

### Frontend

- **Framework:** React 18.3.1
- **Build Tool:** Vite 5.1.4
- **Routing:** React Router DOM 6.22.0
- **Styling:** Tailwind CSS 3.4.1
- **HTTP Client:** Axios 1.6.7
- **Toast Notifications:** React Hot Toast 2.4.1
- **Icons:** Lucide React 0.562.0, React Icons 5.0.1
- **Maps:** React Simple Maps 3.0.0
- **Dev Port:** 3000 (Vite default) or 5173

### DevOps & Tools

- **Version Control:** Git
- **IDE Support:** VS Code, IntelliJ IDEA
- **Database:** MongoDB Atlas or Local MongoDB

---

## 📁 Project Structure

```
c:\PROJECTS\bodhganga\
│
├── backend/                          # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/bodhganga/bodhganga/
│   │   │   │   ├── BodhgangaApplication.java    # Main entry point
│   │   │   │   ├── config/
│   │   │   │   │   ├── SecurityConfig.java      # Spring Security config
│   │   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   │   └── DataLoader.java          # Initial data seeding
│   │   │   │   ├── controllers/
│   │   │   │   │   ├── AuthController.java      # /api/auth endpoints
│   │   │   │   │   ├── CourseController.java    # Course management
│   │   │   │   │   ├── DashboardController.java
│   │   │   │   │   ├── ProfileController.java
│   │   │   │   │   └── UserController.java
│   │   │   │   ├── dto/                         # Data Transfer Objects
│   │   │   │   │   ├── ApiResponseDTO.java
│   │   │   │   │   ├── LoginRequestDTO.java
│   │   │   │   │   ├── SignupRequestDTO.java
│   │   │   │   │   └── UserResponseDTO.java
│   │   │   │   ├── entity/                      # MongoDB Documents
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Courses.java
│   │   │   │   │   └── Enrollment.java
│   │   │   │   ├── repo/                        # MongoDB Repositories
│   │   │   │   │   ├── UserRepo.java
│   │   │   │   │   ├── CoursesRepo.java
│   │   │   │   │   └── EnrollmentRepo.java
│   │   │   │   ├── service/
│   │   │   │   │   ├── AuthService.java         # Authentication logic
│   │   │   │   │   └── UserServices.java
│   │   │   │   └── util/
│   │   │   │       └── JwtUtil.java             # JWT token operations
│   │   │   └── resources/
│   │   │       └── application.properties       # Backend configuration
│   │   └── test/
│   ├── pom.xml                                  # Maven dependencies
│   └── mvnw, mvnw.cmd                          # Maven wrapper
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── App.jsx                             # Main app component
│   │   ├── main.jsx                            # React entry point
│   │   ├── assets/                             # Images, logos
│   │   ├── components/
│   │   │   ├── admin/                          # Admin-specific components
│   │   │   ├── common/                         # Reusable components
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   └── AdminProtectedRoute.jsx
│   │   │   ├── content/                        # Content components
│   │   │   ├── map/                            # Map-related components
│   │   │   └── states/                         # State-specific components
│   │   ├── context/
│   │   │   ├── AuthContext.jsx                 # Global auth state
│   │   │   ├── DarkModeContext.jsx
│   │   │   └── SpaceThemeContext.jsx
│   │   ├── data/
│   │   │   ├── states.js                       # Indian states data
│   │   │   └── unionTerritories.js
│   │   ├── hooks/                              # Custom React hooks
│   │   ├── pages/
│   │   │   ├── Landing.jsx                     # Homepage
│   │   │   ├── Register.jsx                    # User registration
│   │   │   ├── VerifyOTP.jsx
│   │   │   ├── Login.jsx                       # User login
│   │   │   ├── Dashboard.jsx                   # User dashboard
│   │   │   ├── Courses.jsx                     # Course listing
│   │   │   ├── CourseDetail.jsx                # Individual course page
│   │   │   ├── CoursePlayer.jsx                # Video player
│   │   │   ├── Profile.jsx                     # User profile
│   │   │   ├── Blog.jsx
│   │   │   ├── BlogPost.jsx
│   │   │   ├── States.jsx
│   │   │   ├── UnionTerritories.jsx
│   │   │   ├── StateDetail.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── Error.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx
│   │   │       └── Dashboard.jsx
│   │   ├── services/
│   │   │   ├── api.js                          # Axios instance & interceptors
│   │   │   ├── authService.js                  # Auth API calls
│   │   │   ├── courseService.js
│   │   │   ├── lessonService.js
│   │   │   └── userService.js
│   │   ├── styles/                             # Global styles
│   │   └── utils/
│   │       ├── constants.js                    # App-wide constants
│   │       ├── storage.js                      # LocalStorage helpers
│   │       └── adminAuth.js                    # Admin authentication
│   ├── index.html                              # HTML entry point
│   ├── package.json                            # NPM dependencies
│   ├── vite.config.js                          # Vite configuration
│   ├── tailwind.config.js                      # Tailwind CSS config
│   ├── postcss.config.js
│   └── .env.example                            # Environment variables template
│
├── READY_TO_TEST.md                  # Previous fix documentation
└── PROJECT_KNOWLEDGE_BASE.md         # This file

```

---

## 🏗️ Architecture Deep Dive

### System Architecture

```
┌─────────────────┐         HTTP/REST         ┌─────────────────┐
│                 │ ◄──────────────────────► │                 │
│  React Frontend │      (Port 3000/5173)     │ Spring Backend  │
│   (Vite + SPA)  │                           │   (Port 9090)   │
│                 │         JWT Auth          │                 │
└─────────────────┘                           └────────┬────────┘
                                                       │
                                                       │
                                              ┌────────▼────────┐
                                              │                 │
                                              │    MongoDB      │
                                              │  (Port 27017)   │
                                              │                 │
                                              └─────────────────┘
```

### Request Flow

1. **User Action** → Frontend React Component
2. **API Call** → Axios Service (`services/api.js`)
3. **JWT Token** → Added via Axios Interceptor
4. **Backend Endpoint** → Spring Controller (`@RestController`)
5. **Authentication** → JwtAuthenticationFilter validates token
6. **Business Logic** → Service Layer (`@Service`)
7. **Data Access** → Repository Layer (`@Repository` extends MongoRepository)
8. **MongoDB** → Document stored/retrieved
9. **Response** → DTO sent back to frontend
10. **UI Update** → React state updates, component re-renders

---

## 🗄️ Database Schema

### Collections

#### 1. **users** Collection

```javascript
{
  _id: ObjectId("..."),
  id: "uuid-string",                    // Custom ID
  name: "John Doe",                      // @NonNull
  email: "john@example.com",             // @Indexed(unique), @NonNull
  phoneNo: "9876543210",                 // @Indexed(unique), @NonNull
  hashedPassword: "$2a$10$...",          // BCrypt hash, @NonNull
  gender: "Male",                        // Optional
  dateOfBirth: ISODate("1990-01-01"),   // Optional
  city: "Mumbai",                        // @NonNull
  state: "Maharashtra",                  // @NonNull
  country: "India",                      // @NonNull
  role: "USER",                          // "USER" or "ADMIN" (default: "USER")
  isVerified: true,                      // Boolean (default: false)
  isActive: true,                        // Boolean (default: true)
  profilePicture: "url",                 // Optional
  qualification: "B.Tech",               // Optional
  createdAt: ISODate("2026-02-01"),     // Auto-set
  lastLogin: ISODate("2026-02-05")      // Updated on login
}
```

#### 2. **courses** Collection

```javascript
{
  _id: ObjectId("..."),
  id: "course-uuid",                     // @NonNull
  courseTitle: "Introduction to Java",   // @Indexed(unique), @NonNull
  description: "Learn Java basics...",   // @NonNull
  instructorName: "Dr. Smith",           // @NotNull
  courseCategory: "Programming",         // @NotNull
  courseDuration: 40.5,                  // Hours (double), @NotNull
  coursePrice: 0.0,                      // Free courses (double), @NotNull
  thumbnailUrl: "https://...",           // Optional
  language: "English",                   // Optional
  totalLectures: 25,                     // Optional (Integer)
  rating: 4.5,                           // Optional (Double)
  enrolledStudents: 150,                 // Optional (Integer)
  createdAt: ISODate("2026-01-15"),     // Optional
  updatedAt: ISODate("2026-02-01")      // Optional
}
```

#### 3. **enrollments** Collection

```javascript
{
  _id: ObjectId("..."),
  id: "enrollment-uuid",
  userId: "user-uuid",                   // Reference to users.id
  courseId: "course-uuid",               // Reference to courses.id
  enrolledAt: ISODate("2026-02-05"),
  status: "IN_PROGRESS",                 // "ENROLLED", "IN_PROGRESS", "COMPLETED"
  progress: 45,                          // 0-100 (Integer)
  completedAt: ISODate("2026-03-01")    // Optional, set when completed
}
```

---

## 🔌 API Endpoints

### Authentication Endpoints (`/api/auth`)

#### 1. **POST /api/auth/signup**

**Purpose:** Register a new user  
**Access:** Public  
**CORS:** Allowed from `http://localhost:5173`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNo": "9876543210",
  "password": "password123",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "gender": "Male", // Optional
  "dateOfBirth": "1990-01-01" // Optional
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNo": "9876543210",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "role": "USER",
      "profilePicture": null,
      "qualification": null
    }
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Email already registered"
}
```

#### 2. **POST /api/auth/login**

**Purpose:** Authenticate user with email/phone + password  
**Access:** Public

**Request Body:**

```json
{
  "emailOrPhone": "john@example.com", // Can be email OR phone
  "password": "password123"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
      /* same as signup */
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized:** Invalid credentials
- **403 Forbidden:** Account deactivated

#### 3. **GET /api/auth/health**

**Purpose:** Health check endpoint  
**Access:** Public

**Response:**

```
"Auth service is running"
```

### Other Endpoints

- **Course Management:** `/api/courses/*`
- **User Profile:** `/api/profile/*`
- **Dashboard:** `/api/dashboard/*`
- **Admin:** `/api/admin/*` (Protected)

---

## 🔐 Authentication Flow

### Flow Diagram

```
1. User Registration/Login
   ↓
2. Backend validates credentials
   ↓
3. Backend generates JWT token (JwtUtil)
   ↓
4. Frontend receives token + user data
   ↓
5. Frontend stores token in localStorage
   ↓
6. Axios interceptor adds token to all requests
   ↓
7. Backend JwtAuthenticationFilter validates token
   ↓
8. Request proceeds to controller/service
```

### JWT Configuration

- **Secret:** 64-character random string (in `application.properties`)
- **Expiration:** 86400000 ms (24 hours)
- **Algorithm:** HS256
- **Header:** `Authorization: Bearer <token>`

### Frontend Token Management

**Storage:** `localStorage` (keys: `auth_token`, `user_data`)

**Axios Interceptor Logic:**

```javascript
// Request: Add token to headers
config.headers.Authorization = `Bearer ${token}`;

// Response: Handle 401 errors
if (status === 401) {
  clearAuthData(); // Remove token & user data
  window.location.href = "/login";
}
```

### Backend JWT Filter

**Class:** `JwtAuthenticationFilter.java`  
**Triggers:** On every request to protected endpoints  
**Process:**

1. Extract token from `Authorization` header
2. Validate token signature & expiration
3. Extract user details (email, userId, role)
4. Set authentication in SecurityContext
5. Allow request to proceed

---

## 🐛 Previous Issues & Fixes

### Critical Issues Resolved (as of READY_TO_TEST.md)

#### **Issue 1: 403 Forbidden Error**

**Problem:** Spring Security was blocking all requests to `/api/auth/*`

**Root Cause:** SecurityConfig was not explicitly allowing auth endpoints

**Fix Applied:**

```java
// SecurityConfig.java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.disable())
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()  // ✅ Added
            .anyRequest().authenticated()
        );
    return http.build();
}
```

#### **Issue 2: 500 Internal Server Error - @NonNull Validation**

**Problem:** Lombok's `@NonNull` was rejecting null values for `gender` and `dateOfBirth`

**Root Cause:** User entity had `@NonNull` on optional fields

**Fix Applied:**

```java
// User.java - BEFORE
@NonNull
private String gender;      // ❌ Caused error when null

@NonNull
private Date dateOfBirth;   // ❌ Caused error when null

// User.java - AFTER
private String gender;      // ✅ Made optional
private Date dateOfBirth;   // ✅ Made optional
```

#### **Issue 3: Frontend Environment Variables Not Loaded**

**Problem:** Vite wasn't reading `.env` file

**Fix Applied:**

1. Created `.env` file with `VITE_API_BASE_URL=http://localhost:9090/api`
2. Restarted Vite dev server to pick up changes

#### **Issue 4: Login DTO Field Mismatch**

**Problem:** Frontend sent `email` but backend expected both email AND phone

**Fix Applied:**

```java
// LoginRequestDTO.java - Changed from:
private String email;

// To:
private String emailOrPhone;  // ✅ Supports both email and phone
```

**Backend Service Logic:**

```java
// AuthService.java
String emailOrPhone = dto.getEmailOrPhone();
if (emailOrPhone.contains("@")) {
    user = userRepo.findByEmail(emailOrPhone);
} else {
    user = userRepo.findByPhoneNo(emailOrPhone);
}
```

#### **Issue 5: "Check Your Internet Connection" Error**

**Problem:** Generic error message when backend was unreachable

**Root Causes:**

1. Spring Security 403 (Issue #1)
2. Missing @NonNull fields (Issue #2)
3. Frontend .env not loaded (Issue #3)

**All Fixed!** ✅

---

## 🚀 Running the Project

### Prerequisites

- **Java:** JDK 17+
- **Node.js:** v18+
- **MongoDB:** Running on `localhost:27017`
- **Maven:** Installed (or use `mvnw`)

### Backend Setup

```bash
# Navigate to backend folder
cd c:\PROJECTS\bodhganga\backend

# Install dependencies (Maven will auto-download)
./mvnw clean install

# Run the Spring Boot application
./mvnw spring-boot:run

# Alternative: Run from IDE
# Open BodhgangaApplication.java → Run main()
```

**Expected Output:**

```
Started BodhgangaApplication in X seconds (JVM running for Y)
Server running on port 9090
```

**Verify Backend:**

```bash
curl http://localhost:9090/api/auth/health
# Expected: "Auth service is running"
```

### Frontend Setup

```bash
# Navigate to frontend folder
cd c:\PROJECTS\bodhganga\frontend

# Install dependencies
npm install

# Create .env file (if not exists)
echo "VITE_API_BASE_URL=http://localhost:9090/api" > .env

# Run Vite dev server
npm run dev

# Expected output:
#   VITE v5.1.4  ready in X ms
#   ➜  Local:   http://localhost:5173/
```

**Open in Browser:**

```
http://localhost:3000  OR  http://localhost:5173
```

### MongoDB Setup

```bash
# Start MongoDB (if not running as service)
mongod --dbpath /path/to/data

# Verify connection
mongo
> use bodhganga
> show collections
# Should show: users, courses, enrollments
```

---

## ⚙️ Key Configuration Files

### 1. `backend/src/main/resources/application.properties`

```properties
spring.application.name=bodhganga
server.port=9090

# MongoDB
spring.mongodb.port=27017
spring.mongodb.uri=mongodb://localhost:27017/bodhganga
spring.data.mongodb.auto-index-creation=true

# JWT
jwt.secret=5Jf8Kl9mN3pQ6rS8tU1vW4xY7zA2bC5dE8fG1hJ4kL7mN0pQ3rS6tU9vW2xY5zA8
jwt.expiration=86400000  # 24 hours
```

### 2. `backend/pom.xml`

**Key Dependencies:**

- `spring-boot-starter-data-mongodb`
- `spring-boot-starter-security`
- `spring-security-crypto:6.4.5`
- `jjwt-api:0.12.3` (JWT)
- `lombok`
- `spring-boot-starter-validation`

### 3. `frontend/.env` (Create from `.env.example`)

```bash
VITE_API_BASE_URL=http://localhost:9090/api
```

### 4. `frontend/tailwind.config.js`

**Custom Theme:**

- Indian Tricolor colors (Saffron, Navy, Green)
- Inter font family
- Custom animations (fade-in, slide-up, slide-down)

### 5. `frontend/src/utils/constants.js`

**Important Constants:**

```javascript
API_BASE_URL = "http://localhost:9090/api";
STORAGE_KEYS = { AUTH_TOKEN: "auth_token", USER_DATA: "user_data" };
OTP_CONFIG = { LENGTH: 6, EXPIRY_MINUTES: 10 };
VIDEO_CONFIG = { AUTO_COMPLETE_THRESHOLD: 0.9 };
```

---

## 🧩 Frontend Components

### Core Components

#### **AuthContext.jsx**

**Purpose:** Global authentication state management  
**Provides:**

- `user` object
- `token` string
- `login(userData, token)` function
- `logout()` function
- `isAuthenticated` boolean

#### **ProtectedRoute.jsx**

**Purpose:** Protect routes that require authentication  
**Logic:**

```jsx
if (!isAuthenticated) {
  return <Navigate to="/login" />;
}
return <>{children}</>;
```

#### **Navbar.jsx**

**Purpose:** Main navigation bar  
**Features:**

- Conditional rendering (logged in vs guest)
- Links to Dashboard, Courses, Profile
- Logout button

#### **api.js (Axios Instance)**

**Purpose:** Centralized HTTP client  
**Key Features:**

- Base URL: `API_BASE_URL`
- Request interceptor: Adds JWT token
- Response interceptor: Handles 401 errors, network errors
- Timeout: 15 seconds

### Page Components

#### **Register.jsx**

**Fields:** Name, Email, Phone, Password, City, State, Country (Gender/DOB optional)  
**On Success:** Auto-login + redirect to `/dashboard`

#### **Login.jsx**

**Fields:** Email/Phone, Password  
**On Success:** Store token + redirect to `/dashboard`

#### **Dashboard.jsx**

**Features:**

- Enrolled courses display
- Progress tracking
- Quick actions (Browse courses, View profile)

#### **CoursePlayer.jsx**

**Features:**

- Video playback
- Auto-save progress every 10 seconds
- Auto-complete at 90% watched
- Lesson navigation

---

## 🔧 Backend Services

### AuthService.java

**Methods:**

1. `signup(SignupRequestDTO)` → Validates, hashes password, saves user, returns JWT
2. `login(LoginRequestDTO)` → Validates credentials, updates lastLogin, returns JWT
3. `mapToUserResponse(User)` → Strips sensitive data (hashedPassword)

### UserServices.java

**Methods:**

- User CRUD operations
- Profile updates
- User enrollment management

### JwtUtil.java

**Methods:**

1. `generateToken(email, userId, role)` → Creates JWT with claims
2. `validateToken(token)` → Checks signature & expiration
3. `extractClaims(token)` → Gets user data from token

---

## 🩺 Common Debugging Scenarios

### 1. **"Network Error" / "Check Your Internet Connection"**

**Possible Causes:**

- Backend not running
- Wrong API URL in frontend
- CORS issues
- Firewall blocking ports

**Debug Steps:**

```bash
# 1. Check if backend is running
curl http://localhost:9090/api/auth/health

# 2. Check frontend .env file
cat frontend/.env
# Should have: VITE_API_BASE_URL=http://localhost:9090/api

# 3. Restart frontend (Vite needs restart to pick up .env changes)
cd frontend
npm run dev

# 4. Check browser console for CORS errors
# Open DevTools → Console → Look for red errors
```

### 2. **403 Forbidden Error**

**Cause:** Spring Security blocking requests

**Fix:**

```java
// Check SecurityConfig.java
.requestMatchers("/api/auth/**").permitAll()  // Must be present
```

### 3. **500 Internal Server Error on Signup**

**Possible Causes:**

- Missing required fields
- `@NonNull` validation failing
- Database connection issue

**Debug Steps:**

```bash
# 1. Check backend logs for stack trace
# Look for: NullPointerException, ValidationException

# 2. Verify MongoDB is running
mongo
> use bodhganga

# 3. Check User.java entity
# Ensure optional fields don't have @NonNull
```

### 4. **JWT Token Expired / 401 Unauthorized**

**Cause:** Token expired (24 hours) or invalid

**Solution:**

- Frontend automatically clears localStorage and redirects to `/login`
- User must log in again

### 5. **Cannot Login with Phone Number**

**Cause:** LoginRequestDTO field name mismatch

**Verify:**

```java
// LoginRequestDTO.java should have:
private String emailOrPhone;  // NOT just "email"

// AuthService.java should handle both:
if (emailOrPhone.contains("@")) { /* email */ }
else { /* phone */ }
```

### 6. **Courses Not Showing**

**Debug:**

```javascript
// Check MongoDB
db.courses.find().pretty();

// Check API response in browser DevTools
// Network tab → /api/courses → Response

// Check courseService.js
// Ensure API endpoint is correct
```

---

## 🚀 Future Enhancement Guidelines

### For LLMs Working on This Project:

#### **Adding a New API Endpoint**

1. **Create DTO** (if needed) in `backend/dto/`
2. **Add method to Service** in `backend/service/`
3. **Create Controller endpoint** in `backend/controllers/`
4. **Update SecurityConfig** if endpoint needs different permissions
5. **Create frontend service** in `frontend/src/services/`
6. **Call from React component**

**Example: Add "Forgot Password" feature**

```java
// 1. Create DTO
public class ForgotPasswordDTO {
    private String email;
}

// 2. AuthService method
public ApiResponseDTO forgotPassword(ForgotPasswordDTO dto) {
    // Send reset email
}

// 3. AuthController endpoint
@PostMapping("/forgot-password")
public ResponseEntity<ApiResponseDTO> forgotPassword(@Valid @RequestBody ForgotPasswordDTO dto) {
    return ResponseEntity.ok(authService.forgotPassword(dto));
}

// 4. SecurityConfig
.requestMatchers("/api/auth/forgot-password").permitAll()

// 5. Frontend service
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

// 6. React component
<button onClick={() => authService.forgotPassword(email)}>Reset</button>
```

#### **Adding a New Page**

1. Create component in `frontend/src/pages/`
2. Add route in `App.jsx`
3. Add navigation link in `Navbar.jsx`
4. Update `ROUTES` constant in `utils/constants.js`

#### **Adding a New Database Collection**

1. Create `@Document` entity in `backend/entity/`
2. Create Repository interface extending `MongoRepository`
3. Create Service for business logic
4. Create Controller for API endpoints
5. MongoDB will auto-create collection on first insert

#### **Modifying User Schema**

**⚠️ IMPORTANT:**

- If adding **required** field, ensure existing users have default value
- Update `UserResponseDTO` and `SignupRequestDTO`
- Update `mapToUserResponse()` method
- Update frontend Registration form

#### **Testing Checklist**

Before pushing any changes:

- [ ] Backend compiles: `./mvnw clean install`
- [ ] Backend runs: `./mvnw spring-boot:run`
- [ ] Health check passes: `curl http://localhost:9090/api/auth/health`
- [ ] Frontend builds: `npm run build`
- [ ] Frontend runs: `npm run dev`
- [ ] Registration works
- [ ] Login works
- [ ] Protected routes redirect if not authenticated
- [ ] MongoDB data persists correctly

---

## 📝 Important Notes for Future Debugging

### 1. **Always Check Environment Variables**

```bash
# Backend: application.properties
# Frontend: .env (must start with VITE_)
```

### 2. **Restart Services After Config Changes**

- Backend: Stop & restart Spring Boot
- Frontend: Stop (`Ctrl+C`) & restart Vite (`npm run dev`)
- MongoDB: Usually doesn't need restart unless config changes

### 3. **Common Lombok Issues**

- Ensure Lombok plugin is installed in IDE
- Maven annotation processor path is configured
- `@NonNull` only on truly required fields
- `@Builder.Default` for fields with default values

### 4. **CORS Configuration**

```java
// AuthController.java
@CrossOrigin(origins = "http://localhost:5173")  // Update if frontend port changes
```

### 5. **MongoDB Indexes**

- Email and Phone have `@Indexed(unique = true)`
- Duplicate entries will throw error
- Check indexes: `db.users.getIndexes()`

### 6. **JWT Secret Security**

- Never commit production JWT secret to Git
- Use environment variables in production
- Rotate secrets periodically

### 7. **Password Security**

- BCrypt automatically salts + hashes
- Never log passwords
- Never return `hashedPassword` in API responses

---

## 🎓 Learning Resources

### For Understanding the Codebase:

**Spring Boot:**

- Spring Security: https://spring.io/guides/topicals/spring-security-architecture
- MongoDB Integration: https://docs.spring.io/spring-data/mongodb/docs/current/reference/html/
- JWT: https://jwt.io/introduction

**React:**

- React Router: https://reactrouter.com/
- Context API: https://react.dev/reference/react/useContext
- Axios: https://axios-http.com/docs/intro

**MongoDB:**

- Document Model: https://www.mongodb.com/docs/manual/core/document/
- Indexes: https://www.mongodb.com/docs/manual/indexes/

---

## 🏁 Quick Reference

### Start the Full Stack

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Backend
cd c:\PROJECTS\bodhganga\backend
./mvnw spring-boot:run

# Terminal 3: Frontend
cd c:\PROJECTS\bodhganga\frontend
npm run dev
```

### Test Registration Flow

```powershell
# PowerShell command
$body = @{
    name = "Test User"
    email = "test@example.com"
    phoneNo = "9876543210"
    password = "password123"
    city = "Mumbai"
    state = "Maharashtra"
    country = "India"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:9090/api/auth/signup" -Method POST -Body $body -ContentType "application/json"
```

### Check MongoDB Data

```javascript
mongo
use bodhganga
db.users.find().pretty()
db.courses.find().pretty()
db.enrollments.find().pretty()
```

---

## 🤝 Contributing Guidelines (For Future Updates)

1. **Read this document first** before making changes
2. **Test locally** before committing
3. **Update this document** if you add new features or fix bugs
4. **Document breaking changes** clearly
5. **Keep security in mind** (never expose secrets, validate all inputs)

---

**Last Updated:** February 5, 2026  
**Version:** 1.0  
**Maintained For:** Future LLMs and Developers working on BodhGanga

---

_This document is designed to give any LLM or developer a complete understanding of the BodhGanga project. It should be updated whenever significant changes are made to the architecture, technologies, or critical fixes._
