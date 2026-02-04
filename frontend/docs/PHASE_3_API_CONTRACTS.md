# GANGABHODH LEARNING PLATFORM
## PHASE 3: API CONTRACT VALIDATION

---

## 1. OVERVIEW

This document defines the complete API contract between the Gangabhodh frontend and backend. 
It specifies all required endpoints, request formats, response formats, authentication requirements, 
and error handling patterns.

**Base URL:** `http://localhost:5000` (development)  
**Production URL:** `https://api.gangabhodh.com` (to be confirmed)

**Authentication Method:** JWT (JSON Web Token)  
**Authentication Header:** `Authorization: Bearer <token>`

---

## 2. AUTHENTICATION ENDPOINTS

### 2.1 User Registration

**Endpoint:** `POST /api/auth/register`  
**Access:** Public  
**Purpose:** Register a new user with email/phone + password (FR-1)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "emailOrPhone": "user@example.com",
  "password": "SecurePass123"
}
```

**Field Validations (Frontend):**
- `emailOrPhone`: Required, valid email OR phone format
- `password`: Required, min 8 chars, contains uppercase + lowercase + number

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. OTP sent to your email/phone.",
  "data": {
    "userId": "user123",
    "emailOrPhone": "user@example.com",
    "otpSentTo": "user@example.com",
    "otpExpiresIn": 600
  }
}
```

**Error Responses:**

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "emailOrPhone", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

**409 Conflict - User Already Exists:**
```json
{
  "success": false,
  "message": "User already exists with this email/phone"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to send OTP. Please try again later."
}
```

**Frontend Actions:**
- On success: Store `emailOrPhone` in state, navigate to `/verify-otp`
- On error 409: Show "Already registered? Login" link
- On error 500: Show retry button

**SRS Requirements:** FR-1, FR-2, FR-15

---

### 2.2 Verify OTP

**Endpoint:** `POST /api/auth/verify-otp`  
**Access:** Public  
**Purpose:** Verify user's email/phone with OTP to complete registration (FR-2)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "emailOrPhone": "user@example.com",
  "otp": "123456"
}
```

**Field Validations (Frontend):**
- `emailOrPhone`: Required
- `otp`: Required, exactly 6 digits

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Account verified successfully. You can now login.",
  "data": {
    "userId": "user123",
    "verified": true
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid OTP:**
```json
{
  "success": false,
  "message": "Invalid OTP. Please try again."
}
```

**410 Gone - Expired OTP:**
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new one.",
  "expired": true
}
```

**404 Not Found - User Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**429 Too Many Requests - Too Many Attempts:**
```json
{
  "success": false,
  "message": "Too many verification attempts. Please try again later.",
  "retryAfter": 300
}
```

**Frontend Actions:**
- On success: Show success message, redirect to `/login` after 2 seconds
- On error 410: Disable verify button, highlight "Resend OTP" button
- On error 429: Disable form, show countdown timer

**SRS Requirements:** FR-2, FR-3, FR-16

---

### 2.3 Resend OTP

**Endpoint:** `POST /api/auth/resend-otp`  
**Access:** Public  
**Purpose:** Resend OTP to user's email/phone (FR-2)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "emailOrPhone": "user@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "data": {
    "otpSentTo": "user@example.com",
    "otpExpiresIn": 600
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**429 Too Many Requests - Rate Limit:**
```json
{
  "success": false,
  "message": "Please wait before requesting another OTP",
  "retryAfter": 60
}
```

**Frontend Actions:**
- On success: Reset OTP timer to 10 minutes, show toast
- Implement 60-second cooldown on frontend (disable button)

**SRS Requirements:** FR-2, FR-15

---

### 2.4 User Login

