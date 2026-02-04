# Ganga Bodh - Frontend Only

This is the frontend-only version of the Ganga Bodh project, prepared for integration with a Spring Boot backend.

## 🎯 Overview

This React + Vite application contains all the frontend components, pages, and UI logic for the Ganga Bodh system.

## 📋 Prerequisites

- **Node.js**: v16.x or higher
- **npm** or **pnpm**: Latest version

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# API Base URL - Update this to point to your Spring Boot backend
VITE_API_BASE_URL=http://localhost:8080/api

# Add any other frontend-specific environment variables here
```

### 3. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

The application will start at `http://localhost:5173` (default Vite port)

### 4. Build for Production

```bash
npm run build
# or
pnpm build
```

The production build will be generated in the `dist/` directory.

## 📁 Project Structure

```
Ganga_Bodh_Frontend/
├── src/
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # Application entry point
│   ├── assets/              # Static assets (images, fonts, etc.)
│   ├── components/          # Reusable UI components
│   │   ├── admin/           # Admin-specific components
│   │   ├── common/          # Common/shared components
│   │   └── content/         # Content-related components
│   ├── pages/               # Page components (routes)
│   ├── context/             # React context providers
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API service layers
│   ├── styles/              # Global styles and CSS
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration files
│   └── data/                # Static data or mock data
├── index.html               # HTML entry point
├── package.json             # Node dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
└── .env.example             # Example environment variables
```

## 🔌 Backend Integration

### API Services

All API calls are located in the `src/services/` directory. You'll need to update these service files to match your Spring Boot API endpoints.

**Key Service Files:**

- `src/services/api.js` - Main API configuration
- `src/services/authService.js` - Authentication endpoints
- `src/services/userService.js` - User management endpoints
- (Check the services directory for other API services)

### Expected API Structure

The frontend expects the following API structure (adjust your Spring Boot controllers accordingly):

```
Base URL: http://localhost:8080/api

Authentication:
  POST   /auth/login
  POST   /auth/register
  POST   /auth/logout
  GET    /auth/me

(Add other expected endpoints based on your services)
```

### CORS Configuration

Make sure your Spring Boot backend has CORS enabled to allow requests from the frontend:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173") // Vite dev server
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

## 🛠️ Development Notes

1. **Hot Module Replacement**: Vite provides fast HMR for instant feedback during development
2. **Tailwind CSS**: The project uses Tailwind CSS for styling
3. **React Router**: Navigation is handled through React Router (check `App.jsx` for routes)
4. **State Management**: Check the `context/` directory for global state management

## 📝 Important Files to Review

- **`src/services/*.js`**: Update all API endpoints to match your Spring Boot backend
- **`src/config/*.js`**: Review configuration files for any hardcoded values
- **`.env.example`**: Use this as a template for creating your `.env` file

## 🔒 Authentication

The frontend expects JWT-based authentication (or adjust based on your implementation):

1. User logs in via `/auth/login`
2. Backend returns a JWT token
3. Token is stored (localStorage/sessionStorage)
4. Subsequent requests include token in Authorization header

Review `src/services/authService.js` and `src/context/AuthContext.jsx` for the authentication flow.

## 📦 Dependencies

Key dependencies used in this project:

- **React**: UI library
- **React Router DOM**: Client-side routing
- **Axios**: HTTP client for API calls
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Build tool and dev server

See `package.json` for the complete list of dependencies.

## 🤝 Integration Checklist

- [ ] Update `VITE_API_BASE_URL` in `.env` to point to your Spring Boot backend
- [ ] Review and update all service files in `src/services/`
- [ ] Configure CORS in your Spring Boot application
- [ ] Test authentication flow
- [ ] Test all API endpoints
- [ ] Build and deploy frontend

## 📞 Support

For questions about the frontend architecture or integration, please contact the original development team.

---

**Good luck with your Spring Boot integration!** 🚀
