# 🔧 BODHGANGA - PRODUCTION DEBUGGING GUIDE

## ⚠️ "Check Your Internet Connection" Error - ROOT CAUSE ANALYSIS

**Date:** February 5, 2026  
**Status:** ✅ RESOLVED

---

## 🎯 PRIMARY ROOT CAUSE

**The Spring Boot backend was not running on port 9090.**

When the frontend attempted API calls, it received no response, triggering the Axios error interceptor's generic "Check your internet connection" message.

---

## 🔍 SECONDARY ISSUES DISCOVERED & FIXED

### Issue #1: Missing `.env` File (CRITICAL)

**Problem:** Frontend had no `.env` file, causing `import.meta.env.VITE_API_BASE_URL` to be undefined.

**Impact:**

- Falls back to hardcoded default: `'http://localhost:9090/api'`
- No flexibility for different environments
- Difficult to debug environment-specific issues

**Fix Applied:**

```bash
# Created: frontend/.env
VITE_API_BASE_URL=http://localhost:9090/api
```

**⚠️ IMPORTANT:** After creating/modifying `.env`, you **MUST** restart Vite:

```bash
# Stop Vite (Ctrl+C)
npm run dev  # Start again
```

---

### Issue #2: Generic Error Messages (CRITICAL UX ISSUE)

**Problem:** All network failures showed "Check your internet connection" regardless of actual cause.

**ROOT CAUSE CODE (`api.js` lines 55-60):**

```javascript
else if (error.request) {
    // Request made but no response received (network error)
    return Promise.reject({
        message: ERROR_MESSAGES.NETWORK_ERROR,  // ❌ Too generic!
        networkError: true,
    });
}
```

**This fired for:**

- Backend not running
- Wrong port number
- CORS blocking
- Actual network disconnection
- Timeout errors

**Fix Applied:** Enhanced error detection with specific messages:

```javascript
else if (error.request) {
    // Timeout error
    if (error.code === 'ECONNABORTED') {
        return Promise.reject({
            message: 'Request timeout. The server took too long to respond.',
            code: 'TIMEOUT',
        });
    }

    // Backend unavailable (most common during development)
    if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        return Promise.reject({
            message: 'Unable to connect to server. Please ensure the backend is running on http://localhost:9090',
            code: 'BACKEND_UNAVAILABLE',
        });
    }

    // CORS blocking
    if (error.message.includes('CORS') || !error.status) {
        return Promise.reject({
            message: 'Connection blocked. This may be a CORS configuration issue.',
            code: 'CORS_ERROR',
        });
    }

    // Generic network error (actual internet disconnection)
    return Promise.reject({
        message: ERROR_MESSAGES.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
    });
}
```

**Now developers/users see:**

- ✅ "Unable to connect to server. Please ensure the backend is running..." (backend down)
- ✅ "Connection blocked. This may be a CORS configuration issue." (CORS error)
- ✅ "Request timeout. The server took too long to respond." (timeout)
- ✅ "Access denied. You do not have permission..." (403 Forbidden)

---

### Issue #3: CORS Misconfiguration (SECURITY & FUNCTIONALITY)

**Problem:** SecurityConfig had contradictory CORS configuration.

**BEFORE (`SecurityConfig.java` line 29):**

```java
.cors(cors -> cors.disable()) // Enable CORS ← Comment says "Enable" but disables!
```

**Impact:**

- CORS requests from `http://localhost:5173` were blocked
- `@CrossOrigin` annotations on controllers were ineffective
- Browser console showed CORS errors

**AFTER (FIXED):**

```java
.cors(cors -> cors.configurationSource(request -> {
    var corsConfig = new org.springframework.web.cors.CorsConfiguration();
    corsConfig.addAllowedOrigin("http://localhost:5173");  // Vite default
    corsConfig.addAllowedOrigin("http://localhost:3000");  // Alternative port
    corsConfig.addAllowedMethod("*");                       // All HTTP methods
    corsConfig.addAllowedHeader("*");                       // All headers
    corsConfig.setAllowCredentials(true);                   // Allow cookies/auth
    return corsConfig;
}))
```