**Endpoint:** `POST /api/auth/login`  
**Access:** Public  
**Purpose:** Authenticate verified user and generate JWT (FR-3, FR-4)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "emailOrPhone": "user@example.com",
  "password": "SecurePass123"
}
```

**Field Validations (Frontend):**
- `emailOrPhone`: Required
- `password`: Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMTIzIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "user": {
      "id": "user123",
      "name": "John Doe",
      "emailOrPhone": "user@example.com",
      "avatar": null,
      "verified": true,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**

**401 Unauthorized - Invalid Credentials:**
```json
{
  "success": false,
  "message": "Invalid email/phone or password"
}
```

**403 Forbidden - Account Not Verified:**
```json
{
  "success": false,
  "message": "Please verify your account first. Check your email for OTP.",
  "verified": false,
  "emailOrPhone": "user@example.com"
}
```

**404 Not Found - User Not Found:**
```json
{
  "success": false,
  "message": "No account found with this email/phone. Please sign up."
}
```

**Frontend Actions:**
- On success: 
  - Store `token` in `localStorage` with key `auth_token`
  - Store `user` data in AuthContext
  - Redirect to `/dashboard`
- On error 403: Show "Resend Verification" link (→ `/verify-otp`)
- On error 404: Show "Sign Up" button (→ `/register`)

**JWT Token Details (REQUIRED CLARIFICATION):**
- **Question 1:** What is the token expiry time? (e.g., 1 hour, 24 hours, 7 days)
- **Question 2:** Is there a refresh token mechanism?
- **Question 3:** Should token be stored in `localStorage` or `httpOnly` cookie?

**SRS Requirements:** FR-3, FR-4, FR-5, FR-16, NFR-4

---

### 2.5 Logout (Optional - Frontend Handles)

**Endpoint:** `POST /api/auth/logout` (if backend tracks sessions)  
**Access:** Protected  
**Purpose:** Invalidate JWT token (optional, frontend can handle locally)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Frontend Actions:**
- Clear `localStorage` (`auth_token`)
- Clear AuthContext
- Redirect to `/login`

**Note:** If backend doesn't provide logout endpoint, frontend handles logout locally.

---

## 3. USER PROFILE ENDPOINTS

### 3.1 Get User Profile

**Endpoint:** `GET /api/users/profile`  
**Access:** Protected (Requires JWT)  
**Purpose:** Fetch current user's profile data (FR-6)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "name": "John Doe",
    "emailOrPhone": "user@example.com",
    "avatar": "https://example.com/avatars/user123.jpg",
    "verified": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "stats": {
      "coursesEnrolled": 5,
      "lessonsCompleted": 23,
      "totalHoursLearned": 12.5,
      "certificatesEarned": 0
    }
  }
}
```

**Error Responses:**

**401 Unauthorized - Invalid/Expired Token:**
```json
{
  "success": false,
  "message": "Invalid or expired token. Please login again."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Frontend Actions:**
- On success: Display profile data on `/profile` page
- On error 401: Clear auth, redirect to `/login` with message "Session expired"

**SRS Requirements:** FR-6

---

### 3.2 Update User Profile (Future - FR-7)

**Endpoint:** `PUT /api/users/profile`  
**Access:** Protected  
**Purpose:** Update user's name, avatar, or other info (FR-7)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated Doe",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user123",
    "name": "John Updated Doe",
    "emailOrPhone": "user@example.com",
    "avatar": "https://example.com/new-avatar.jpg"
  }
}
```

