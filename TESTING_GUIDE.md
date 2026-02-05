# BodhGanga - Testing Guide

## 🚀 Quick Start Guide

This guide will help you run the BodhGanga application locally and test all features.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Java 21** (JDK)
- **Maven** (for backend build)
- **MongoDB** (running on port 27017)
- **Node.js** (v18+ recommended)
- **npm** or **yarn**

---

## 🔧 Setup Instructions

### 1. MongoDB Setup

Make sure MongoDB is running on your local machine:

```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB (Windows)
net start MongoDB

# Or start MongoDB (macOS/Linux)
sudo systemctl start mongod
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd d:\Projects\BodhGanga\backend

# Build the project (this will download dependencies)
mvn clean install

# Run the Spring Boot application
mvn spring-boot:run

# Or run the JAR file directly
java -jar target/bodhganga-0.0.1-SNAPSHOT.jar
```

**Backend will start on:** `http://localhost:9090`

**Expected output:**
- Server starts successfully
- MongoDB connects
- Sample courses are loaded automatically (10 courses)
- You should see: "Successfully loaded 10 sample courses"

### 3. Frontend Setup

```bash
# Open a new terminal
# Navigate to frontend directory
cd d:\Projects\BodhGanga\frontend

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

**Frontend will start on:** `http://localhost:5173`

---

## 🧪 Testing the Application

### Step 1: Access the Application

Open your browser and navigate to: `http://localhost:5173`

### Step 2: Register a New User

1. Click **"Register"** or **"Sign up"**
2. Fill in the registration form:
   - **Name:** Your Name
   - **Email:** test@example.com
   - **Phone Number:** +919876543210
   - **Password:** password123
   - **City:** Mumbai
   - **State:** Maharashtra
   - **Country:** India
3. Click **"Register"**
4. You should receive a success message and be logged in

### Step 3: Login

If you already have an account:
1. Click **"Login"**
2. Enter your **email or phone** and **password**
3. Click **"Login"**
4. You should be redirected to the Dashboard

### Step 4: Explore Courses

1. Navigate to **"Courses"** from the navbar
2. You should see **10 sample courses** including:
   - Introduction to Indian History
   - Yoga and Meditation Fundamentals
   - Sanskrit Language Basics
   - Vedic Mathematics
   - Indian Classical Music
   - And more...

3. Click on any course to view details

### Step 5: Enroll in a Course

1. Click on a course card
2. Click **"Enroll Now"** button
3. You should see a success message
4. The course will be added to "My Courses"

### Step 6: View Dashboard

1. Navigate to **"Dashboard"**
2. You should see:
   - Welcome message with your email
   - Statistics (enrolled courses, completed courses, etc.)
   - Your enrolled courses

### Step 7: View Profile

1. Navigate to **"Profile"** or click your avatar
2. You should see your user information
3. Try updating your profile:
   - Change your name, city, state, etc.
   - Click **"Save"**
   - Changes should be persisted

### Step 8: View My Courses

1. Navigate to **"My Courses"** or **"Dashboard"**
2. All enrolled courses should be displayed
3. You can click to view course details or start learning

---

## 🔍 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/health` | Health check | No |

### Course Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/courses/list` | Get all courses | No |
| GET | `/api/courses/{id}` | Get course by ID | No |
| GET | `/api/courses/category/{category}` | Get courses by category | No |
| POST | `/api/courses/enroll/{courseId}` | Enroll in course | Yes |
| GET | `/api/courses/my-courses` | Get enrolled courses | Yes |

### Profile Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/profile` | Get user profile | Yes |
| GET | `/api/profile/settings` | Get profile settings | Yes |
| PUT | `/api/profile/settings/update` | Update profile | Yes |

### Dashboard Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard` | Get dashboard data | Yes |
| GET | `/api/dashboard/stats` | Get user statistics | Yes |

---

## 🧰 Testing with Postman/cURL

### 1. Register User

```bash
curl -X POST http://localhost:9090/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phoneNo": "+919876543210",
    "password": "password123",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:9090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "test@example.com",
    "password": "password123"
  }'
```

**Response will include:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "name": "Test User",
      "email": "test@example.com"
    }
  }
}
```

**Copy the token** for authenticated requests.

### 3. Get All Courses

```bash
curl -X GET http://localhost:9090/api/courses/list
```

### 4. Enroll in Course (Protected)

```bash
curl -X POST http://localhost:9090/api/courses/enroll/{courseId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get My Courses (Protected)

```bash
curl -X GET http://localhost:9090/api/courses/my-courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Get Profile (Protected)

```bash
curl -X GET http://localhost:9090/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 Troubleshooting

### Backend Issues

#### Port Already in Use
```
Error: Port 9090 is already in use
```
**Solution:** Change the port in `backend/src/main/resources/application.properties`:
```properties
server.port=8080
```
And update frontend `.env`:
```
VITE_API_BASE_URL=http://localhost:8080/api
```

#### MongoDB Connection Failed
```
Error: Unable to connect to MongoDB
```
**Solution:** 
- Ensure MongoDB is running: `mongosh`
- Check MongoDB URI in `application.properties`

#### Courses Not Loading
```
Empty courses array
```
**Solution:** 
- Restart the backend - DataLoader will populate sample courses
- Or manually add courses through MongoDB Compass

### Frontend Issues

#### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** 
- Ensure backend is running
- Check CORS configuration in backend controllers (`@CrossOrigin`)
- Verify API URL in `.env` file

#### 401 Unauthorized
```
Your session has expired. Please login again.
```
**Solution:** 
- Login again to get a new JWT token
- Token expires after 24 hours

#### Blank Page
```
White screen or React errors
```
**Solution:**
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 MongoDB Verification

### Check if data is loaded:

```bash
# Open MongoDB shell
mongosh

# Switch to bodhganga database
use bodhganga

# Check courses
db.courses.find().count()
# Should return: 10

# View all courses
db.courses.find().pretty()

# Check users
db.users.find().pretty()

# Check enrollments
db.enrollments.find().pretty()
```

---

## 🎯 Feature Checklist

- [ ] Backend starts successfully on port 9090
- [ ] Frontend starts successfully on port 5173
- [ ] MongoDB connection established
- [ ] 10 sample courses loaded
- [ ] User registration works
- [ ] User login works
- [ ] JWT token is stored in localStorage
- [ ] Courses page displays all courses
- [ ] Course enrollment works
- [ ] My Courses shows enrolled courses
- [ ] Profile page displays user info
- [ ] Profile update works
- [ ] Dashboard displays welcome message
- [ ] Logout works and clears token

---

## 🌟 Next Steps

After successful testing, you can:

1. **Add More Features:**
   - Course content/lessons
   - Video player
   - Progress tracking
   - Certificates
   - Payments integration

2. **Enhance UI:**
   - Better course cards
   - Filters and search
   - Course categories
   - User reviews

3. **Deploy:**
   - Backend: Heroku, Railway, or AWS
   - Frontend: Vercel, Netlify
   - Database: MongoDB Atlas

---

## 📞 Support

If you encounter any issues:
1. Check the console logs (browser and terminal)
2. Verify all services are running
3. Check network tab in browser DevTools
4. Review the troubleshooting section above

Happy Learning! 🎓
