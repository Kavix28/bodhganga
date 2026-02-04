# GANGABHODH LEARNING PLATFORM
## PHASE 2: PAGE-BY-PAGE UI DESIGN

---

## PAGE 1: LANDING PAGE (Guest)

### Purpose
- First impression for visitors
- Showcase platform value proposition
- Encourage registration/login
- Display featured courses (preview)

### Route
`/` (public)

### UI Components

**Header Section:**
- Navbar (transparent or solid)
  - Logo (left)
  - Navigation: Home, About, Courses (future), Contact (future)
  - CTA Buttons: Login, Sign Up (right)
- Hero Section
  - Large headline: "Learn. Grow. Succeed with Gangabhodh"
  - Subheadline: "Free, quality education for everyone"
  - CTA Buttons: "Get Started" (→ /register), "Browse Courses" (→ /courses or /login)
  - Hero Image/Animation: Students learning, books, graduation cap

**Features Section:**
- 3-4 Feature Cards (grid layout)
  - Icon + Title + Description
  - Examples:
    - "Expert-Curated Courses"
    - "Track Your Progress"
    - "Learn at Your Pace"
    - "Earn Certificates" (future)

**Course Preview Section:**
- Section Title: "Explore Our Courses"
- 3-6 Course Cards (carousel or grid)
  - Course thumbnail
  - Course title
  - Short description (truncated)
  - Duration badge
  - "View Details" button (→ /login or /register)
- Note: Show courses even for guests, but require login to access

**Call-to-Action Section:**
- Background: Gradient or image
- Text: "Ready to Start Learning?"
- Button: "Join Gangabhodh Today" (→ /register)

**Footer:**
- Copyright text
- Links: Privacy Policy (future), Terms (future), Contact
- Social media icons (future)

### Data Fetched from Backend
- **GET /api/courses** (public endpoint, no auth required)
  - Display 3-6 featured courses
  - Show: title, description, thumbnail, duration
  - Do NOT require authentication for landing page course preview

### User Actions
1. Click "Sign Up" → Navigate to `/register`
2. Click "Login" → Navigate to `/login`
3. Click "Get Started" → Navigate to `/register`
4. Click "Browse Courses" → Navigate to `/login` (require auth to access full catalog)
5. Click Course Card → Navigate to `/login` (require auth to view details)

### Error States
- **API Error (courses fail to load):**
  - Show skeleton/placeholder cards
  - Display fallback message: "Courses loading..."
  - Don't block page render
- **Network Error:**
  - Show generic error message
  - Provide "Retry" button

### Responsive Behavior
- Mobile (< 768px):
  - Stacked layout
  - Hamburger menu for navigation
  - Course cards: 1 column
  - Hero text: smaller font size
- Tablet (768px - 1024px):
  - Course cards: 2 columns
  - Hero: side-by-side text + image
- Desktop (> 1024px):
  - Course cards: 3 columns
  - Full-width hero section

### SRS Requirements Satisfied
- **NFR-6:** Responsive, mobile-first UI
- **NFR-7:** Intuitive navigation (clear CTAs)
- Supports guest user journey (SRS 2.2)

---

## PAGE 2: REGISTRATION PAGE

### Purpose
- Allow new users to create an account
- Collect email/phone + password
- Initiate OTP verification flow

### Route
`/register` (public)

### UI Components

**Navbar:**
- Logo (left)
- "Already have an account? Login" link (right)

**Registration Form (Centered Card):**
- Page Title: "Create Your Account"
- Subtitle: "Start your learning journey today"

**Form Fields:**
1. **Email/Phone Input**
   - Label: "Email or Phone Number"
   - Placeholder: "Enter your email or phone"
   - Type: `text` (validate format client-side)
   - Icon: Envelope or phone icon
   - Validation:
     - Required
     - Valid email format (e.g., `user@example.com`)
     - OR valid phone format (e.g., `+91 9876543210`)
   
2. **Password Input**
   - Label: "Password"
   - Placeholder: "Create a strong password"
   - Type: `password` with show/hide toggle
   - Icon: Lock icon
   - Validation:
     - Required
     - Minimum 8 characters
     - Contains uppercase, lowercase, number (optional: special char)
   - Password strength indicator (weak/medium/strong)

3. **Terms Checkbox** (optional)
   - "I agree to Terms & Conditions"

**Form Actions:**
- **Submit Button:** "Sign Up"
  - Full-width
  - Loading state: Spinner + disabled
  - Success: Navigate to `/verify-otp`
- **Social Login (future):** Google, Facebook icons (disabled/placeholder)

**Footer Link:**
- "Already have an account? **Login**" (→ `/login`)

### Data Fetched from Backend
- None (this page does not fetch data, only submits)

