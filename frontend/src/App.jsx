import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SpaceThemeProvider } from './context/SpaceThemeContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Loader from './components/common/Loader';
import ErrorBoundary from './components/common/ErrorBoundary';
import { isAdminAuthenticated } from './utils/adminAuth';
import AuthGateModal from './components/common/AuthGateModal';
// Auto-run backend health check on app load
import './utils/healthCheck';

// Lazy loaded Pages
const Landing = lazy(() => import('./pages/Landing'));
const Register = lazy(() => import('./pages/Register'));
const VerifyMobileOtp = lazy(() => import('./pages/VerifyMobileOtp'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const CoursePlayer = lazy(() => import('./pages/CoursePlayer'));
const Profile = lazy(() => import('./pages/Profile'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const States = lazy(() => import('./pages/States'));
const UnionTerritories = lazy(() => import('./pages/UnionTerritories'));
const StateDetail = lazy(() => import('./pages/StateDetail'));
const QuestionBank = lazy(() => import('./pages/QuestionBank'));
const Subjects = lazy(() => import('./pages/Subjects'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ErrorPage = lazy(() => import('./pages/Error'));
const About = lazy(() => import('./pages/About'));
const Ndde = lazy(() => import('./pages/Ndde'));
const Founder = lazy(() => import('./pages/Founder'));
const MissionVision = lazy(() => import('./pages/MissionVision'));
const AboutIndia = lazy(() => import('./pages/AboutIndia'));
const Cart = lazy(() => import('./pages/Cart'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Library = lazy(() => import('./pages/Library'));
const FreeResources = lazy(() => import('./pages/FreeResources'));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/Dashboard'));
const AdminStates = lazy(() => import('./pages/admin/AdminStates'));
const AdminBlogs = lazy(() => import('./pages/admin/AdminBlogs'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const AdminMarketplace = lazy(() => import('./pages/admin/AdminMarketplace'));
const AdminPDFManager = lazy(() => import('./pages/admin/AdminPDFManager'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
        },
    },
});

function App() {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    const isAdminLoggedIn = isAdminAuthenticated();

    return (
        <QueryClientProvider client={queryClient}>
            <SpaceThemeProvider>
                <AuthProvider>
                    <CartProvider>
                    <Router>
                        <div className="min-h-screen flex flex-col">
                            {/* Only show regular navbar for non-admin routes or when admin is not logged in */}
                            {(!isAdminRoute || (isAdminRoute && !isAdminLoggedIn)) && <Navbar />}
                            <AuthGateModal />

                            <main className="flex-grow">
                                <ErrorBoundary>
                                    <Suspense fallback={<Loader fullScreen />}>
                                        <Routes>
                                            {/* Public Routes */}
                                            <Route path="/" element={<Landing />} />
                                            <Route path="/about" element={<About />} />
                                            <Route path="/ndde" element={<Ndde />} />
                                            <Route path="/founder" element={<Founder />} />
                                            <Route path="/mission-vision" element={<MissionVision />} />
                                            <Route path="/about-india" element={<AboutIndia />} />
                                            <Route path="/states" element={<ProtectedRoute><States /></ProtectedRoute>} />
                                            <Route path="/union-territories" element={<ProtectedRoute><UnionTerritories /></ProtectedRoute>} />
                                            <Route path="/states/:id" element={<ProtectedRoute><StateDetail /></ProtectedRoute>} />
                                            <Route path="/union-territories/:id" element={<ProtectedRoute><StateDetail /></ProtectedRoute>} />
                                            <Route path="/question-bank" element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
                                            <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
                                            <Route path="/store" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                                            <Route path="/store/state/:slug" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                                            <Route path="/blog" element={<Blog />} />
                                            <Route path="/blog/:slug" element={<BlogPost />} />
                                            <Route path="/register" element={<Register />} />
                                            <Route path="/verify-mobile-otp" element={<VerifyMobileOtp />} />
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/forgot-password" element={<ForgotPassword />} />
                                            <Route path="/error" element={<ErrorPage />} />
                                            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                                            <Route path="/orders" element={
                                                <ProtectedRoute><OrderHistory /></ProtectedRoute>
                                            } />
                                            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
                                            <Route path="/free-resources" element={<ProtectedRoute><FreeResources /></ProtectedRoute>} />
                                            <Route path="/checkout" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
                                            <Route path="/payment" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />

                                            {/* Admin Routes */}
                                            <Route path="/admin/login" element={<AdminLogin />} />
                                            <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                                                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                                                <Route path="dashboard" element={<AdminDashboardPage />} />
                                                <Route path="states" element={<AdminStates />} />
                                                <Route path="blogs" element={<AdminBlogs />} />
                                                <Route path="content" element={<AdminPDFManager />} />
                                                <Route path="content-marketplace" element={<AdminMarketplace />} />
                                                <Route path="pdf-manager" element={<AdminPDFManager />} />
                                                <Route path="orders" element={<AdminOrders />} />
                                            </Route>

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
                                    </Suspense>
                                </ErrorBoundary>
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
                    </CartProvider>
                </AuthProvider>
            </SpaceThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
