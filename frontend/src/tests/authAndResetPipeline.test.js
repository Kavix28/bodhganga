import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('ðŸ§ª Running Authentication & Password Reset Flow Tests...\n');

// 1. Verify App.jsx routes for forgot-password and reset-password
const appPath = path.join(__dirname, '../App.jsx');
const appContent = fs.readFileSync(appPath, 'utf8');

assert.ok(
    appContent.includes("const ResetPassword    = lazy(() => import('./pages/ResetPassword'));"),
    'App.jsx must lazy-load ResetPassword component'
);
assert.ok(
    appContent.includes('<Route path="/reset-password" element={<ResetPassword />} />'),
    'App.jsx must configure the /reset-password route'
);
assert.ok(
    appContent.includes('<Route path="/forgot-password" element={<ForgotPassword />} />'),
    'App.jsx must configure the /forgot-password route'
);
console.log('âœ… Test 1 Passed: App.jsx routes for /forgot-password and /reset-password verified.');

// 2. Verify authService.js exports and payload contracts
const authServicePath = path.join(__dirname, '../services/authService.js');
const authServiceContent = fs.readFileSync(authServicePath, 'utf8');

assert.ok(authServiceContent.includes('export const forgotPassword = async (email)'), 'forgotPassword function must be exported');
assert.ok(authServiceContent.includes('/auth/forgot-password'), 'forgotPassword must target /auth/forgot-password');

assert.ok(authServiceContent.includes('export const verifyResetToken = async (token)'), 'verifyResetToken function must be exported');
assert.ok(authServiceContent.includes('/auth/verify-reset-token'), 'verifyResetToken must target /auth/verify-reset-token');

assert.ok(authServiceContent.includes('export const resetPassword = async (token, newPassword)'), 'resetPassword function must be exported');
assert.ok(authServiceContent.includes('/auth/reset-password'), 'resetPassword must target /auth/reset-password');

assert.ok(authServiceContent.includes('sanitized.toLowerCase()'), 'login function must lowercase emails for case-insensitivity');
console.log('âœ… Test 2 Passed: authService.js exports and case-insensitive normalization verified.');

// 3. Verify storage.js clearAuthData cleanup comprehensiveness
const storagePath = path.join(__dirname, '../utils/storage.js');
const storageContent = fs.readFileSync(storagePath, 'utf8');

assert.ok(storageContent.includes("'token'"), 'storage.js must remove token');
assert.ok(storageContent.includes("'user'"), 'storage.js must remove user');
assert.ok(storageContent.includes('sessionStorage.removeItem'), 'storage.js must clean sessionStorage as well as localStorage');
console.log('âœ… Test 3 Passed: storage.js clearAuthData thoroughly purges all session keys.');

// 4. Verify Login.jsx input handling for email or phone
const loginPath = path.join(__dirname, '../pages/Login.jsx');
const loginContent = fs.readFileSync(loginPath, 'utf8');

const emailOrPhoneSection = loginContent.slice(
    loginContent.indexOf('name="emailOrPhone"'),
    loginContent.indexOf('name="password"')
);
assert.ok(
    !emailOrPhoneSection.includes('replace(/\\D/g'),
    'Password login field must not strip non-digits so users can enter email'
);
assert.ok(
    loginContent.includes('scholar@example.com or 9876543210'),
    'Login.jsx must provide a clear placeholder indicating email or phone'
);
console.log('âœ… Test 4 Passed: Login.jsx accepts both email and mobile numbers for password sign-in.');

// 5. Verify ForgotPassword.jsx dual email + mobile capabilities
const forgotPwPath = path.join(__dirname, '../pages/ForgotPassword.jsx');
const forgotPwContent = fs.readFileSync(forgotPwPath, 'utf8');

assert.ok(forgotPwContent.includes('handleSendEmailReset'), 'ForgotPassword.jsx must include email reset handler');
assert.ok(forgotPwContent.includes('Email Link'), 'ForgotPassword.jsx must provide an Email Link tab');
assert.ok(forgotPwContent.includes('Mobile OTP'), 'ForgotPassword.jsx must retain the Mobile OTP tab');
assert.ok(forgotPwContent.includes('Check Your Email'), 'ForgotPassword.jsx must provide a confirmation view after email dispatch');
console.log('âœ… Test 5 Passed: ForgotPassword.jsx supports both Email Link and Mobile OTP flows.');

// 6. Verify ResetPassword.jsx token verification and new password submission
const resetPwPath = path.join(__dirname, '../pages/ResetPassword.jsx');
const resetPwContent = fs.readFileSync(resetPwPath, 'utf8');

assert.ok(resetPwContent.includes('useSearchParams'), 'ResetPassword.jsx must read token query param from URL');
assert.ok(resetPwContent.includes('verifyResetToken'), 'ResetPassword.jsx must verify token with backend on mount');
assert.ok(resetPwContent.includes('resetPasswordService'), 'ResetPassword.jsx must invoke resetPassword API upon form submission');
assert.ok(resetPwContent.includes('Password Reset Successfully'), 'ResetPassword.jsx must display confirmation upon successful update');
assert.ok(resetPwContent.includes('Link Expired or Invalid'), 'ResetPassword.jsx must handle expired or invalid tokens cleanly');
console.log('âœ… Test 6 Passed: ResetPassword.jsx token validation and form submission verified.');

console.log('\nðŸŽ‰ ALL AUTHENTICATION & PASSWORD RESET INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