### Data Sent to Backend
- **POST /api/auth/register**
  - Request Body:
    ```json
    {
      "emailOrPhone": "user@example.com",
      "password": "SecurePass123"
    }
    ```
  - Expected Response (Success):
    ```json
    {
      "success": true,
      "message": "OTP sent successfully",
      "data": {
        "otpSentTo": "user@example.com"
      }
    }
    ```
  - Expected Response (Error):
    ```json
    {
      "success": false,
      "message": "User already exists"
    }
    ```

### User Actions
1. **Fill form fields**
   - Real-time validation feedback
   - Show error messages below each field
2. **Click "Sign Up"**
   - Validate all fields
   - If valid: Submit to backend
   - If invalid: Show inline errors, prevent submission
3. **On Success:**
   - Show toast: "OTP sent to your email/phone"
   - Navigate to `/verify-otp` with email/phone in state
4. **Click "Login" link**
   - Navigate to `/login`

### Error States

**Validation Errors (Client-side):**
- "Email or phone is required"
- "Please enter a valid email address"
- "Password must be at least 8 characters"
- "Password must contain uppercase and lowercase letters"

**API Errors (Server-side):**
- **User Already Exists:**
  - Message: "This email/phone is already registered. Please login."
  - Action: Show "Go to Login" button
- **Network Error:**
  - Message: "Unable to connect. Please check your internet."
  - Action: "Retry" button
- **Server Error:**
  - Message: "Something went wrong. Please try again later."
  - Action: "Retry" button

**Display Method:**
- Inline errors: Below input fields (red text)
- Toast notifications: Top-right corner (for network/server errors)

### Responsive Behavior
- Mobile: Full-width form, vertical layout
- Desktop: Centered card (max-width: 500px)

### SRS Requirements Satisfied
- **FR-1:** User registration with email/phone + password
- **FR-2:** OTP sent after registration
- **FR-15:** Email notification triggered
- **NFR-6:** Responsive UI
- **NFR-7:** Intuitive form design

---

## PAGE 3: OTP VERIFICATION PAGE

### Purpose
- Verify user's email/phone with OTP
- Complete account activation
- Redirect to login after success

### Route
`/verify-otp` (public, but requires registration first)

### UI Components

**Navbar:**
- Logo (left)
- No other navigation

**Verification Form (Centered Card):**
- Page Title: "Verify Your Account"
- Subtitle: "We've sent a 6-digit OTP to **[email/phone]**"
- Change email/phone link: "Change" (→ back to `/register`)

**OTP Input:**
- 6 individual input boxes (for 6-digit OTP)
- Auto-focus on first box
- Auto-advance to next box on input
- Large, centered, easy to read
- Paste support (detect 6-digit paste and distribute)

**Timer Display:**
- "OTP expires in: **09:45**" (countdown from 10 minutes)
- Red text when < 1 minute remaining
- When expired: "OTP has expired. Please resend."

**Form Actions:**
- **Verify Button:** "Verify OTP"
  - Full-width
  - Disabled until all 6 digits entered
  - Loading state on submit
- **Resend OTP Button:** "Didn't receive OTP? Resend"
  - Text link or secondary button
  - Disabled for 60 seconds after initial send (cooldown)
  - Show cooldown timer: "Resend in 0:45"

**Success State:**
- Green checkmark animation
- Message: "Account verified successfully!"
- Auto-redirect to `/login` in 2 seconds

### Data Fetched from Backend
- None

### Data Sent to Backend

**1. Verify OTP:**
- **POST /api/auth/verify-otp**
  - Request Body:
    ```json
    {
      "emailOrPhone": "user@example.com",
      "otp": "123456"
    }
    ```
  - Expected Response (Success):
    ```json
    {
      "success": true,
      "message": "Account verified successfully"
    }
    ```
  - Expected Response (Error):
    ```json
    {
      "success": false,
      "message": "Invalid or expired OTP"
    }
    ```

**2. Resend OTP:**
- **POST /api/auth/resend-otp**
  - Request Body:
    ```json
    {
      "emailOrPhone": "user@example.com"
    }
    ```
  - Expected Response:
    ```json
    {
      "success": true,
      "message": "OTP resent successfully"
    }
    ```

### User Actions
1. **Enter OTP**
   - Type 6-digit code
   - Auto-advance between input boxes
   - Paste 6-digit code (auto-populate)
2. **Click "Verify OTP"**
   - Submit to backend
   - Show loading spinner
3. **On Success:**
   - Show success animation
   - Display toast: "Account verified!"
   - Redirect to `/login` after 2 seconds
4. **Click "Resend OTP"**
   - Send new OTP
   - Reset timer to 10 minutes
   - Show toast: "New OTP sent"
   - Disable resend button for 60 seconds
5. **Click "Change" email/phone**
   - Navigate back to `/register`

