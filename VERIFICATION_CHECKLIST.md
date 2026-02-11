# ✅ BODHGANGA PRODUCTION READINESS CHECKLIST

**Purpose:** Verify all fixes are working and connectivity is stable  
**Date:** 2026-02-05  
**Version:** 1.0

---

## PRE-FLIGHT CHECKS

### [ ] 1. MongoDB Running

```powershell
# Check if MongoDB is running
mongo

# If fails, start MongoDB
mongod --dbpath /path/to/data

# Verify database exists
> use bodhganga
> show collections
# Expected: users, courses, enrollments
```

---

### [ ] 2. Backend Compiles

```bash
cd c:\PROJECTS\bodhganga\backend
./mvnw clean install

# Expected output (last line):
# BUILD SUCCESS
```

**If fails:** Check compilation errors in console

---

### [ ] 3. Backend Runs

```bash
./mvnw spring-boot:run

# Expected output:
# Started BodhgangaApplication in X.XXX seconds (JVM running for Y.YYY)
```

**Common issues:**

- Port 9090 already in use → Kill existing process
- MongoDB not running → Start MongoDB first
- Compilation errors → Run `./mvnw clean install`

---

### [ ] 4. Port 9090 Listening

```powershell
netstat -ano | findstr :9090

# Expected:
# TCP    0.0.0.0:9090           0.0.0.0:0              LISTENING       12345
```

**If no output:** Backend not started successfully

---

### [ ] 5. Health Endpoint Responds

```powershell
curl http://localhost:9090/api/auth/health

# Expected:
# "Auth service is running"
```

**If fails:**

- Backend not running → Check Step 3
- Wrong port → Check application.properties `server.port`
- Endpoint blocked → Check SecurityConfig permitAll rules

---

### [ ] 6. Frontend .env Exists

```powershell
cd c:\PROJECTS\bodhganga\frontend
cat .env

# Expected:
# VITE_API_BASE_URL=http://localhost:9090/api
```

**If missing:** Create file with above content

---

### [ ] 7. Frontend Dependencies Installed

```bash
npm install

# Expected:
# added XXX packages, and audited YYY packages...
```

---

### [ ] 8. Frontend Runs

```bash
npm run dev

# Expected:
# VITE v5.1.4  ready in XXX ms
# ➜  Local:   http://localhost:5173/
```

---

## RUNTIME VERIFICATION

### [ ] 9. API URL Logged Correctly

**Action:** Open `http://localhost:5173` → Press F12 → Console

**Expected Output:**

```
🌐 API Base URL: http://localhost:9090/api
```

**If shows `undefined/api`:**

- `.env` file missing → Create it
- Vite not restarted after creating `.env` → Restart `npm run dev`

---

### [ ] 10. Backend Health Check Passes

**Check Console (within 5 seconds of page load):**

**Expected (Backend Running):**

```
✅ Backend Health Check: HEALTHY
   Response: Auth service is running
   Response Time: <100ms
   Backend URL: http://localhost:9090/api
```

**If shows FAILED:**

```
❌ Backend Health Check: FAILED
   Error: Backend not running or network error
   Code: BACKEND_DOWN
```

→ Backend not running, go to Step 3

---

### [ ] 11. No .env Validation Errors

**Check Console:**

**Should NOT see:**

```
❌ CRITICAL: VITE_API_BASE_URL is not defined in .env file!
```

**If you see this:**

- Create `.env` file
- Restart Vite

---

### [ ] 12. Registration Page Loads

**Action:** Go to `http://localhost:5173/register`

**Expected:**

- ✅ Page loads without errors
- ✅ Form is visible
- ✅ No console errors

---

### [ ] 13. Test Registration Flow

**Fill Form:**

```
Name: Test User 999
Email: test999@example.com
Phone: 9876543210
Password: password123
City: Mumbai
State: Maharashtra
Country: India
```

**Click "Sign Up"**

**Expected (Backend Running):**

- ✅ Success toast: "User registered successfully"
- ✅ Auto-redirect to `/dashboard`
- ✅ User data stored in localStorage
- ✅ No errors in console

**Expected (Backend Down):**

- ❌ Error toast: "Unable to connect to server. Please ensure the backend is running on http://localhost:9090"
- ❌ No redirect
- ✅ Console shows: `code: "BACKEND_UNAVAILABLE"`

---

### [ ] 14. Network Tab Verification

**Action:** F12 → Network → Filter: Fetch/XHR → Attempt signup

**Check:**

- Request URL: `http://localhost:9090/api/auth/signup` (no `/api/api`)
- Method: POST
- Status: 201 (success) or 400 (validation error)
- Response: JSON with `success`, `message`, `data`

**Should NOT see:**

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**If CORS error:** SecurityConfig fix not applied correctly

---

### [ ] 15. Error Code Verification

**Action:** Open browser console → Attempt signup

**Check error object structure:**

```javascript
{
  message: "Unable to connect to server...",
  code: "BACKEND_UNAVAILABLE",  // Must have error code
  networkError: true
}
```

**Verify distinct codes:**

- Backend down → `BACKEND_UNAVAILABLE`
- Timeout → `TIMEOUT`
- CORS → `CORS_ERROR`
- 401 → `UNAUTHORIZED`
- 403 → `FORBIDDEN`

---

### [ ] 16. Login Flow Test

