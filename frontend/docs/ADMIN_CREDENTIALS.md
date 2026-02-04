# Admin Dashboard Credentials

## Access Information

**Admin Login URL**: `http://localhost:3001/admin/login`

**Credentials**:
- **Username**: `admin`
- **Password**: `BodhGanga@2024`

## Features

### Secure Frontend Authentication
- Session-based authentication (24-hour expiry)
- Automatic session extension on activity
- Secure logout functionality
- Protected routes

### Dashboard Features
- **Dashboard Tab**: Overview with stats and recent activity
- **Content Tab**: Manage courses and content
- **Users Tab**: User management with search and filtering
- **Settings Tab**: Platform configuration

### Security Features
- Hardcoded credentials for demo purposes
- Session timeout protection
- Admin-only access to dashboard routes
- Separate admin interface (no regular navbar/footer)

## Usage Instructions

1. Navigate to `http://localhost:3001/admin/login`
2. Enter the credentials above
3. Access the full-featured admin dashboard
4. Use the tabs to navigate between different management sections

## Session Management
- Sessions last 24 hours
- Automatic extension on dashboard access
- Manual logout available in header
- Expired sessions redirect to login

## Mock Data
The dashboard includes realistic mock data for:
- Content statistics
- User management
- Revenue tracking
- Recent activity logs