**Error Responses:**

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "message": "Invalid data",
  "errors": [
    { "field": "name", "message": "Name is required" }
  ]
}
```

**Frontend Actions:**
- On success: Update AuthContext with new user data, show toast
- Future implementation (FR-7)

**SRS Requirements:** FR-7 (future scope)

---

## 4. COURSE ENDPOINTS

### 4.1 Get All Courses

**Endpoint:** `GET /api/courses`  
**Access:** Protected (or Public for landing page preview?)  
**Purpose:** Fetch list of all available courses (FR-8)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters (Optional - Future):**
```
?category=programming
?search=react
?sort=newest
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "course123",
      "title": "Introduction to React",
      "description": "Learn React from scratch with hands-on projects...",
      "thumbnail": "https://example.com/thumbnails/react-course.jpg",
      "category": "Programming",
      "duration": "5 hours",
      "lessonCount": 10,
      "isEnrolled": false,
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "course456",
      "title": "Web Design Fundamentals",
      "description": "Master the principles of modern web design...",
      "thumbnail": "https://example.com/thumbnails/design-course.jpg",
      "category": "Design",
      "duration": "4 hours",
      "lessonCount": 8,
      "isEnrolled": true,
      "createdAt": "2025-12-15T00:00:00.000Z"
    }
  ]
}
```

**REQUIRED CLARIFICATION:**
- **Question 4:** Should this endpoint be public (for landing page) or protected?
- **Question 5:** Does the response include `isEnrolled` field, or should frontend fetch enrollments separately?

**Error Responses:**

**401 Unauthorized (if protected):**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to fetch courses"
}
```

**Frontend Actions:**
- On success: Display courses on `/courses` page and landing page preview
- Show skeleton loader while fetching

**SRS Requirements:** FR-8

---

### 4.2 Get Course by ID

**Endpoint:** `GET /api/courses/:id`  
**Access:** Protected  
**Purpose:** Fetch detailed course information including lessons (FR-11)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "course123",
    "title": "Introduction to React",
    "description": "Comprehensive course covering React fundamentals, hooks, state management, and more...",
    "thumbnail": "https://example.com/thumbnails/react-course.jpg",
    "category": "Programming",
    "duration": "5 hours",
    "lessonCount": 10,
    "instructor": {
      "name": "Jane Smith",
      "bio": "Senior React Developer with 10 years of experience"
    },
    "isEnrolled": true,
    "progress": 45,
    "lessons": [
      {
        "id": "lesson1",
        "title": "Introduction to React",
        "description": "Overview of React and its ecosystem",
        "duration": "15 min",
        "videoUrl": "https://example.com/videos/lesson1.mp4",
        "order": 1,
        "isCompleted": true
      },
      {
        "id": "lesson2",
        "title": "Setting Up Your Environment",
        "description": "Install Node.js, npm, and create-react-app",
        "duration": "20 min",
        "videoUrl": "https://example.com/videos/lesson2.mp4",
        "order": 2,
        "isCompleted": true
      },
      {
        "id": "lesson3",
        "title": "JSX and Components",
        "description": "Learn JSX syntax and create your first components",
        "duration": "30 min",
        "videoUrl": "https://example.com/videos/lesson3.mp4",
        "order": 3,
        "isCompleted": false
      }
    ],
    "lastAccessedLesson": {
      "lessonId": "lesson3",
      "lessonTitle": "JSX and Components",
      "timestamp": "2026-01-10T15:30:00.000Z"
    },
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**REQUIRED CLARIFICATION:**
- **Question 6:** Does this endpoint return lesson completion status (`isCompleted`) per lesson?
- **Question 7:** Does it include `lastAccessedLesson` or should that be fetched from progress endpoint?
- **Question 8:** What format are video URLs? (direct MP4, YouTube, Vimeo, streaming service?)

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Course not found"
}
```

**Frontend Actions:**
- On success: Display on `/courses/:id` page
- Show course details, lessons list, enrollment status

**SRS Requirements:** FR-11, FR-14

---

## 5. ENROLLMENT ENDPOINTS

### 5.1 Enroll in Course

**Endpoint:** `POST /api/enrollments`  
**Access:** Protected  
**Purpose:** Enroll current user in a course (FR-9)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "courseId": "course123"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Enrolled successfully in Introduction to React",
  "data": {
    "enrollmentId": "enroll789",
    "courseId": "course123",
    "userId": "user123",
    "enrolledAt": "2026-01-11T10:00:00.000Z",
    "progress": 0
  }
}
```

**Error Responses:**

