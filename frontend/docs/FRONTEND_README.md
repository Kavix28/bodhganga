# Gangabhodh Learning Platform - Frontend

A modern, responsive React frontend for the Gangabhodh learning platform, featuring course browsing, secure payments, and content delivery.

## 🚀 Features

### User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Authentication Flow**: Register, OTP verification, and secure login
- **Course Catalog**: Browse, search, and filter available courses
- **Payment Integration**: Seamless Stripe checkout experience
- **Content Player**: PDF viewer and YouTube video integration
- **Progress Tracking**: Course completion and learning analytics
- **User Dashboard**: Personalized learning dashboard

### Admin Features
- **Content Management**: Create, edit, and manage courses
- **User Analytics**: View user statistics and engagement
- **Payment Tracking**: Monitor transactions and revenue
- **Admin Dashboard**: Comprehensive management interface

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks and context
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication
- **React Hot Toast** - Beautiful toast notifications
- **React Icons** - Comprehensive icon library

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Backend API running on port 9090

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
# Create environment file
cp .env.example .env.local

# Edit .env.local with your configuration
VITE_API_BASE_URL=http://localhost:9090/api
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

### 4. Build for Production
```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── common/              # Reusable components
│   │   ├── Navbar.jsx       # Navigation component
│   │   ├── Footer.jsx       # Footer component
│   │   ├── Loader.jsx       # Loading spinner
│   │   ├── ProtectedRoute.jsx # Route protection
│   │   └── AdminRoute.jsx   # Admin route protection
│   └── admin/               # Admin-specific components
├── pages/
│   ├── Landing.jsx          # Landing page
│   ├── Register.jsx         # User registration
│   ├── VerifyOTP.jsx        # OTP verification
│   ├── Login.jsx            # User login
│   ├── Dashboard.jsx        # User dashboard
│   ├── Courses.jsx          # Course catalog
│   ├── CourseDetail.jsx     # Course details
│   ├── CoursePlayer.jsx     # Content player
│   ├── Profile.jsx          # User profile
│   └── admin/
│       ├── AdminLogin.jsx   # Admin login
│       └── AdminDashboard.jsx # Admin dashboard
├── context/
│   └── AuthContext.jsx      # Authentication context
├── hooks/
│   └── useAuth.js           # Authentication hook
├── services/
│   └── api.js               # API service layer
├── utils/
│   ├── constants.js         # App constants
│   ├── storage.js           # Local storage utilities
│   └── validators.js        # Form validation
└── styles/
    └── index.css            # Global styles and Tailwind
```

## 🔐 Authentication System

### User Flow
1. **Registration**: Email/phone + password + name
2. **OTP Verification**: 6-digit code sent via email/SMS
3. **Login**: JWT token-based authentication
4. **Protected Routes**: Automatic redirection for unauthenticated users

### Admin Flow
1. **Admin Login**: Separate admin login interface
2. **Role Verification**: Backend validates admin role
3. **Admin Dashboard**: Access to management features

### Implementation
```javascript
// AuthContext provides global authentication state
const { user, isAuthenticated, login, logout } = useAuth();

// Protected routes check authentication
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Admin routes check admin role
<AdminRoute>
  <AdminDashboard />
</AdminRoute>
```

## 💳 Payment Integration

### Stripe Checkout Flow
1. **Course Selection**: User selects course to purchase
2. **Payment Session**: Frontend creates Stripe checkout session
3. **Redirect**: User redirected to Stripe checkout
4. **Webhook Processing**: Backend processes payment confirmation
5. **Content Unlock**: User gains access to purchased content

### Implementation
```javascript
const handlePurchase = async () => {
  const response = await api.post('/payment/create-session', {
    contentId: course.id
  });
  
  // Redirect to Stripe checkout
  window.location.href = response.data.checkoutUrl;
};
```

## 📱 Responsive Design

### Breakpoints (Tailwind CSS)
- **sm**: 640px and up
- **md**: 768px and up
- **lg**: 1024px and up
- **xl**: 1280px and up

