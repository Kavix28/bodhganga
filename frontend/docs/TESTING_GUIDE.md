# 🚀 Gangabhodh Learning Platform - Testing Guide

## 🌐 Server Status
- **Backend (Spring Boot)**: `http://localhost:9090` ✅ RUNNING
- **Frontend (React + Vite)**: `http://localhost:3001` ✅ RUNNING

---

## 🧪 Complete Testing Workflow

### 1. 🏠 **Landing Page Testing**
**URL**: `http://localhost:3001/`

**Test Cases**:
- ✅ Page loads without errors
- ✅ Hero section displays correctly
- ✅ Features section shows 4 feature cards
- ✅ Course preview section (may show loading or empty state)
- ✅ Call-to-action buttons work
- ✅ Responsive design on mobile/tablet

**Expected Behavior**:
- Clean, professional landing page
- "Get Started" button → redirects to `/register`
- "Browse Courses" button → redirects to `/login` (if not authenticated)

---

### 2. 👤 **User Registration & Authentication Flow**

#### **Step 2a: Registration**
**URL**: `http://localhost:3001/register`

**Test Data**:
```
Email: test@example.com
Password: TestUser123!
```

**Test Cases**:
- ✅ Form validation works (email format, password strength)
- ✅ Password strength indicator updates
- ✅ Registration submits successfully
- ✅ Redirects to OTP verification page

#### **Step 2b: OTP Verification**
**URL**: `http://localhost:3001/verify-otp`

**Test Cases**:
- ✅ OTP input field accepts 6 digits
- ✅ Resend OTP functionality
- ✅ Mock OTP verification (use any 6-digit code)
- ✅ Successful verification redirects to login

#### **Step 2c: Login**
**URL**: `http://localhost:3001/login`

**Test Data**:
```
Email: test@example.com
Password: TestUser123!
```

**Test Cases**:
- ✅ Login form validation
- ✅ Successful login redirects to dashboard
- ✅ JWT token stored in localStorage
- ✅ User session persists on page refresh

---

### 3. 📊 **User Dashboard**
**URL**: `http://localhost:3001/dashboard` (requires login)

**Test Cases**:
- ✅ Dashboard loads with user data
- ✅ Navigation shows user-specific options
- ✅ Protected route works (redirects to login if not authenticated)
- ✅ User can access courses, profile sections

---

### 4. 📚 **Courses Section**
**URL**: `http://localhost:3001/courses` (requires login)

**Test Cases**:
- ✅ Course listing page loads
- ✅ Course cards display properly
- ✅ Course detail navigation works
- ✅ Purchase flow integration

---

### 5. 🔐 **Admin Dashboard Testing**

#### **Step 5a: Admin Login**
**URL**: `http://localhost:3001/admin/login`

**Admin Credentials**:
```
Username: admin
Password: GangaBhodh@2024
```

**Test Cases**:
- ✅ Admin login form loads
- ✅ Secure dark theme interface
- ✅ Credential validation works
- ✅ Successful login redirects to admin dashboard
- ✅ Session management (24-hour expiry)

#### **Step 5b: Admin Dashboard Features**
**URL**: `http://localhost:3001/admin/dashboard` (requires admin login)

**Test Cases**:

**Dashboard Tab**:
- ✅ Statistics cards display (Content: 12, Published: 8, Users: 156, Revenue: ₹45,600)
- ✅ Recent activity feed shows mock data
- ✅ Professional admin interface

**Content Tab**:
- ✅ Content management table
- ✅ Mock content data displays
- ✅ Toggle publish/unpublish functionality
- ✅ Delete content functionality
- ✅ "Create Content" button

**Users Tab**:
- ✅ User management interface
- ✅ User search functionality
- ✅ User status toggle (Active/Disabled)
- ✅ User verification status display
- ✅ Delete user functionality

**Settings Tab**:
- ✅ Platform settings toggles
- ✅ Security options
- ✅ Configuration interface

**Admin Header**:
- ✅ Admin profile display
- ✅ Settings button
- ✅ Logout functionality
- ✅ Session info display

---

## 🔧 **API Testing**

### Backend Health Check
```bash
curl http://localhost:9090/actuator/health
```
**Expected**: `{"status":"UP"}`

### Authentication Endpoints
```bash
# Register
curl -X POST http://localhost:9090/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"test@example.com","password":"TestUser123!"}'

# Login
curl -X POST http://localhost:9090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"test@example.com","password":"TestUser123!"}'
```

---

## 🐛 **Common Issues & Solutions**

### Issue 1: Blank Page
**Solution**: Check browser console for JavaScript errors, ensure both servers are running

### Issue 2: API Connection Failed
**Solution**: Verify backend is running on port 9090, check CORS configuration

### Issue 3: Admin Login Not Working
**Solution**: Use exact credentials: `admin` / `GangaBhodh@2024`

### Issue 4: Session Expired
**Solution**: Re-login, sessions last 24 hours for admin, JWT expiry for users

---

## 📱 **Mobile Testing**

**Test on different screen sizes**:
- ✅ Mobile (320px - 768px)
- ✅ Tablet (768px - 1024px)
- ✅ Desktop (1024px+)

**Key responsive features**:
- ✅ Mobile navigation menu
- ✅ Responsive cards and layouts
- ✅ Touch-friendly buttons
- ✅ Readable text on small screens

---

## 🎯 **Success Criteria**

### ✅ **Frontend**
- [ ] Landing page loads and looks professional
- [ ] User registration/login flow works end-to-end
- [ ] Protected routes redirect properly
- [ ] Admin dashboard is fully functional
- [ ] Responsive design works on all devices
- [ ] No console errors

### ✅ **Backend**
- [ ] Server starts without errors
- [ ] Database migrations run successfully
- [ ] API endpoints respond correctly
- [ ] JWT authentication works
- [ ] CORS configured properly

### ✅ **Integration**
- [ ] Frontend communicates with backend
- [ ] Authentication flow works
- [ ] Session management functions
- [ ] Error handling displays properly

---

## 🚀 **Next Steps After Testing**

1. **Production Deployment**: Use provided Docker configuration
2. **Database Setup**: Configure PostgreSQL for production
3. **Environment Variables**: Set up production environment files
4. **SSL/HTTPS**: Configure secure connections
5. **Monitoring**: Set up logging and monitoring

---

## 📞 **Support**

If you encounter any issues during testing:
1. Check both server logs
2. Verify browser console for errors
3. Ensure all dependencies are installed
4. Check network connectivity between frontend/backend

**Happy Testing! 🎉**