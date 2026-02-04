# 🎯 Integration Checklist for Spring Boot Developer

Use this checklist to ensure smooth integration of the Ganga Bodh frontend with your Spring Boot backend.

## 📋 Initial Setup

- [ ] Extract the frontend code to your development environment
- [ ] Install Node.js (v16+ required)
- [ ] Run `npm install` to install all dependencies
- [ ] Create `.env` file from `.env.example` template
- [ ] Update `VITE_API_BASE_URL` in `.env` to point to your Spring Boot API

## 🔍 Code Review

### API Services (Priority: HIGH)

Review and update all files in `src/services/`:

- [ ] **authService.js** - Authentication endpoints
  - Login endpoint
  - Logout endpoint
  - Token refresh (if applicable)
  - User profile endpoint

- [ ] **userService.js** - User management endpoints
  - Get user details
  - Update user profile
  - User list (admin)

- [ ] **Other service files** - Review all other service files
  - List all API endpoints used
  - Document expected request/response formats
  - Update base URLs and endpoints

### Authentication Flow

- [ ] Review `src/context/AuthContext.jsx` for auth state management
- [ ] Verify token storage mechanism (localStorage/sessionStorage)
- [ ] Confirm token is sent in Authorization header
- [ ] Check token expiry handling

### Configuration Files

- [ ] Review `src/config/` for any hardcoded URLs or settings
- [ ] Check for any environment-specific configurations

## 🌐 Spring Boot Backend Setup

### CORS Configuration

- [ ] Enable CORS in Spring Boot
- [ ] Allow origin: `http://localhost:5173` (Vite dev server)
- [ ] Allow methods: GET, POST, PUT, DELETE, OPTIONS
- [ ] Allow credentials: true (if using cookies/sessions)

**Example Spring Boot CORS Config:**

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

### API Endpoints Mapping

Create a document mapping frontend API calls to Spring Boot endpoints:

- [ ] List all API calls from frontend services
- [ ] Create corresponding Spring Boot REST controllers
- [ ] Document request/response DTOs
- [ ] Implement error handling that matches frontend expectations

### Security Configuration

- [ ] Configure Spring Security
- [ ] Implement JWT authentication (or your chosen method)
- [ ] Set up public vs protected endpoints
- [ ] Configure session management

## 🧪 Testing

### Basic Connectivity

- [ ] Start Spring Boot backend
- [ ] Start frontend dev server (`npm run dev`)
- [ ] Verify frontend can reach backend (check browser console)
- [ ] Test CORS is working (no CORS errors in console)

### Authentication Flow

- [ ] Test user login
- [ ] Verify token is received and stored
- [ ] Test authenticated API calls
- [ ] Test token refresh (if applicable)
- [ ] Test logout functionality

### API Endpoints

- [ ] Test all GET endpoints
- [ ] Test all POST endpoints (create operations)
- [ ] Test all PUT/PATCH endpoints (update operations)
- [ ] Test all DELETE endpoints
- [ ] Verify error responses are handled correctly

### Error Handling

- [ ] Test 401 Unauthorized responses
- [ ] Test 403 Forbidden responses
- [ ] Test 404 Not Found responses
- [ ] Test 500 Server Error responses
- [ ] Verify user-friendly error messages are shown

## 🚀 Deployment Preparation

### Environment Configuration

- [ ] Create production `.env` file
- [ ] Update API URL for production environment
- [ ] Remove any development-only configurations

### Build for Production

- [ ] Run `npm run build`
- [ ] Verify build completes without errors
- [ ] Test production build locally (`npm run preview`)
- [ ] Check bundle size and optimize if needed

### Deployment Options

Choose your deployment strategy:

- [ ] **Option 1:** Serve from Spring Boot (static resources)
- [ ] **Option 2:** Separate frontend server (Nginx, Apache)
- [ ] **Option 3:** CDN deployment (Netlify, Vercel, S3)

### If Serving from Spring Boot

- [ ] Copy `dist/` folder to Spring Boot `src/main/resources/static/`
- [ ] Configure Spring Boot to serve static resources
- [ ] Update CORS to allow production frontend URL
- [ ] Test complete application

## 📝 Documentation

- [ ] Document API endpoint mappings
- [ ] Create API documentation (Swagger/OpenAPI)
- [ ] Document authentication flow
- [ ] Document deployment process
- [ ] Create developer onboarding guide

## 🔐 Security Review

- [ ] Review all API endpoints for security
- [ ] Implement input validation on backend
- [ ] Sanitize user inputs
- [ ] Implement rate limiting
- [ ] Review authentication/authorization logic
- [ ] Check for SQL injection vulnerabilities
- [ ] Check for XSS vulnerabilities
- [ ] Implement HTTPS in production

## 🎨 Frontend Customization (Optional)

- [ ] Review and customize color schemes in `tailwind.config.js`
- [ ] Update branding/logo in `src/assets/`
- [ ] Review and update text content
- [ ] Customize form validations
- [ ] Update SEO meta tags in `index.html`

## 📊 Monitoring & Logging

- [ ] Set up error logging on backend
- [ ] Implement request/response logging
- [ ] Set up performance monitoring
- [ ] Configure alerts for critical errors

## ✅ Final Verification

- [ ] All features working as expected
- [ ] No console errors in browser
- [ ] No 404 errors for API calls
- [ ] Authentication working correctly
- [ ] User flows tested end-to-end
- [ ] Responsive design working on mobile/tablet
- [ ] Cross-browser testing completed

---

## 🆘 Common Issues & Solutions

### Issue: CORS errors

**Solution:** Verify CORS configuration in Spring Boot and ensure frontend URL is allowed

### Issue: 401 Unauthorized on all requests

**Solution:** Check if JWT token is being sent correctly in Authorization header

### Issue: API calls returning 404

**Solution:** Verify API base URL is correct and Spring Boot server is running

### Issue: Cannot read properties of undefined

**Solution:** Check API response format matches what frontend expects

---

## 📞 Support

If you encounter any issues or have questions about the frontend architecture:

1. Check the main `README.md` for setup instructions
2. Review service files for API endpoint documentation
3. Check browser console for error messages
4. Review Spring Boot logs for backend errors

---

**Good luck with the integration!** 🚀

_Last Updated: 2026-02-04_