### Mobile-First Approach
```css
/* Mobile styles by default */
.card { @apply p-4; }

/* Tablet and up */
@screen md {
  .card { @apply p-6; }
}

/* Desktop and up */
@screen lg {
  .card { @apply p-8; }
}
```

## 🎨 Design System

### Color Palette
```javascript
// Primary colors (Blue)
primary: {
  50: '#eff6ff',
  100: '#dbeafe',
  // ... through 900
  600: '#2563eb', // Main primary
}

// Secondary colors (Purple)
secondary: {
  50: '#faf5ff',
  // ... through 900
  600: '#9333ea', // Main secondary
}
```

### Component Classes
```css
/* Buttons */
.btn-primary { @apply bg-primary-600 text-white hover:bg-primary-700; }
.btn-secondary { @apply bg-white text-primary-600 border-primary-600; }

/* Cards */
.card { @apply bg-white rounded-lg shadow-md p-6; }
.card-hover { @apply card hover:shadow-lg hover:-translate-y-1; }

/* Inputs */
.input { @apply w-full px-4 py-2 border rounded-lg focus:ring-2; }
```

## 🔧 API Integration

### Service Layer
```javascript
// api.js - Centralized API configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Request interceptor - Add JWT token
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthData();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Error Handling
```javascript
try {
  const response = await api.get('/content');
  setContent(response.data);
} catch (error) {
  if (error.networkError) {
    toast.error('Network error. Please check your connection.');
  } else {
    toast.error(error.message || 'Something went wrong');
  }
}
```

## 📊 State Management

### Authentication Context
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const login = (token, userData) => {
    setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
    setAuthToken(token);
    setUserData(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    clearAuthData();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Local Storage Management
```javascript
// Storage utilities
export const setAuthToken = (token) => {
  localStorage.setItem('auth_token', JSON.stringify(token));
};

export const getAuthToken = () => {
  try {
    return JSON.parse(localStorage.getItem('auth_token'));
  } catch {
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
};
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure
```javascript
// Example test
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import Login from '../pages/Login';

test('renders login form', () => {
  render(
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
  
  expect(screen.getByLabelText(/email or phone/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
```

## 🚀 Deployment

### Build for Production
```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Environment Variables
```bash
# .env.local
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
```nginx
server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  # Handle client-side routing
  location / {
    try_files $uri $uri/ /index.html;
  }

  # API proxy
  location /api {
    proxy_pass http://backend:9090;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## 🔍 Performance Optimization

### Code Splitting
```javascript
// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Courses = lazy(() => import('./pages/Courses'));

// Wrap in Suspense
<Suspense fallback={<Loader />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/courses" element={<Courses />} />
  </Routes>
</Suspense>
```

### Image Optimization
```javascript
// Lazy loading images
<img 
  src={course.thumbnail} 
  alt={course.title}
  loading="lazy"
  className="w-full h-48 object-cover"
/>
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

## 🐛 Debugging

### Development Tools
```javascript
// React Developer Tools
// Redux DevTools (if using Redux)
// Network tab for API calls
// Console for error messages

// Debug API calls
console.log('API Request:', config);
console.log('API Response:', response);
console.log('API Error:', error);
```

### Common Issues
1. **CORS Errors**: Ensure backend CORS configuration includes frontend URL
2. **Authentication Issues**: Check JWT token expiration and storage
3. **Route Protection**: Verify ProtectedRoute and AdminRoute components
4. **API Errors**: Check network tab and backend logs

## 📝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit with conventional commits: `git commit -m "feat: add new feature"`
5. Push and create pull request

### Code Style
```bash
# ESLint for code linting
npm run lint

# Prettier for code formatting
npm run format

# Pre-commit hooks with Husky
npm run prepare
```

### Component Guidelines
```javascript
// Use functional components with hooks
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return (
    <div className="component-styles">
      {/* JSX content */}
    </div>
  );
};

export default MyComponent;
```

## 📚 Resources

### Documentation
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)

### Tools
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For frontend-specific issues:
1. Check browser console for JavaScript errors
2. Verify API connectivity and responses
3. Test authentication flow and token storage
4. Review component props and state management

---

Built with ❤️ using React and modern web technologies