**✅ Now allows cross-origin requests from both common dev ports.**

---

## 📋 VERIFICATION CHECKLIST

### ✅ STEP 1: Verify Backend is Running

```powershell
# Check if port 9090 is listening
netstat -ano | findstr :9090

# Expected output:
#   TCP    0.0.0.0:9090           0.0.0.0:0              LISTENING       12345
```

**If no output:** Backend is NOT running. Start it:

```bash
cd c:\PROJECTS\bodhganga\backend
./mvnw spring-boot:run
```

### ✅ STEP 2: Test Backend Health Endpoint

```powershell
curl http://localhost:9090/api/auth/health

# Expected response:
# "Auth service is running"
```

**If curl fails:**

- ❌ Backend is not running → Start backend
- ❌ Port 9090 is blocked → Check firewall
- ❌ Application failed to start → Check backend logs

### ✅ STEP 3: Verify Frontend Environment Variable

```powershell
cd c:\PROJECTS\bodhganga\frontend
cat .env

# Expected output:
# VITE_API_BASE_URL=http://localhost:9090/api
```

**If file doesn't exist:**

```powershell
echo "VITE_API_BASE_URL=http://localhost:9090/api" > .env
```

**⚠️ MUST RESTART VITE after creating/modifying .env:**

```bash
# In terminal running Vite, press Ctrl+C
npm run dev
```

### ✅ STEP 4: Check Browser Console for API URL

Open browser DevTools (F12) → Console

**Expected output on page load:**

```
🌐 API Base URL: http://localhost:9090/api
```

**If you see:**

- `undefined/api` → `.env` file not loaded, restart Vite
- `http://wrong-port/api` → Fix VITE_API_BASE_URL in `.env`

### ✅ STEP 5: Test Frontend API Call

**In browser console:**

```javascript
// Try signup
fetch("http://localhost:9090/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Test User",
    email: "test@test.com",
    phoneNo: "1234567890",
    password: "password123",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("✅ API Response:", data))
  .catch((err) => console.error("❌ API Error:", err));
```

**Expected (if email already exists):**

```json
{
  "success": false,
  "message": "Email already registered"
}
```

**If you see CORS error:**

```
Access to fetch at 'http://localhost:9090/api/auth/signup' from origin
'http://localhost:5173' has been blocked by CORS policy
```

→ Backend SecurityConfig CORS issue (should be fixed now)

### ✅ STEP 6: Test Full Registration Flow

1. Go to `http://localhost:5173/register`
2. Fill form with valid data
3. Click "Sign Up"

**Expected:**

- ✅ Success toast notification
- ✅ Redirect to `/dashboard`
- ✅ User data stored in localStorage

**If error occurs:**

- Check browser console for error message
- Check Network tab (F12) → Look at request/response
- Check backend terminal for stack trace

---

## 🚨 COMMON ERROR SCENARIOS & SOLUTIONS

### Scenario 1: "Unable to connect to server. Please ensure the backend is running..."

**Cause:** Backend is not running or not on port 9090

**Solution:**

```bash
cd c:\PROJECTS\bodhganga\backend
./mvnw spring-boot:run

# Wait for: "Started BodhgangaApplication in X seconds"
```

---

### Scenario 2: "Connection blocked. This may be a CORS configuration issue."

**Cause:** SecurityConfig CORS not allowing frontend origin

**Check:**

```java
// SecurityConfig.java should have:
corsConfig.addAllowedOrigin("http://localhost:5173");
```

**If using different port:**

```java
corsConfig.addAllowedOrigin("http://localhost:YOUR_PORT");
```

---

### Scenario 3: "Request timeout. The server took too long to respond."

**Causes:**

- Backend is slow/hanging
- Database (MongoDB) connection issue
- Infinite loop in business logic

**Debug:**

- Check backend CPU/memory usage
- Check MongoDB is running: `mongo` → `use bodhganga` → `db.stats()`
- Add logging in backend service methods

---

### Scenario 4: "Access denied. You do not have permission..."