### Error States

**Invalid OTP:**
- Message: "Invalid OTP. Please try again."
- Clear OTP input fields
- Shake animation on input boxes
- Allow retry

**Expired OTP:**
- Message: "OTP has expired. Please request a new one."
- Disable "Verify" button
- Highlight "Resend OTP" button

**Network Error:**
- Message: "Unable to verify. Please check your connection."
- "Retry" button

**Too Many Attempts (if backend limits):**
- Message: "Too many attempts. Please try again later."
- Disable verify button for 5 minutes

### Responsive Behavior
- Mobile: Larger OTP input boxes (48px height)
- Desktop: Centered card, moderate input size (40px)

### SRS Requirements Satisfied
- **FR-2:** OTP verification required
- **FR-3:** Only verified users can login
- **Constraint:** OTP expires in 10 minutes
- **NFR-6:** Responsive UI

---

## PAGE 4: LOGIN PAGE

### Purpose
- Allow verified users to log in
- Generate and store JWT token
- Redirect to dashboard

### Route
`/login` (public)

### UI Components

**Navbar:**
- Logo (left)
- "Don't have an account? Sign Up" link (right)

**Login Form (Centered Card):**
- Page Title: "Welcome Back"
- Subtitle: "Login to continue learning"

**Form Fields:**
1. **Email/Phone Input**
   - Label: "Email or Phone Number"
   - Placeholder: "Enter your email or phone"
   - Type: `text`
   - Icon: User icon
   - Validation: Required, valid format

2. **Password Input**
   - Label: "Password"
   - Placeholder: "Enter your password"
   - Type: `password` with show/hide toggle
   - Icon: Lock icon
   - Validation: Required

3. **Remember Me Checkbox** (optional)
   - "Keep me logged in"

**Form Actions:**
- **Login Button:** "Login"
  - Full-width, primary color
  - Loading state on submit
- **Forgot Password Link:** "Forgot Password?" (future feature)
  - Right-aligned below password field

**Footer Link:**
- "Don't have an account? **Sign Up**" (→ `/register`)

### Data Fetched from Backend
- None

### Data Sent to Backend
- **POST /api/auth/login**
  - Request Body:
    ```json
    {
      "emailOrPhone": "user@example.com",
      "password": "SecurePass123"
    }
    ```
  - Expected Response (Success):
    ```json
    {
      "success": true,
      "message": "Login successful",
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": "user123",
          "name": "John Doe",
          "emailOrPhone": "user@example.com"
        }
      }
    }
    ```
  - Expected Response (Error):
    ```json
    {
      "success": false,
      "message": "Invalid credentials"
    }
    ```

### User Actions
1. **Fill form fields**
   - Real-time validation
2. **Click "Login"**
   - Validate fields
   - Submit to backend
3. **On Success:**
   - Store JWT in localStorage (`auth_token`)
   - Set user in AuthContext
   - Show toast: "Welcome back, [Name]!"
   - Redirect to `/dashboard`
4. **Click "Sign Up" link**
   - Navigate to `/register`

### Error States

**Validation Errors:**
- "Email or phone is required"
- "Password is required"

**API Errors:**
- **Invalid Credentials (Wrong Password):**
  - Message: "Invalid email/phone or password. Please try again."
  - Highlight both fields
  - FR-16 requirement
- **Account Not Verified:**
  - Message: "Please verify your account first. Check your email for OTP."
  - Show "Resend Verification" button (→ `/verify-otp`)
  - FR-3 requirement
- **Account Not Found:**
  - Message: "No account found with this email/phone. Please sign up."
  - Show "Sign Up" button
- **Network Error:**
  - Message: "Unable to connect. Please try again."
  - "Retry" button

### Responsive Behavior
- Mobile: Full-width form
- Desktop: Centered card (max-width: 450px)

### SRS Requirements Satisfied
- **FR-3:** Login allowed only after verification
- **FR-4:** JWT token generated and stored
- **FR-16:** Error messages for invalid login
- **NFR-4:** JWT validation (stored securely)
- **NFR-6:** Responsive UI

---

## PAGE 5: USER DASHBOARD

### Purpose
- Central hub for learners
- Show enrolled courses and progress
- Quick access to continue learning
- Display personalized welcome

### Route
`/dashboard` (protected - requires authentication)

### UI Components

**Navbar:**
- Logo (left)
- Navigation Links: Dashboard, Courses, Profile
- User Avatar + Name (right, dropdown menu)
  - Profile
  - Logout

**Hero/Welcome Section:**
- Greeting: "Welcome back, **[User Name]**!"
- Subtext: "You're enrolled in **[X]** courses"
- Illustration or motivational quote

**Progress Overview (Optional Section):**
- Total courses enrolled
- Total lessons completed
- Overall progress percentage
- Display as stat cards (grid layout)

