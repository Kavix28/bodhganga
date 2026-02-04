# GANGABHODH LEARNING PLATFORM
## FRONTEND ARCHITECTURE DESIGN (PHASE 1)

---

## 1. FOLDER STRUCTURE

```
gangabhodh-frontend/
│
├── public/
│   ├── favicon.ico
│   └── logo.png
│
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   └── OTPVerification.jsx
│   │   │
│   │   ├── courses/
│   │   │   ├── CourseCard.jsx
│   │   │   ├── CourseGrid.jsx
│   │   │   ├── CourseDetails.jsx
│   │   │   ├── EnrollButton.jsx
│   │   │   └── ProgressBar.jsx
│   │   │
│   │   ├── lessons/
│   │   │   ├── LessonList.jsx
│   │   │   ├── LessonItem.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   └── MarkCompleteButton.jsx
│   │   │
│   │   └── profile/
│   │       ├── ProfileCard.jsx
│   │       └── EnrolledCoursesList.jsx
│   │
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Register.jsx
│   │   ├── VerifyOTP.jsx
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Courses.jsx
│   │   ├── CourseDetail.jsx
│   │   ├── CoursePlayer.jsx
│   │   ├── Profile.jsx
│   │   ├── NotFound.jsx
│   │   └── Error.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── courseService.js
│   │   ├── lessonService.js
│   │   └── userService.js
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── CourseContext.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCourses.js
│   │   └── useLocalStorage.js
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── storage.js
│   │   ├── formatters.js
│   │   └── constants.js
│   │
│   ├── styles/
│   │   └── index.css
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

**SRS Mapping:**
- Modular structure → NFR-8 (maintainability)
- Reusable components → NFR-7 (intuitive navigation)
- Service layer → NFR-9 (future mobile integration)

---

## 2. PAGE / ROUTE LIST

| Route | Component | Access Level | SRS Requirements |
|-------|-----------|--------------|------------------|
| `/` | Landing.jsx | Public | - |
| `/register` | Register.jsx | Public | FR-1 |
| `/verify-otp` | VerifyOTP.jsx | Public | FR-2, FR-3 |
| `/login` | Login.jsx | Public | FR-3, FR-4 |
| `/dashboard` | Dashboard.jsx | Protected | FR-10, FR-14 |
| `/courses` | Courses.jsx | Protected | FR-8 |
| `/courses/:id` | CourseDetail.jsx | Protected | FR-9, FR-11 |
| `/courses/:id/player` | CoursePlayer.jsx | Protected | FR-12, FR-13, FR-14 |
| `/profile` | Profile.jsx | Protected | FR-6, FR-7 |
| `/404` | NotFound.jsx | Public | - |
| `/error` | Error.jsx | Public | FR-16 |

**Route Protection Strategy:**
- Public routes: Accessible without authentication
- Protected routes: Require valid JWT token (FR-4)
- Redirect unauthenticated users to `/login`
- Redirect authenticated users away from `/login`, `/register`

**SRS Mapping:**
- Route structure → NFR-7 (intuitive navigation)
- Protected routes → NFR-4 (JWT validation)

---

## 3. COMPONENT HIERARCHY

### 3.1 Common Components

```
App.jsx
├── Navbar (on all pages)
│   ├── Logo
│   ├── Navigation Links (conditional based on auth)
│   └── User Avatar / Login Button
│
└── Footer (on all pages)
    ├── Copyright
    └── Links
```

### 3.2 Authentication Flow

```
Register.jsx
└── RegisterForm
    ├── Input (email/phone)
    ├── Input (password)
    ├── Button (Submit)
    └── Error Message Display

VerifyOTP.jsx
└── OTPVerification
    ├── Input (6-digit OTP)
    ├── Button (Verify)
    ├── Button (Resend OTP)
    └── Timer Display

Login.jsx
└── LoginForm
    ├── Input (email/phone)
    ├── Input (password)
    ├── Button (Submit)
    └── Error Message Display
```

### 3.3 Course Components

```
Courses.jsx
└── CourseGrid
    └── CourseCard (repeated)
        ├── Thumbnail
        ├── Title
        ├── Description
        ├── Duration
        └── View Details Button

CourseDetail.jsx
├── CourseDetails
│   ├── Title
│   ├── Description
│   ├── Duration
│   └── EnrollButton
└── LessonList
    └── LessonItem (repeated)
        ├── Lesson Title
        ├── Duration
        └── Status Icon

CoursePlayer.jsx
├── VideoPlayer
│   ├── Video Element
│   └── Controls
├── MarkCompleteButton
└── LessonList (sidebar)
```

### 3.4 Dashboard Components

```
Dashboard.jsx
├── Welcome Section
├── ProgressBar (overall)
└── EnrolledCoursesList
    └── CourseCard (repeated)
        ├── Thumbnail
        ├── Progress Bar
        └── Continue Learning Button