**Action:** Go to `http://localhost:5173/login`

**Test with:**

```
Email/Phone: test999@example.com
Password: password123
```

**Expected (Backend Running):**

- ✅ Success toast: "Login successful"
- ✅ Redirect to `/dashboard`
- ✅ Token stored in localStorage

**Expected (Backend Down):**

- ❌ Error: "Unable to connect to server..."
- ❌ Code: `BACKEND_UNAVAILABLE`

**Expected (Wrong Password):**

- ❌ Error: "Invalid email or password"
- ❌ Status: 401
- ❌ Code: `UNAUTHORIZED`

---

### [ ] 17. Protected Route Test

**Action:** Clear localStorage → Go to `http://localhost:5173/dashboard`

**Expected:**

- ✅ Redirect to `/login`
- ✅ No backend call (client-side protection)

---

### [ ] 18. CORS Preflight Test

**Action:** Attempt signup → Check Network tab → Look for OPTIONS request

**Expected:**

- OPTIONS request to `http://localhost:9090/api/auth/signup`
- Status: 200
- Response headers include:
  - `Access-Control-Allow-Origin: http://localhost:5173`
  - `Access-Control-Allow-Methods: *`
  - `Access-Control-Allow-Headers: *`

---

## ERROR SCENARIO TESTING

### [ ] 19. Test Backend-Down Error

**Steps:**

1. Stop backend (Ctrl+C)
2. Refresh frontend
3. Try to login/register

**Expected Console:**

```
❌ Backend Health Check: FAILED
   Error: Backend not running or network error
   Code: BACKEND_DOWN
```

**Expected User Error:**

```
Unable to connect to server. Please ensure the backend is running on http://localhost:9090
```

**Verify:**

- ✅ Error message is specific
- ✅ Error code is `BACKEND_UNAVAILABLE`
- ✅ Does NOT say "Check your internet connection"

---

### [ ] 20. Test 401 Error (Token Expired)

**Steps:**

1. Set invalid token in localStorage:

```javascript
localStorage.setItem("auth_token", "invalid.token.here");
```

2. Try to access protected route

**Expected:**

- ✅ Auto-redirect to `/login`
- ✅ localStorage cleared
- ✅ Console shows: `code: "UNAUTHORIZED"`

---

### [ ] 21. Test Timeout Error (Optional)

**Steps:**

1. Add delay in backend controller (test only)
2. Set Axios timeout to 2000ms
3. Make API call

**Expected Error:**

```
Request timeout. The server took too long to respond.
Code: TIMEOUT
```

---

## PRODUCTION READINESS

### [ ] 22. No Console Errors in Production Build

```bash
npm run build

# Expected:
# dist/ folder created
# No build errors
```

---

### [ ] 23. Environment Variables Documented

**Check:** `README.md` or `.env.example` documents all required variables

**Required:**

```
VITE_API_BASE_URL=http://localhost:9090/api
```

---

### [ ] 24. Backend Logs Clean

**Check backend console:**

**Should NOT see:**

- Repeated stack traces
- NullPointerExceptions
- CORS errors
- 403 Forbidden errors

**Should see:**

- Successful requests logged
- 200/201 status codes

---

### [ ] 25. MongoDB Data Persists

```javascript
mongo
> use bodhganga
> db.users.find({email: "test999@example.com"}).pretty()

// Expected: User document with hashed password
```

---

## FINAL SIGN-OFF

### All Checks Passed?

**If YES:**

- ✅ Project is ready for development
- ✅ All connectivity issues resolved
- ✅ Error messages are accurate
- ✅ Health checks working
- ✅ CORS configured correctly

**If NO:**

- Review failed checks
- Consult `INCIDENT_REPORT.md` for fixes
- Consult `DEBUGGING_GUIDE.md` for common issues
- Verify all files in fix list are modified

---

## QUICK TROUBLESHOOTING

| Symptom                          | Likely Cause                  | Fix                                     |
| -------------------------------- | ----------------------------- | --------------------------------------- |
| "Check internet connection"      | Backend not running           | Start backend: `./mvnw spring-boot:run` |
| "Unable to connect to server..." | Backend down (correct error!) | Start backend                           |
| CORS error in console            | SecurityConfig not fixed      | Verify SecurityConfig CORS config       |
| `undefined/api` in console       | .env not loaded               | Create .env, restart Vite               |
| 401 Unauthorized                 | Token expired/invalid         | Clear localStorage, login again         |
| 403 Forbidden                    | SecurityConfig blocking       | Check permitAll rules                   |
| Timeout error                    | Backend slow or hanging       | Check MongoDB, increase timeout         |
| Build fails                      | Missing dependencies          | Run `npm install`                       |

---

## MAINTENANCE CHECKLIST (Weekly)

- [ ] Pull latest code: `git pull`
- [ ] Update dependencies: `npm update`, `./mvnw clean install`
- [ ] Clear browser cache and localStorage
- [ ] Test registration/login flows
- [ ] Check MongoDB disk space
- [ ] Review backend logs for errors
- [ ] Verify health check still passing

---

**Checklist Version:** 1.0  
**Last Updated:** 2026-02-05  
**Estimated Completion Time:** 15-20 minutes

**Sign-off:** ******\_\_\_\_****** (Developer Name)  
**Date:** ******\_\_\_\_******