**400 Bad Request - Already Enrolled:**
```json
{
  "success": false,
  "message": "You are already enrolled in this course"
}
```

**404 Not Found - Course Not Found:**
```json
{
  "success": false,
  "message": "Course not found"
}
```

**Frontend Actions:**
- On success: Update course card to show "Enrolled", show toast, redirect to course player
- On error 400: Show "Already enrolled. Continue learning" message

**SRS Requirements:** FR-9

---

### 5.2 Get User's Enrolled Courses

**Endpoint:** `GET /api/enrollments/my-courses`  
**Access:** Protected  
**Purpose:** Fetch all courses the user is enrolled in (FR-10)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "enrollmentId": "enroll789",
      "courseId": "course123",
      "courseTitle": "Introduction to React",
      "courseThumbnail": "https://example.com/thumbnails/react-course.jpg",
      "courseDescription": "Learn React from scratch...",
      "courseDuration": "5 hours",
      "lessonCount": 10,
      "progress": 45,
      "lessonsCompleted": 5,
      "lastAccessedLesson": {
        "lessonId": "lesson6",
        "lessonTitle": "State Management with Hooks",
        "timestamp": "2026-01-10T15:30:00.000Z"
      },
      "enrolledAt": "2026-01-05T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**Frontend Actions:**
- On success: Display on `/dashboard` and `/profile` pages
- If empty array: Show "No enrolled courses" message with CTA

**SRS Requirements:** FR-10, FR-13, FR-14

---

### 5.3 Unenroll from Course (Optional - Future)

**Endpoint:** `DELETE /api/enrollments/:courseId`  
**Access:** Protected  
**Purpose:** Remove user from course (future feature)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Unenrolled from course successfully"
}
```

---

## 6. PROGRESS TRACKING ENDPOINTS

### 6.1 Mark Lesson as Completed

**Endpoint:** `POST /api/progress/complete`  
**Access:** Protected  
**Purpose:** Mark a specific lesson as completed (FR-12)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "courseId": "course123",
  "lessonId": "lesson3"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Lesson marked as complete",
  "data": {
    "courseId": "course123",
    "lessonId": "lesson3",
    "completedAt": "2026-01-11T10:30:00.000Z",
    "courseProgress": 50,
    "lessonsCompleted": 5,
    "totalLessons": 10
  }
}
```

**Error Responses:**

**400 Bad Request - Already Completed:**
```json
{
  "success": false,
  "message": "Lesson already marked as complete"
}
```

**404 Not Found - Lesson/Course Not Found:**
```json
{
  "success": false,
  "message": "Lesson not found"
}
```

**Frontend Actions:**
- On success: Update lesson status to completed, update progress bar, show toast
- Auto-advance to next lesson

**SRS Requirements:** FR-12, FR-14

---

### 6.2 Update Last Accessed Lesson

**Endpoint:** `PUT /api/progress/last-accessed`  
**Access:** Protected  
**Purpose:** Track the last lesson user accessed (FR-13)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "courseId": "course123",
  "lessonId": "lesson5",
  "timestamp": "2026-01-11T10:30:00.000Z"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Progress updated",
  "data": {
    "courseId": "course123",
    "lessonId": "lesson5",
    "timestamp": "2026-01-11T10:30:00.000Z"
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Course not found"
}
```

**Frontend Actions:**
- Call this endpoint when user starts watching a lesson
- Use for "Resume from last lesson" feature

**SRS Requirements:** FR-13

---

### 6.3 Get Course Progress

**Endpoint:** `GET /api/progress/:courseId`  
**Access:** Protected  
**Purpose:** Get detailed progress for a specific course (FR-14)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "courseId": "course123",
    "userId": "user123",
    "progress": 50,
    "lessonsCompleted": 5,
    "totalLessons": 10,
    "completedLessons": [
      {
        "lessonId": "lesson1",
        "completedAt": "2026-01-05T11:00:00.000Z"
      },
      {
        "lessonId": "lesson2",
        "completedAt": "2026-01-06T14:30:00.000Z"
      }
    ],
    "lastAccessedLesson": {
      "lessonId": "lesson6",
      "timestamp": "2026-01-10T15:30:00.000Z"
    },
    "startedAt": "2026-01-05T10:00:00.000Z",
    "lastActivityAt": "2026-01-10T15:30:00.000Z"
  }
}
```