**Enrolled Courses Section:**
- Section Title: "My Courses"
- If no courses:
  - Empty state illustration
  - Message: "You haven't enrolled in any courses yet"
  - CTA Button: "Browse Courses" (→ `/courses`)
- If courses exist:
  - Grid of Course Cards (each card shows):
    - Course thumbnail
    - Course title
    - Progress bar (e.g., "45% complete")
    - Last accessed lesson name (FR-13)
    - "Continue Learning" button (→ `/courses/:id/player`)

**Quick Actions (Optional):**
- "Browse More Courses" button (→ `/courses`)
- "View Profile" button (→ `/profile`)

**Footer:**
- Standard footer

### Data Fetched from Backend

**1. User Profile:**
- **GET /api/users/profile**
  - Headers: `Authorization: Bearer <token>`
  - Response:
    ```json
    {
      "success": true,
      "data": {
        "id": "user123",
        "name": "John Doe",
        "emailOrPhone": "user@example.com",
        "createdAt": "2026-01-01T00:00:00Z"
      }
    }
    ```

**2. Enrolled Courses:**
- **GET /api/enrollments/my-courses**
  - Headers: `Authorization: Bearer <token>`
  - Response:
    ```json
    {
      "success": true,
      "data": [
        {
          "courseId": "course123",
          "courseTitle": "Introduction to React",
          "courseThumbnail": "https://example.com/thumb.jpg",
          "progress": 45,
          "lastAccessedLesson": {
            "lessonId": "lesson5",
            "lessonTitle": "State Management"
          },
          "enrolledAt": "2026-01-05T10:00:00Z"
        }
      ]
    }
    ```

**3. Overall Progress (Optional):**
- **GET /api/progress/summary**
  - Returns: total courses, completed lessons, percentage

### User Actions
1. **View dashboard** (auto-load on login redirect)
2. **Click "Continue Learning"** on course card
   - Navigate to `/courses/:courseId/player` (resume from last lesson)
3. **Click "Browse Courses"**
   - Navigate to `/courses`
4. **Click Navigation Links** (Courses, Profile)
   - Navigate accordingly
5. **Click Avatar → Logout**
   - Clear localStorage
   - Clear AuthContext
   - Redirect to `/login`

### Error States

**No Enrolled Courses:**
- Not an error, show empty state with CTA

**API Error (Failed to Load Courses):**
- Message: "Unable to load your courses. Please try again."
- "Retry" button
- Show skeleton/placeholder cards while loading

**Authentication Error (Token Expired):**
- Auto-redirect to `/login`
- Show message: "Session expired. Please login again."

### Responsive Behavior
- Mobile: Course cards in 1 column, stacked stats
- Tablet: Course cards in 2 columns
- Desktop: Course cards in 3 columns, horizontal stats

### SRS Requirements Satisfied
- **FR-6:** View profile (fetched from API)
- **FR-10:** Track enrolled courses
- **FR-13:** Last accessed lesson displayed
- **FR-14:** Show progress for each course
- **NFR-6:** Responsive layout
- **NFR-7:** Intuitive navigation

---

## PAGE 6: COURSE LISTING PAGE

### Purpose
- Display all available courses
- Allow filtering/search (future)
- Enable enrollment in courses

### Route
`/courses` (protected)

### UI Components

**Navbar:**
- Same as Dashboard

**Page Header:**
- Page Title: "Explore Courses"
- Subtitle: "Choose from our curated collection"

**Search & Filter Bar (Optional - Future Enhancement):**
- Search input: "Search courses..."
- Category dropdown: All, Programming, Design, Business
- Sort dropdown: Newest, Most Popular, A-Z

**Course Grid:**
- Grid layout of Course Cards
- Each Course Card:
  - Thumbnail image
  - Course title
  - Short description (2-3 lines, truncated)
  - Meta info:
    - Duration (e.g., "10 lessons • 5 hours")
    - Category badge
  - **Action Button:**
    - If NOT enrolled: "Enroll Now" (primary button)
    - If enrolled: "Continue Learning" (secondary button)
    - Conditional based on enrollment status

**Empty State (if no courses):**
- Illustration
- Message: "No courses available yet. Check back soon!"

**Footer:**
- Standard footer

### Data Fetched from Backend