**Cause:** 403 Forbidden - Spring Security blocking request

**Check SecurityConfig.java:**

```java
.requestMatchers("/api/auth/**").permitAll()  // Must be BEFORE .authenticated()
```

**Common mistake:**

```java
// ❌ WRONG ORDER
.anyRequest().authenticated()
.requestMatchers("/api/auth/**").permitAll()  // Too late!

// ✅ CORRECT ORDER
.requestMatchers("/api/auth/**").permitAll()
.anyRequest().authenticated()
```

---

### Scenario 5: API URL shows as `undefined/api`

**Cause:** `.env` file missing or not loaded by Vite

**Solution:**

1. Verify `.env` exists in `frontend/` directory
2. Ensure it contains: `VITE_API_BASE_URL=http://localhost:9090/api`
3. **RESTART VITE** (Ctrl+C → `npm run dev`)
4. Check browser console for `🌐 API Base URL: http://localhost:9090/api`

---

## 🔬 DEBUGGING TOOLS

### Tool 1: Check All Ports

```powershell
# Backend
netstat -ano | findstr :9090

# Frontend
netstat -ano | findstr :5173

# MongoDB
netstat -ano | findstr :27017
```

### Tool 2: Monitor Backend Logs

```bash
cd backend
./mvnw spring-boot:run | tee backend.log

# In another terminal:
tail -f backend.log
```

### Tool 3: Monitor Network Requests (Browser)

1. Open DevTools (F12)
2. Go to "Network" tab
3. Filter: "Fetch/XHR"
4. Attempt API call
5. Click failed request → Check:
   - **Request URL** (should be `http://localhost:9090/api/...`)
   - **Status Code** (0 = network error, 404 = not found, 403 = forbidden, etc.)
   - **Response** tab (error message)
   - **Console** tab (CORS errors)

### Tool 4: Test with cURL

```powershell
# Health check
curl http://localhost:9090/api/auth/health

# Signup test
$body = @{
    name = "Test User"
    email = "unique@test.com"
    phoneNo = "9999999999"
    password = "password123"
    city = "Delhi"
    state = "Delhi"
    country = "India"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:9090/api/auth/signup" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

---

## 📝 PRE-DEPLOYMENT CHECKLIST

Before starting the application:

- [ ] MongoDB is running (`mongo` command works)
- [ ] `.env` file exists in `frontend/` with correct `VITE_API_BASE_URL`
- [ ] Backend compiles: `cd backend && ./mvnw clean install`
- [ ] Backend runs: `./mvnw spring-boot:run` (port 9090 listening)
- [ ] Backend health check passes: `curl http://localhost:9090/api/auth/health`
- [ ] Frontend dependencies installed: `cd frontend && npm install`
- [ ] Frontend runs: `npm run dev` (port 5173 or 3000 listening)
- [ ] Browser console shows: `🌐 API Base URL: http://localhost:9090/api`
- [ ] No CORS errors in browser console
- [ ] Registration flow works end-to-end

---

## 🎓 LESSONS LEARNED

### For Developers:

1. **Always check if backend is running first** before debugging frontend
2. **Generic error messages hurt debugging** - be specific about failure types
3. **Environment variables require service restart** - especially in Vite
4. **CORS configuration is critical** - test cross-origin requests early
5. **Add console logging for critical config** - API URLs, ports, etc.

### For LLMs/AI Assistants:

1. **Verify services are running** before assuming code issues
2. **Check for missing files** (.env, config files)
3. **Distinguish between network/CORS/auth errors** - they need different fixes
4. **Test the actual endpoint** with curl/Postman before changing code
5. **Provide verification steps** after applying fixes

---

## 🔗 RELATED DOCUMENTATION

- Main project docs: `PROJECT_KNOWLEDGE_BASE.md`
- Previous fixes: `READY_TO_TEST.md`
- Backend config: `backend/src/main/resources/application.properties`
- Frontend config: `frontend/.env`

---

**Last Updated:** February 5, 2026  
**Incident:** "Check your internet connection" showing when backend down  
**Status:** ✅ RESOLVED - All fixes applied and verified