**Error Responses:**

**404 Not Found - Not Enrolled:**
```json
{
  "success": false,
  "message": "You are not enrolled in this course"
}
```

**Frontend Actions:**
- On success: Display progress on dashboard, course details, player
- Use to show progress bars, completion status

**SRS Requirements:** FR-14

---

### 6.4 Get Overall Progress Summary (Optional)

**Endpoint:** `GET /api/progress/summary`  
**Access:** Protected  
**Purpose:** Get user's overall learning statistics

**Request Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalCoursesEnrolled": 5,
    "totalLessonsCompleted": 23,
    "totalHoursLearned": 12.5,
    "activeCourses": 3,
    "completedCourses": 0,
    "recentActivity": [
      {
        "type": "lesson_completed",
        "courseTitle": "Introduction to React",
        "lessonTitle": "State Management",
        "timestamp": "2026-01-10T15:30:00.000Z"
      }
    ]
  }
}
```

**Frontend Actions:**
- Display on dashboard and profile pages

---

## 7. ERROR HANDLING STANDARDS

### 7.1 Standard Error Response Format

**All error responses should follow this structure:**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (dev mode only)",
  "errors": [
    { "field": "fieldName", "message": "Field-specific error" }
  ]
}
```

### 7.2 HTTP Status Codes

| Status Code | Meaning | Frontend Action |
|-------------|---------|-----------------|
| 200 OK | Success | Display data |
| 201 Created | Resource created | Show success message |
| 400 Bad Request | Invalid input | Show inline validation errors |
| 401 Unauthorized | Invalid/expired token | Redirect to login |
| 403 Forbidden | Access denied | Show error, suggest login |
| 404 Not Found | Resource not found | Show "Not found" message |
| 409 Conflict | Duplicate resource | Show "Already exists" message |
| 429 Too Many Requests | Rate limit exceeded | Show cooldown timer |
| 500 Internal Server Error | Server error | Show "Try again later" |
| 503 Service Unavailable | Server down | Show "Service unavailable" |

### 7.3 Token Expiry Handling

**When backend returns 401 with expired token:**
```json
{
  "success": false,
  "message": "Token expired. Please login again.",
  "expired": true
}
```

**Frontend Action:**
1. Clear `localStorage` auth token
2. Clear AuthContext
3. Redirect to `/login`
4. Show toast: "Session expired. Please login again."

---

## 8. REQUIRED BACKEND CLARIFICATIONS

Before implementation, the following MUST be clarified:

### Authentication & Security
1. **JWT Expiry:** How long is the JWT valid? (1 hour, 24 hours, 7 days?)
2. **Refresh Token:** Is there a refresh token mechanism to extend sessions?
3. **Token Storage:** Should JWT be in response body (for localStorage) or httpOnly cookie?
4. **Password Requirements:** Any specific backend validation rules? (min chars, special chars, etc.)

### Course Data
5. **Course Endpoint Access:** Is `GET /api/courses` public or protected?
6. **Enrollment Status:** Does course data include `isEnrolled` field or fetch separately?
7. **Video URLs:** What format are video URLs? (direct MP4, YouTube, streaming service?)
8. **Lesson Completion:** Does course detail endpoint include per-lesson `isCompleted` status?

### Progress Tracking
9. **Progress Calculation:** Is progress percentage calculated by backend or frontend?
10. **Playback Position:** Should we track video playback position (e.g., user watched 2:30 of 10:00)?
11. **Auto-Complete:** Should lessons auto-mark as complete when 90%+ watched, or manual only?

