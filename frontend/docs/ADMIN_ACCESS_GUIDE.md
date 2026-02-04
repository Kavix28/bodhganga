# 🔐 Admin Access Guide - Gangabhodh Learning Platform

## Quick Start

### Accessing the Admin Panel

1. **Navigate to Admin URL:**
   ```
   http://localhost:3000/admin/dashboard
   ```

2. **Enter Password:**
   - Password: `GangaBhodh@2024`
   - Click "Secure Login"

3. **Access Dashboard:**
   - You'll be redirected to the full admin dashboard
   - Session lasts 24 hours
   - Session extends automatically with activity

---

## Admin Password Gate Details

### Security Features
- **Frontend Protection Layer**: Additional security before admin routes
- **Hashed Password**: Password is stored as hash, not plain text
- **Session Management**: 24-hour sessions with automatic extension
- **Logout Support**: Clear session and return to homepage

### Password Security
- **Current Password**: `GangaBhodh@2024`
- **Storage**: Hashed in `src/config/adminConfig.js`
- **Not visible**: Password never appears in plain text in components

### Changing the Password

To change the admin password:

1. Open `src/config/adminConfig.js`

2. Calculate the hash of your new password:
   ```javascript
   // Run this in browser console
   const simpleHash = (str) => {
       let hash = 0;
       for (let i = 0; i < str.length; i++) {
           const char = str.charCodeAt(i);
           hash = ((hash << 5) - hash) + char;
           hash = hash & hash;
       }
       return hash;
   };
   
   console.log(simpleHash('YourNewPassword'));
   // Copy the result
   ```

3. Replace the `ADMIN_PASSWORD_HASH` constant:
   ```javascript
   const ADMIN_PASSWORD_HASH = YOUR_NEW_HASH_HERE;
   ```

4. Save and restart the development server

---

## Session Management

### Session Duration
- **Default**: 24 hours
- **Auto-extend**: On any admin page access
- **Storage**: sessionStorage (clears on browser close)

### Logout
- Click "Logout" button in admin header
- Redirects to homepage
- Session completely cleared
- Next access requires re-authentication

---

## Admin Dashboard Features

### Available Tabs
1. **Dashboard** - Overview with stats and recent activity
2. **Content** - Manage courses and content
3. **Blog** - Manage blog posts
4. **Users** - User management
5. **Settings** - Platform configuration

### Enhanced UI Features
- **Sticky Header**: Stays visible while scrolling
- **Active Session Indicator**: Pulsing green dot
- **Professional Theme**: Dark accents with red security colors
- **Smooth Animations**: Table rows, buttons, hover states
- **Backdrop Blur**: Modern glassmorphism effect

---

##  Important Notes

### This is Frontend-Only Security
- **Purpose**: Additional protection layer for admin routes
- **Not a replacement**: Backend should still validate admin access
- **Session Storage**: Cleared when browser closes or on logout
- **Browser-specific**: Session doesn't transfer between browsers

### Best Practices
1. **Don't share password**: Keep `GangaBhodh@2024` confidential
2. **Change default**: Update password for production
3. **Backend validation**: Ensure backend also validates admin access
4. **HTTPS in production**: Always use HTTPS for admin pages
5. **Regular logouts**: Log out when finished with admin tasks

---

## Troubleshooting

### Password Not Working
- Ensure you're typing: `GangaBhodh@2024` (case-sensitive)
- Check for extra spaces
- Clear browser cache and try again

### Session Expired
- Session lasts 24 hours
- Clear storage and re-authenticate
- Check browser console for errors

### Can't Access Dashboard
1. Clear sessionStorage: `sessionStorage.clear()`
2. Navigate to `/admin/dashboard`
3. Enter password again

### Logout Not Working
- Manually clear session: `sessionStorage.clear()`
- Refresh the page
- Check browser console for errors

---

## Development Mode

### Running the Application
```bash
npm run dev
```

### Access URLs
- **Main Site**: http://localhost:3000
- **Admin Gate**: http://localhost:3000/admin/dashboard
- **Admin (after auth)**: Full dashboard access

---

## Security Checklist for Production

Before deploying to production:

- [ ] Change default admin password
- [ ] Update password hash in `adminConfig.js`
- [ ] Enable HTTPS
- [ ] Set up backend admin validation
- [ ] Configure proper CORS settings
- [ ] Add rate limiting for admin routes
- [ ] Set up logging for admin access attempts
- [ ] Configure session timeout appropriately
- [ ] Test logout functionality
- [ ] Verify session persistence

---

## Contact & Support

For admin access issues or password reset:
- Contact system administrator
- Check application logs
- Verify backend connectivity

---

**Last Updated:** January 13, 2026  
**Version:** 2.0 UI Enhanced  
**Security Level:** Frontend Protection Layer