```

### 3.5 Profile Components

```
Profile.jsx
├── ProfileCard
│   ├── Avatar
│   ├── Name
│   ├── Email/Phone
│   └── Edit Button (future - FR-7)
└── EnrolledCoursesList
    └── CourseCard (repeated)
```

**SRS Mapping:**
- Reusable components → NFR-8 (modular architecture)
- Clear hierarchy → NFR-7 (intuitive navigation)

---

## 4. STATE MANAGEMENT APPROACH

### 4.1 Global State (React Context)

**AuthContext:**
- Current user data
- JWT token
- Authentication status
- Login/Logout functions

**CourseContext:**
- Enrolled courses
- Current course data
- Lesson progress

### 4.2 Local State (useState)

**Component-level state:**
- Form inputs
- Loading states
- Error messages
- Modal visibility
- Video playback state

### 4.3 Persistent State (localStorage)

**Stored data:**
- JWT token (secure)
- User preferences
- Last visited lesson (FR-13)

### 4.4 Server State

**Fetched from API:**
- Course catalog (FR-8)
- User profile (FR-6)
- Enrollment status (FR-10)
- Lesson completion (FR-12, FR-14)

**State Management Strategy:**
```
AuthContext (global)
  ↓
  Provides auth state to all components
  ↓
Protected Routes check auth
  ↓
Pages fetch data via services
  ↓
Local state manages UI
```

**SRS Mapping:**
- JWT storage → FR-4, NFR-4
- Progress tracking → FR-12, FR-13, FR-14
- Modularity → NFR-8

---

## 5. API INTEGRATION STRATEGY

### 5.1 API Service Layer Architecture

**Base Configuration (api.js):**
- Axios instance with base URL
- Request interceptor: Attach JWT to headers
- Response interceptor: Handle 401 (token expiry)
- Error handling middleware

**Service Modules:**

**authService.js:**
```
- register(email/phone, password) → FR-1
- verifyOTP(email/phone, otp) → FR-2
- resendOTP(email/phone) → FR-2
- login(email/phone, password) → FR-3, FR-4
- logout()
```

**courseService.js:**
```
- getAllCourses() → FR-8
- getCourseById(id) → FR-11
- enrollCourse(courseId) → FR-9
- getEnrolledCourses() → FR-10
```

**lessonService.js:**
```
- markLessonComplete(lessonId) → FR-12
- updateLastAccessed(lessonId) → FR-13
- getProgress(courseId) → FR-14
```

**userService.js:**
```
- getProfile() → FR-6
- updateProfile(data) → FR-7 (future)
```

### 5.2 Expected Backend API Endpoints

| Method | Endpoint | Purpose | SRS Req |
|--------|----------|---------|---------|
| POST | `/api/auth/register` | Register user | FR-1 |
| POST | `/api/auth/verify-otp` | Verify OTP | FR-2 |
| POST | `/api/auth/resend-otp` | Resend OTP | FR-2 |
| POST | `/api/auth/login` | Login user | FR-3, FR-4 |
| GET | `/api/users/profile` | Get user profile | FR-6 |
| PUT | `/api/users/profile` | Update profile | FR-7 |
| GET | `/api/courses` | Get all courses | FR-8 |
| GET | `/api/courses/:id` | Get course details | FR-11 |
| POST | `/api/enrollments` | Enroll in course | FR-9 |
| GET | `/api/enrollments/my-courses` | Get enrolled courses | FR-10 |
| POST | `/api/progress/complete` | Mark lesson complete | FR-12 |
| PUT | `/api/progress/last-accessed` | Update last accessed | FR-13 |
| GET | `/api/progress/:courseId` | Get course progress | FR-14 |

### 5.3 Request/Response Handling

**Authentication Headers:**
```javascript
Authorization: Bearer <JWT_TOKEN>
```

**Error Response Format (Expected):**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Technical error details"
}
```

**Success Response Format (Expected):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**SRS Mapping:**
- Service layer → NFR-9 (API support for mobile)
- JWT headers → NFR-4 (JWT validation)
- Error handling → FR-16

---

## 6. AUTHENTICATION & JWT HANDLING FLOW

### 6.1 Registration Flow

```
User fills Register Form
  ↓
Frontend validates input
  ↓
POST /api/auth/register
  ↓
Backend sends OTP (FR-2, FR-15)
  ↓
Redirect to /verify-otp
  ↓
User enters OTP
  ↓
POST /api/auth/verify-otp
  ↓
Success → Redirect to /login
  ↓
OTP expires in 10 minutes (constraint)
```

### 6.2 Login Flow

```
User fills Login Form
  ↓
Frontend validates input
  ↓
POST /api/auth/login
  ↓
Backend validates credentials (FR-5 - bcrypt)
  ↓
Returns JWT token (FR-4)
  ↓
Store JWT in localStorage (secure)
  ↓
Set AuthContext state
  ↓
Redirect to /dashboard
```