### Error Handling
12. **Error Format:** Confirmed standard error response format above - is this accurate?
13. **CORS:** Which origins are allowed in CORS policy?

### Future Features
14. **Search/Filter:** Are course search and category filtering supported?
15. **Pagination:** Should course list be paginated? If yes, what's the page size?

---

## 9. FRONTEND SERVICE LAYER IMPLEMENTATION PLAN

Based on these contracts, the frontend will implement:

### authService.js
```javascript
- register(emailOrPhone, password) → POST /api/auth/register
- verifyOTP(emailOrPhone, otp) → POST /api/auth/verify-otp
- resendOTP(emailOrPhone) → POST /api/auth/resend-otp
- login(emailOrPhone, password) → POST /api/auth/login
- logout() → Clear localStorage, redirect
```

### courseService.js
```javascript
- getAllCourses(query?) → GET /api/courses
- getCourseById(id) → GET /api/courses/:id
- enrollCourse(courseId) → POST /api/enrollments
- getEnrolledCourses() → GET /api/enrollments/my-courses
```

### lessonService.js
```javascript
- markLessonComplete(courseId, lessonId) → POST /api/progress/complete
- updateLastAccessed(courseId, lessonId) → PUT /api/progress/last-accessed
- getCourseProgress(courseId) → GET /api/progress/:courseId
```

### userService.js
```javascript
- getProfile() → GET /api/users/profile
- updateProfile(data) → PUT /api/users/profile (future)
```

### api.js (Base Configuration)
```javascript
- Axios instance with baseURL
- Request interceptor: Add JWT to headers
- Response interceptor: Handle 401 (auto-logout)
- Error parser: Convert API errors to user-friendly messages
```

---

## 10. TESTING CHECKLIST

Once backend is available, frontend will test:

### Authentication Flow
- [ ] Register with valid email
- [ ] Register with valid phone
- [ ] Register with invalid email/phone (expect error)
- [ ] Verify OTP with correct code
- [ ] Verify OTP with incorrect code (expect error)
- [ ] Verify OTP after expiry (expect error)
- [ ] Resend OTP (verify new code sent)
- [ ] Login with correct credentials
- [ ] Login with wrong password (expect error)
- [ ] Login before verification (expect error)
- [ ] JWT token stored in localStorage
- [ ] Logout clears token

### Course Flow
- [ ] Fetch all courses
- [ ] View course details
- [ ] Enroll in course
- [ ] Enroll twice (expect error)
- [ ] View enrolled courses on dashboard

### Learning Flow
- [ ] Play lesson video
- [ ] Mark lesson as complete
- [ ] Progress updates correctly
- [ ] Last accessed lesson tracked
- [ ] Resume from last lesson works

### Error Handling
- [ ] Token expiry redirects to login
- [ ] Network errors show retry button
- [ ] Invalid routes show 404 page
- [ ] API errors display user-friendly messages

---

## 11. NEXT STEPS (PHASE 4)

After API contracts are validated and backend confirms availability:

1. **Setup Project:**
   - Initialize Vite + React project
   - Install dependencies (React Router, Axios, Tailwind)
   - Configure Tailwind CSS

2. **Implement Infrastructure:**
   - Create folder structure
   - Implement API service layer
   - Setup AuthContext
   - Create ProtectedRoute component

3. **Build Pages (One at a Time):**
   - Landing Page
   - Registration + OTP Verification
   - Login
   - Dashboard
   - Course Listing
   - Course Details
   - Course Player
   - Profile
   - Error Pages

4. **Testing & Validation:**
   - Test each flow end-to-end
   - Validate SRS requirements
   - Fix bugs

---

**END OF PHASE 3: API CONTRACT VALIDATION**

**AWAITING CONFIRMATION:**
- Backend team to review and confirm all API contracts
- Answer the 15 clarification questions in Section 8
- Provide backend API base URL for integration

Once confirmed, we proceed to PHASE 4: Implementation.
