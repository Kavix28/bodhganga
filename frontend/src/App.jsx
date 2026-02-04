import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SpaceThemeProvider } from './context/SpaceThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import { isAdminAuthenticated } from './utils/adminAuth';

// Pages
import Landing from './pages/Landing';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CoursePlayer from './pages/CoursePlayer';
import Profile from './pages/Profile';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import States from './pages/States';
import UnionTerritories from './pages/UnionTerritories';
import StateDetail from './pages/StateDetail';
import NotFound from './pages/NotFound';
import Error from './pages/Error';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboardPage from './pages/admin/Dashboard';

function App() {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    const isAdminLoggedIn = isAdminAuthenticated();

    return (
        <SpaceThemeProvider>
            <AuthProvider>
                <Router>
                    <div className="min-h-screen flex flex-col">
                        {/* Only show regular navbar for non-admin routes or when admin is not logged in */}
                        {(!isAdminRoute || (isAdminRoute && !isAdminLoggedIn)) && <Navbar />}

                        <main className="flex-grow">
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<Landing />} />
                                <Route path="/states" element={<States />} />
                                <Route path="/union-territories" element={<UnionTerritories />} />
                                <Route path="/states/:stateId" element={<StateDetail />} />
                                <Route path="/union-territories/:stateId" element={<StateDetail />} />
                                <Route path="/blog" element={<Blog />} />
                                <Route path="/blog/:slug" element={<BlogPost />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/verify-otp" element={<VerifyOTP />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/error" element={<Error />} />

                                {/* Admin Routes */}
                                <Route path="/admin/login" element={<AdminLogin />} />
                                <Route
                                    path="/admin/dashboard"
                                    element={
                                        <AdminProtectedRoute>
                                            <AdminDashboardPage />
                                        </AdminProtectedRoute>
                                    }
                                />

                                {/* Protected User Routes */}
                                <Route
                                    path="/dashboard"
                                    element={
                                        <ProtectedRoute>
                                            <Dashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/courses"
                                    element={
                                        <ProtectedRoute>
                                            <Courses />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/courses/:id"
                                    element={
                                        <ProtectedRoute>
                                            <CourseDetail />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/courses/:courseId/player"
                                    element={
                                        <ProtectedRoute>
                                            <CoursePlayer />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/profile"
                                    element={
                                        <ProtectedRoute>
                                            <Profile />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* 404 Route */}
                                <Route path="/404" element={<NotFound />} />
                                <Route path="*" element={<Navigate to="/404" replace />} />
                            </Routes>
                        </main>

                        {/* Only show footer for non-admin routes or when admin is not logged in */}
                        {(!isAdminRoute || (isAdminRoute && !isAdminLoggedIn)) && <Footer />}
                    </div>

                    {/* Toast Notifications */}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#fff',
                                color: '#1f2937',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </Router>
            </AuthProvider>
        </SpaceThemeProvider>
    );
}

export default App;