### 6.3 JWT Storage & Security

**Storage Strategy:**
- Store JWT in `localStorage` (key: `auth_token`)
- Alternative: `httpOnly` cookie (if backend supports)

**Security Measures:**
- Never expose JWT in URL
- Clear token on logout
- Validate token expiry on each protected route
- Refresh token strategy (if backend supports)

**Token Validation:**
```
User navigates to protected route
  ↓
ProtectedRoute component checks JWT
  ↓
If valid → Render page
  ↓
If invalid/expired → Redirect to /login
```

### 6.4 Auto-Logout on Token Expiry

**Response Interceptor:**
```
API returns 401 Unauthorized
  ↓
Clear localStorage
  ↓
Clear AuthContext
  ↓
Redirect to /login with error message
```

**SRS Mapping:**
- Password hashing → FR-5 (backend responsibility)
- JWT generation → FR-4
- Token validation → NFR-4
- Login after verification → FR-3

---

## 7. ERROR HANDLING STRATEGY

### 7.1 Error Categories

**Network Errors:**
- No internet connection
- API server down
- Timeout

**Validation Errors:**
- Invalid email/phone format
- Weak password
- Empty fields

**Authentication Errors:**
- Wrong credentials (FR-16)
- Expired OTP (FR-16)
- Expired JWT token

**Business Logic Errors:**
- User already enrolled
- Course not found
- Lesson already completed

### 7.2 Error Handling Layers

**Layer 1: Input Validation (Frontend)**
```
Form validation before API call
  ↓
Display inline error messages
  ↓
Prevent submission if invalid
```

**Layer 2: API Service Layer**
```
try {
  API call
} catch (error) {
  Parse error response
  ↓
  Return user-friendly message
}
```

**Layer 3: Component Error Boundaries**
```
ErrorBoundary wraps entire app
  ↓
Catches React rendering errors
  ↓
Shows fallback UI
  ↓
Logs error for debugging
```

### 7.3 Error Display Patterns

**Toast Notifications:**
- Success messages (enrollment, completion)
- Error messages (failed API calls)

**Inline Errors:**
- Form validation errors
- OTP verification errors

**Full-page Errors:**
- 404 Not Found
- 500 Server Error
- Network Offline

**SRS Mapping:**
- Error messages → FR-16
- User experience → NFR-7 (intuitive)

---

## 8. RESPONSIVE DESIGN APPROACH

### 8.1 Breakpoint Strategy

**Tailwind CSS Breakpoints:**
```
sm:  640px  → Mobile landscape
md:  768px  → Tablet
lg:  1024px → Desktop
xl:  1280px → Large desktop
2xl: 1536px → Extra large
```

**Design Philosophy:**
- Mobile-first (NFR-6)
- Progressive enhancement
- Touch-friendly targets (44px minimum)

### 8.2 Responsive Patterns by Component

**Navbar:**
- Mobile: Hamburger menu
- Desktop: Horizontal navigation

**Course Grid:**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

**Course Player:**
- Mobile: Video on top, lessons below
- Desktop: Video left, lessons sidebar right

**Dashboard:**
- Mobile: Stacked cards
- Desktop: Grid layout

**Forms:**
- Full-width on mobile
- Centered with max-width on desktop

### 8.3 Tailwind Configuration

**Custom Theme:**
- Brand colors
- Typography scale
- Spacing scale
- Border radius
- Shadows

**Utility-First Approach:**
- Use Tailwind classes directly
- Avoid custom CSS unless necessary
- Leverage responsive modifiers (md:, lg:)

### 8.4 Touch & Interaction

**Mobile Optimizations:**
- Large tap targets (minimum 44x44px)
- Swipe gestures for lesson navigation
- Pull-to-refresh on course list
- Sticky video player controls

**Accessibility:**
- ARIA labels
- Keyboard navigation
- Focus indicators
- Screen reader support

**SRS Mapping:**
- Mobile-first → NFR-6
- Responsive UI → NFR-6
- Future mobile readiness → NFR-9
- Intuitive navigation → NFR-7

---

## 9. ADDITIONAL ARCHITECTURAL DECISIONS

### 9.1 Video Playback Strategy

**Video Player:**
- Use HTML5 `<video>` element
- Custom controls (play, pause, seek, volume)
- Track playback progress
- Auto-save last watched position (FR-13)

**Completion Logic:**
- Mark complete when 90%+ watched
- Or manual "Mark Complete" button
- Send completion to backend (FR-12)

### 9.2 Performance Optimization

**Code Splitting:**
- Lazy load pages with React.lazy()
- Reduce initial bundle size

**Image Optimization:**
- Lazy load course thumbnails
- Use WebP format with fallback