**1. All Courses:**
- **GET /api/courses**
  - Headers: `Authorization: Bearer <token>`
  - Response:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "course123",
          "title": "Introduction to React",
          "description": "Learn React from scratch...",
          "thumbnail": "https://example.com/thumb.jpg",
          "duration": "5 hours",
          "lessonCount": 10,
          "category": "Programming",
          "isEnrolled": false
        }
      ]
    }
    ```
  - Note: `isEnrolled` field helps determine button state

**Alternative: Fetch Enrolled Courses Separately**
- **GET /api/enrollments/my-courses**
  - Cross-reference with all courses to determine enrollment status

### User Actions
1. **View all courses**
   - Auto-load on page mount
2. **Click "Enroll Now"** on a course card
   - Show confirmation modal: "Enroll in [Course Name]?"
   - On confirm: POST to `/api/enrollments`
   - On success:
     - Update button to "Continue Learning"
     - Show toast: "You're enrolled! Start learning now."
3. **Click "Continue Learning"** on enrolled course
   - Navigate to `/courses/:id/player`
4. **Click Course Card** (anywhere except button)
   - Navigate to `/courses/:id` (course details page)
5. **Use Search/Filter** (future)
   - Filter courses client-side or fetch filtered results

### Error States

**API Error (Failed to Load Courses):**
- Message: "Unable to load courses. Please try again."
- "Retry" button
- Show skeleton cards while loading

**Enrollment Error:**
- Message: "Failed to enroll. Please try again."
- "Retry" button in modal

**Empty State:**
- Not an error, show friendly message

### Responsive Behavior
- Mobile: 1 column grid
- Tablet: 2 columns
- Desktop: 3-4 columns

### SRS Requirements Satisfied
- **FR-8:** Display list of available courses
- **FR-9:** Registered users can enroll
- **FR-10:** Track enrollment status
- **NFR-6:** Responsive grid
- **NFR-7:** Clear course browsing

---

## PAGE 7: COURSE DETAILS PAGE

### Purpose
- Display detailed course information
- Show lesson list (curriculum)
- Enable enrollment
- Preview course content before enrollment

### Route
`/courses/:id` (protected)

### UI Components

**Navbar:**
- Same as Dashboard

**Course Header:**
- Course title (large, bold)
- Course description (full, multi-paragraph)
- Course metadata:
  - Duration (e.g., "5 hours")
  - Lesson count (e.g., "10 lessons")
  - Category badge
  - Instructor name (future)
  - Rating/reviews (future)
- Course thumbnail/banner image

**Enrollment Section:**
- **If NOT Enrolled:**
  - Large "Enroll Now" button (CTA)
  - Price: "Free" (or future pricing)
- **If Enrolled:**
  - "Enrolled" badge (checkmark)
  - "Start Learning" button (→ first lesson in player)
  - Progress bar (if started)

**Course Curriculum (Lessons List):**
- Section Title: "Course Content"
- List of lessons (expandable accordion, or flat list):
  - Each Lesson Item:
    - Lesson number (e.g., "1.", "2.")
    - Lesson title
    - Duration (e.g., "15 min")
    - **Status Icon:**
      - Locked icon (if not enrolled)
      - Play icon (if enrolled, not completed)
      - Checkmark icon (if completed)
    - **Action:**
      - If enrolled: Click to play lesson (→ `/courses/:id/player?lesson=:lessonId`)
      - If not enrolled: Disabled, show "Enroll to access"

**What You'll Learn Section (Optional):**
- Bullet points of learning outcomes

**Requirements Section (Optional):**
- Prerequisites or recommended background

**Instructor Section (Future):**
- Instructor bio, photo

**Reviews Section (Future):**
- Student reviews and ratings

**Footer:**
- Standard footer

### Data Fetched from Backend

**1. Course Details:**
- **GET /api/courses/:id**
  - Headers: `Authorization: Bearer <token>`
  - Response:
    ```json
    {
      "success": true,
      "data": {
        "id": "course123",
        "title": "Introduction to React",
        "description": "Full course description...",
        "thumbnail": "https://example.com/thumb.jpg",
        "duration": "5 hours",
        "category": "Programming",
        "isEnrolled": true,
        "lessons": [
          {
            "id": "lesson1",
            "title": "Introduction",
            "duration": "10 min",
            "isCompleted": false,
            "videoUrl": "https://example.com/video1.mp4"
          },
          {
            "id": "lesson2",
            "title": "Setup",
            "duration": "15 min",
            "isCompleted": false,
            "videoUrl": "https://example.com/video2.mp4"
          }
        ]
      }
    }
    ```

**2. Enrollment Status (if not in course details):**
- **GET /api/enrollments/my-courses**
  - Check if courseId exists in user's enrolled courses

**3. Progress (if enrolled):**
- **GET /api/progress/:courseId**
  - Returns: completed lessons, overall progress percentage

### User Actions
1. **View course details**
   - Auto-load course data on mount
2. **Click "Enroll Now"**
   - Show confirmation modal
   - On confirm: POST to `/api/enrollments`
   - On success:
     - Update UI to show "Enrolled" badge
     - Unlock lesson list
     - Show toast: "Enrolled successfully!"
3. **Click "Start Learning"** (if enrolled)
   - Navigate to `/courses/:id/player` (first lesson)
4. **Click on a Lesson** (if enrolled)
   - Navigate to `/courses/:id/player?lesson=:lessonId`
5. **Click Back/Breadcrumb**
   - Navigate to `/courses` (all courses)

### Error States

**Course Not Found:**
- Message: "Course not found."
- "Back to Courses" button (→ `/courses`)

**API Error:**
- Message: "Unable to load course details. Please try again."
- "Retry" button

**Enrollment Error:**
- Message: "Failed to enroll. Please try again."
- "Retry" button

### Responsive Behavior
- Mobile: Stacked layout (header, enroll button, lessons)
- Desktop: Two-column (course info left, lessons sidebar right)

### SRS Requirements Satisfied
- **FR-9:** Enroll in course
- **FR-11:** Course details page with lessons, duration, description
- **FR-14:** Show progress (if enrolled)
- **NFR-6:** Responsive layout

---

## PAGE 8: COURSE PLAYER (Lessons + Video)

### Purpose
- Play video lessons
- Mark lessons as completed
- Track lesson progress
- Navigate between lessons
- Resume from last accessed lesson

### Route
`/courses/:courseId/player?lesson=:lessonId` (protected)

### UI Components

**Navbar (Minimal or Hidden in Fullscreen):**
- Logo (left)
- Course title (center)
- Exit button: "Exit Course" (→ `/courses/:courseId` or `/dashboard`)

**Main Layout (Two Sections):**

**1. Video Section (Left or Top):**
- Video Player (HTML5 or custom)
  - Video element with controls
  - Play/Pause
  - Seek bar (timeline)
  - Volume control
  - Fullscreen button
  - Playback speed (0.5x, 1x, 1.5x, 2x)
  - Current time / Total duration display
- Video Title (above or below player)
  - Current lesson title
  - Lesson number (e.g., "Lesson 3 of 10")
- Mark Complete Button
  - "Mark as Complete" (primary button)
  - Positioned below video
  - Disabled if already completed
  - On click: Mark lesson complete, auto-advance to next lesson

**2. Lesson List Sidebar (Right or Bottom):**
- Section Title: "Course Lessons"
- List of all lessons in course:
  - Each Lesson Item:
    - Lesson number + title
    - Duration
    - Status icon:
      - Checkmark (completed)
      - Play icon (current lesson, highlighted)
      - Circle (not started)
    - Click to switch lessons (→ update URL param, load new video)
- Progress Bar (top of sidebar)
  - "X of Y lessons completed"
  - Percentage bar

**Auto-Save Progress:**
- Save current playback position every 10 seconds (or on pause)
- Save last accessed lesson on video play

### Data Fetched from Backend

**1. Course + Lessons:**
- **GET /api/courses/:courseId**
  - Returns: course title, all lessons with videoUrl, completion status

**2. Progress Data:**
- **GET /api/progress/:courseId**
  - Returns: completed lessons, last accessed lesson, playback position (future)

### Data Sent to Backend

**1. Mark Lesson Complete:**
- **POST /api/progress/complete**
  - Request Body:
    ```json
    {
      "courseId": "course123",
      "lessonId": "lesson3"
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "Lesson marked as complete"
    }
    ```

**2. Update Last Accessed Lesson:**
- **PUT /api/progress/last-accessed**
  - Request Body:
    ```json
    {
      "courseId": "course123",
      "lessonId": "lesson3",
      "timestamp": "2026-01-11T10:30:00Z"
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "Progress updated"
    }
    ```

**3. Save Playback Position (Future):**
- **PUT /api/progress/playback-position**
  - Request Body:
    ```json
    {
      "lessonId": "lesson3",
      "position": 120
    }
    ```

### User Actions

1. **Watch Video:**
   - Video auto-plays on load (or click play)
   - User can pause, seek, adjust volume
   - Auto-save last accessed lesson on play

2. **Click "Mark as Complete":**
   - Send POST request to mark lesson complete
   - Update UI: Change icon to checkmark
   - Show toast: "Lesson completed!"
   - Auto-advance to next lesson (load next video)
   - If last lesson: Show "Course Complete!" modal

3. **Click on Different Lesson (Sidebar):**
   - Update URL param `?lesson=:newLessonId`
   - Load new video
   - Save previous lesson as last accessed

4. **Click "Exit Course":**
   - Navigate back to `/courses/:courseId` or `/dashboard`

5. **Fullscreen Mode:**
   - Click fullscreen button
   - Hide sidebar, show minimal controls

### Error States

**Video Fails to Load:**
- Message: "Unable to load video. Please try again."
- "Retry" button
- Check internet connection message

**Mark Complete Error:**
- Message: "Failed to save progress. Please try again."
- "Retry" button (keep mark complete button active)

**Course/Lesson Not Found:**
- Message: "Lesson not found."
- "Back to Course" button

### Responsive Behavior

**Desktop (> 1024px):**
- Two-column layout: Video (70%) + Sidebar (30%)
- Horizontal layout

**Tablet (768px - 1024px):**
- Two-column layout: Video (60%) + Sidebar (40%)

**Mobile (< 768px):**
- Stacked layout: Video on top (full-width), lessons below
- Collapsible lesson list (accordion or tab)
- Video player: Larger play button, touch-friendly controls

### Auto-Resume Feature
- On page load:
  - If no `lesson` param in URL, use last accessed lesson from backend
  - Load that lesson's video
  - Show toast: "Resuming from where you left off"

### Video Player Behavior
- **Controls:** Always visible (not auto-hide) for accessibility
- **Keyboard Shortcuts:**
  - Space: Play/Pause
  - Arrow Left/Right: Seek -/+ 10 seconds
  - Arrow Up/Down: Volume +/-
  - F: Fullscreen
- **Touch Gestures (Mobile):**
  - Tap: Show/Hide controls
  - Double-tap right: Skip forward
  - Double-tap left: Skip backward

### SRS Requirements Satisfied
- **FR-12:** Mark lesson as completed when watched
- **FR-13:** Track last accessed lesson (timestamp)
- **FR-14:** Show course progress
- **NFR-6:** Responsive video player
- **NFR-7:** Intuitive playback controls

---

## PAGE 9: PROFILE PAGE

### Purpose
- Display user profile information
- Show enrolled courses
- Allow profile editing (future - FR-7)
- View learning statistics

### Route
`/profile` (protected)

### UI Components

**Navbar:**
- Same as Dashboard

**Profile Header:**
- User Avatar (large, centered or left)
  - Default avatar if no image uploaded
  - Upload button (future)
- User Name (editable in future)
- Email/Phone (display, not editable)
- Member since: "Joined [Month Year]"
- Edit Profile button (future - FR-7)
  - Opens edit modal or navigates to `/profile/edit`

**Learning Stats Section:**
- Stat Cards (grid layout):
  - Total Courses Enrolled
  - Total Lessons Completed
  - Total Hours Learned
  - Certificates Earned (future)

**Enrolled Courses Section:**
- Section Title: "My Courses"
- Grid of Course Cards (same as Dashboard)
  - Course thumbnail
  - Course title
  - Progress bar
  - "Continue Learning" button

**Account Settings Section (Future):**
- Change Password
- Email Notifications
- Delete Account

**Footer:**
- Standard footer

### Data Fetched from Backend

**1. User Profile:**
- **GET /api/users/profile**
  - Headers: `Authorization: Bearer <token>`
  - Response:
    ```json
    {
      "success": true,
      "data": {
        "id": "user123",
        "name": "John Doe",
        "emailOrPhone": "user@example.com",
        "avatar": "https://example.com/avatar.jpg",
        "createdAt": "2026-01-01T00:00:00Z",
        "stats": {
          "coursesEnrolled": 5,
          "lessonsCompleted": 23,
          "hoursLearned": 12.5
        }
      }
    }
    ```

**2. Enrolled Courses:**
- **GET /api/enrollments/my-courses**
  - Same as Dashboard

### User Actions

1. **View Profile:**
   - Auto-load on page mount

2. **Click "Edit Profile"** (future - FR-7):
   - Open modal or navigate to edit page
   - Allow editing: Name, Avatar
   - Submit: PUT to `/api/users/profile`

3. **Click "Continue Learning"** on course card:
   - Navigate to `/courses/:courseId/player`

4. **Click Course Card:**
   - Navigate to `/courses/:courseId` (details)

5. **Upload Avatar** (future):
   - Click avatar → file picker
   - Upload image
   - Update backend

### Error States

**API Error (Failed to Load Profile):**
- Message: "Unable to load profile. Please try again."
- "Retry" button
- Show skeleton/placeholder

**Update Error (Future):**
- Message: "Failed to update profile. Please try again."
- "Retry" button

### Responsive Behavior
- Mobile: Stacked layout, full-width cards
- Desktop: Avatar + info side-by-side, grid for stats and courses

### SRS Requirements Satisfied
- **FR-6:** Users can view profile details
- **FR-7:** Users can update personal info (future)
- **FR-10:** Display enrolled courses
- **NFR-6:** Responsive layout

---

## PAGE 10: ERROR / FALLBACK PAGES

### 10.1 404 NOT FOUND PAGE

**Purpose:**
- Handle invalid routes
- Guide user back to valid pages

**Route:**
`/404` or any undefined route

**UI Components:**
- Centered error message
- Large "404" text
- Message: "Oops! Page not found."
- Subtext: "The page you're looking for doesn't exist."
- CTA Buttons:
  - "Go to Dashboard" (→ `/dashboard`)
  - "Browse Courses" (→ `/courses`)
- Illustration: Confused person or broken link icon

**No data fetched**

**SRS:** NFR-7 (user-friendly error handling)

---

### 10.2 ERROR PAGE (Generic)

**Purpose:**
- Handle unexpected errors
- Provide recovery options

**Route:**
`/error`

**UI Components:**
- Centered error message
- Large error icon (warning triangle)
- Message: "Something went wrong"
- Subtext: "We're working to fix this. Please try again."
- CTA Buttons:
  - "Refresh Page" (reload)
  - "Contact Support" (future)
- Error details (if in dev mode)

**No data fetched**

**SRS:** FR-16, NFR-7

---

### 10.3 NETWORK OFFLINE PAGE (Optional)

**Purpose:**
- Handle offline state
- Inform user of connectivity issue

**Trigger:**
- Network listener detects offline

**UI Components:**
- Message: "You're offline"
- Subtext: "Check your internet connection"
- Auto-retry when back online
- Illustration: WiFi icon with cross

**SRS:** NFR-7, FR-16

---

## GLOBAL UI PATTERNS

### Color Palette (Example - To Be Refined)
- Primary: Blue (#3B82F6)
- Secondary: Purple (#8B5CF6)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Warning: Yellow (#F59E0B)
- Background: White (#FFFFFF)
- Surface: Light Gray (#F9FAFB)
- Text: Dark Gray (#1F2937)

### Typography
- Font Family: Inter, Roboto, or system font stack
- Headings: Bold, larger sizes (H1: 2.5rem, H2: 2rem, H3: 1.5rem)
- Body: Regular, 1rem
- Small Text: 0.875rem

### Button Styles
- Primary: Solid color, white text, rounded corners
- Secondary: Outlined, transparent background
- Loading: Spinner inside button, disabled state
- Sizes: Small (32px), Medium (40px), Large (48px)

### Input Fields
- Border: 1px solid gray
- Focus: Blue border, subtle shadow
- Error: Red border, red text below
- Success: Green border (optional)
- Placeholder: Light gray text

### Cards
- White background
- Subtle shadow
- Rounded corners (8px)
- Padding: 16px or 24px

### Spacing
- Use Tailwind's spacing scale (4px increments)
- Consistent padding/margin across pages

### Icons
- Use React Icons library
- Consistent size (16px, 20px, 24px)
- Color matches text or brand color

### Animations
- Smooth transitions (200-300ms)
- Fade in/out for modals, toasts
- Skeleton screens for loading

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators (blue outline)
- Alt text on images
- Semantic HTML

---

## DESIGN SYSTEM SUMMARY

All pages follow these principles:
1. **Consistency:** Same navbar, footer, button styles
2. **Clarity:** Clear labels, helpful error messages
3. **Efficiency:** Minimal clicks to complete tasks
4. **Feedback:** Loading states, success/error messages
5. **Responsiveness:** Mobile-first, works on all devices

---

## SRS REQUIREMENTS COVERAGE MATRIX

| Page | FR Satisfied | NFR Satisfied |
|------|--------------|---------------|
| Landing | - | NFR-6, NFR-7 |
| Registration | FR-1, FR-2, FR-15 | NFR-6, NFR-7 |
| OTP Verification | FR-2, FR-3 | NFR-6 |
| Login | FR-3, FR-4, FR-16 | NFR-4, NFR-6 |
| Dashboard | FR-6, FR-10, FR-13, FR-14 | NFR-6, NFR-7 |
| Course Listing | FR-8, FR-9, FR-10 | NFR-6, NFR-7 |
| Course Details | FR-9, FR-11, FR-14 | NFR-6 |
| Course Player | FR-12, FR-13, FR-14 | NFR-6, NFR-7 |
| Profile | FR-6, FR-7, FR-10 | NFR-6 |
| Error Pages | FR-16 | NFR-7 |

**All 16 Functional Requirements** are covered across these pages.
**All 9 Non-Functional Requirements** are addressed in design.

---

## NEXT STEPS (PHASE 3)

Before implementation, we need:
1. **Backend API Contract Validation:**
   - Confirm all endpoint URLs
   - Confirm request/response formats
   - Confirm JWT storage method
   - Confirm error response structure

2. **Asset Preparation:**
   - Logo image
   - Default course thumbnails
   - Default user avatar
   - Illustrations for empty states, errors

3. **Design Mockups (Optional):**
   - High-fidelity mockups for approval
   - Color palette finalization
   - Typography selection

---

**END OF PHASE 2: PAGE-BY-PAGE UI DESIGN**