**Caching:**
- Cache course list
- Cache user profile
- Update on demand (pull-to-refresh)

**SRS Mapping:**
- Performance → NFR-1 (< 2 sec response)
- Scalability → NFR-2 (10k users)

### 9.3 Loading States

**Skeleton Screens:**
- Course grid loading
- Profile loading
- Lesson list loading

**Spinners:**
- Button loading states
- API call in progress

**Progressive Rendering:**
- Show data as it arrives
- Don't block entire UI

### 9.4 SEO & Meta Tags

**Per-Page Meta:**
- Title: "Page Name | Gangabhodh"
- Description
- OG tags (future)

**React Helmet:**
- Dynamic meta tag updates
- Better indexing (future)

---

## 10. SRS REQUIREMENTS MAPPING SUMMARY

### Functional Requirements Coverage

| FR ID | Requirement | Frontend Implementation |
|-------|-------------|------------------------|
| FR-1 | User registration | Register.jsx form → POST /api/auth/register |
| FR-2 | OTP verification | VerifyOTP.jsx → POST /api/auth/verify-otp |
| FR-3 | Login after verification | Login.jsx → POST /api/auth/login |
| FR-4 | JWT token generation | authService handles token storage |
| FR-5 | Password hashing | Backend responsibility (no frontend action) |
| FR-6 | View profile | Profile.jsx → GET /api/users/profile |
| FR-7 | Update profile | Profile.jsx (future) → PUT /api/users/profile |
| FR-8 | Display courses | Courses.jsx → GET /api/courses |
| FR-9 | Enroll in course | CourseDetail.jsx → POST /api/enrollments |
| FR-10 | Track enrolled courses | Dashboard.jsx → GET /api/enrollments/my-courses |
| FR-11 | Course details | CourseDetail.jsx → GET /api/courses/:id |
| FR-12 | Mark lesson complete | CoursePlayer.jsx → POST /api/progress/complete |
| FR-13 | Last accessed tracking | CoursePlayer.jsx → PUT /api/progress/last-accessed |
| FR-14 | Show progress | Dashboard.jsx → GET /api/progress/:courseId |
| FR-15 | Email OTP | Backend responsibility (triggered by FR-1, FR-2) |
| FR-16 | Error messages | Global error handling + UI feedback |

### Non-Functional Requirements Coverage

| NFR ID | Requirement | Frontend Implementation |
|--------|-------------|------------------------|
| NFR-1 | Response < 2 sec | Loading states, optimistic UI, caching |
| NFR-2 | Scale to 10k users | Backend concern; frontend optimized for performance |
| NFR-3 | Password encryption | Backend responsibility |
| NFR-4 | JWT validation | ProtectedRoute, API interceptors |
| NFR-5 | CORS policy | Backend responsibility |
| NFR-6 | Responsive UI | Mobile-first Tailwind design |
| NFR-7 | Intuitive navigation | Clear routing, consistent UI patterns |
| NFR-8 | Modular code | Component-based architecture, service layer |
| NFR-9 | Future mobile support | REST API integration, reusable service layer |

---

## 11. DEPENDENCY LIST

**Core Dependencies:**
- `react` (18+)
- `react-dom`
- `react-router-dom` (for routing)
- `axios` (for API calls)

**Dev Dependencies:**
- `vite` (build tool)
- `tailwindcss`
- `postcss`
- `autoprefixer`
- `eslint`

**Optional:**
- `react-hot-toast` (toast notifications)
- `react-icons` (icon library)
- `framer-motion` (animations)

---

## 12. OPEN QUESTIONS FOR BACKEND TEAM

Before proceeding to implementation, these API details must be confirmed:

1. **Authentication:**
   - Does `/api/auth/login` return JWT in response body or httpOnly cookie?
   - What is the JWT expiry time?
   - Is there a refresh token mechanism?

2. **OTP:**
   - What is the exact endpoint for resending OTP?
   - Does OTP verification return JWT or require subsequent login?

3. **Course Data:**
   - What is the structure of course object (title, description, lessons array)?
   - What is the structure of lesson object (title, videoUrl, duration)?

4. **Progress Tracking:**
   - What payload does mark complete expect (lessonId, courseId, timestamp)?
   - How is progress percentage calculated (backend or frontend)?

5. **Error Responses:**
   - What is the standard error response format?
   - What HTTP status codes are used for different errors?

6. **Enrollment:**
   - Is there a separate enrollment endpoint or auto-enroll on first lesson start?
   - Can users unenroll?

---

## 13. NEXT STEPS (PHASE 2)

After approval of this architecture:

1. **Page-by-page UI design** (PHASE 2)
2. **API contract validation** (PHASE 3)
3. **Controlled implementation** (PHASE 4)
4. **Frontend validation** (PHASE 5)

---

**END OF PHASE 1 ARCHITECTURE DESIGN**
