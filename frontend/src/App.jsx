import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ScrollToTop from './components/common/ScrollToTop';
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
import './utils/healthCheck';
import ChatWidget from './components/ChatWidget';
import { useAuth } from './hooks/useAuth';

// ── Lazy loaded Pages ────────────────────────────────────────────────────────
const Landing          = lazy(() => import('./pages/Landing'));
const Register         = lazy(() => import('./pages/Register'));
const VerifyMobileOtp  = lazy(() => import('./pages/VerifyMobileOtp'));
const Login            = lazy(() => import('./pages/Login'));
const ForgotPassword   = lazy(() => import('./pages/ForgotPassword'));
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentDiscussion = lazy(() => import('./pages/StudentDiscussion'));
const Courses          = lazy(() => import('./pages/Courses'));
const CourseDetail     = lazy(() => import('./pages/CourseDetail'));
const CoursePlayer     = lazy(() => import('./pages/CoursePlayer'));
const Profile          = lazy(() => import('./pages/Profile'));
const Blog             = lazy(() => import('./pages/Blog'));
const BlogPost         = lazy(() => import('./pages/BlogPost'));
const States           = lazy(() => import('./pages/States'));
const UnionTerritories = lazy(() => import('./pages/UnionTerritories'));
const StateDetail      = lazy(() => import('./pages/StateDetail'));
const ResourcePage     = lazy(() => import('./pages/ResourcePage'));
const QuestionBank     = lazy(() => import('./pages/QuestionBank'));
const Subjects         = lazy(() => import('./pages/Subjects'));
const NotFound         = lazy(() => import('./pages/NotFound'));
const ErrorPage        = lazy(() => import('./pages/Error'));
const About            = lazy(() => import('./pages/About'));
const Ndde             = lazy(() => import('./pages/Ndde'));
const Founder          = lazy(() => import('./pages/Founder'));
const MissionVision    = lazy(() => import('./pages/MissionVision'));
const AboutIndia       = lazy(() => import('./pages/AboutIndia'));
const Cart             = lazy(() => import('./pages/Cart'));
const OrderHistory     = lazy(() => import('./pages/OrderHistory'));
const Library          = lazy(() => import('./pages/Library'));
const FreeResources    = lazy(() => import('./pages/FreeResources'));
const AiCompanionPage  = lazy(() => import('./pages/AiCompanionPage'));
const Wishlist         = lazy(() => import('./pages/Wishlist'));

// Old Store Pages (kept so old /store URLs redirect cleanly)
const StatePage        = lazy(() => import('./pages/StatePage'));
const DistrictPage     = lazy(() => import('./pages/DistrictPage'));
const ResourcesPage    = lazy(() => import('./pages/ResourcesPage'));

// Existing States → Districts → Resources flow (/states-browse)
const StatesPage             = lazy(() => import('./pages/StatesPage'));
const DistrictsPage          = lazy(() => import('./pages/DistrictsPage'));
const DistrictResourcesPage  = lazy(() => import('./pages/DistrictResourcesPage'));

// NEW: All-India states page → districts → products  (/state/...)
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const AllStatesPage              = lazy(() => import('./pages/AllStatesPage'));
const StateDistrictsPage         = lazy(() => import('./pages/StateDistrictsPage'));
const StateDistrictProductsPage  = lazy(() => import('./pages/StateDistrictProductsPage'));

// Admin Pages
const AdminLogin          = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout         = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboardPage  = lazy(() => import('./pages/admin/Dashboard'));
const AdminStates         = lazy(() => import('./pages/admin/AdminStates'));
const AdminBlogs          = lazy(() => import('./pages/admin/AdminBlogs'));
const AdminMarketplace    = lazy(() => import('./pages/admin/AdminMarketplace'));
const AdminPDFManager     = lazy(() => import('./pages/admin/AdminPDFManager'));
const AdminOrders         = lazy(() => import('./pages/admin/AdminOrders'));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
        },
    },
});

function ChatWidgetWrapper() {
    const { isAuthenticated, token } = useAuth();
    return <ChatWidget isLoggedIn={isAuthenticated} token={token} />;
}

function App() {
    const isAdminRoute   = window.location.pathname.startsWith('/admin');
    const isAdminLoggedIn = isAdminAuthenticated();

    return (
        <QueryClientProvider client={queryClient}>
            <SpaceThemeProvider>
                <AuthProvider>
                    <CartProvider>
                    <Router>
      <ScrollToTop />
                        <div className="min-h-screen flex flex-col overflow-x-hidden">
                            {(!isAdminRoute || (isAdminRoute && !isAdminLoggedIn)) && <Navbar />}
                            <AuthGateModal />

                            <main className="flex-grow">
                                <ErrorBoundary>
                                    <Suspense fallback={<Loader fullScreen />}>
                                        <Routes>
                                            {/* ── Public Routes ─────────────────────────────── */}
                                            <Route path="/"               element={<Landing />} />
                                            <Route path="/about"          element={<About />} />
                                            <Route path="/ndde"           element={<Ndde />} />
                                            <Route path="/founder"        element={<Founder />} />
                                            <Route path="/mission-vision" element={<MissionVision />} />
                                            <Route path="/about-india"    element={<AboutIndia />} />
                                            <Route path="/blog"           element={<Blog />} />
                                            <Route path="/blog/:slug"     element={<BlogPost />} />
                                            <Route path="/register"       element={<Register />} />
                                            <Route path="/verify-mobile-otp" element={<VerifyMobileOtp />} />
                                            <Route path="/login"          element={<Login />} />
                                            <Route path="/forgot-password" element={<ForgotPassword />} />
                                            <Route path="/error"          element={<ErrorPage />} />
                                            <Route path="/dev/dashboard"  element={<StudentDashboard />} />
                                            <Route path="/dev/discussion" element={<StudentDiscussion />} />

                                            {/* ── Old states/UTs routes — kept for backward compat ── */}
                                                                                        <Route path="/union-territories" element={<ProtectedRoute><UnionTerritories /></ProtectedRoute>} />
                                            <Route path="/states/:id"     element={<ProtectedRoute><StateDetail /></ProtectedRoute>} />
                                            <Route path="/union-territories/:id" element={<ProtectedRoute><StateDetail /></ProtectedRoute>} />
                                            <Route path="/states/:stateSlug/resources" element={<ProtectedRoute><ResourcePage /></ProtectedRoute>} />
                                            <Route path="/union-territories/:stateSlug/resources" element={<ProtectedRoute><ResourcePage /></ProtectedRoute>} />

                                            {/* ── Existing /states-browse flow ─────────────── */}
                                                                                        <Route path="/states-browse/:stateSlug"                        element={<DistrictsPage />} />
                                            <Route path="/states-browse/:stateSlug/:districtSlug"          element={<DistrictResourcesPage />} />

                                            {/* ── Old store URLs → redirect ──────────────── */}
                                            <Route path="/store"                           element={<Navigate to="/state" replace />} />
                                            <Route path="/store/:stateSlug"                element={<Navigate to="/state" replace />} />
                                            <Route path="/store/:stateSlug/:districtSlug"  element={<Navigate to="/state" replace />} />

                                            {/* ── NEW: All-India States page (/state) ──────── */}
                                            <Route path="/explore" element={<ExplorePage />} />`n                                            <Route path="/state"                                                       element={<AllStatesPage />} />
                                            <Route path="/state/:stateSlug/districts"                                  element={<StateDistrictsPage />} />
                                            <Route path="/state/:stateSlug/district/:districtSlug/products"            element={<StateDistrictProductsPage />} />

                                            {/* ── Protected User Routes ─────────────────────── */}
                                            <Route path="/question-bank"  element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
                                            <Route path="/subjects"       element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
                                            <Route path="/cart"           element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                                            <Route path="/wishlist"       element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                                            <Route path="/orders"         element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
                                            <Route path="/library"        element={<ProtectedRoute><Library /></ProtectedRoute>} />
                                            <Route path="/free-resources" element={<ProtectedRoute><FreeResources /></ProtectedRoute>} />
                                            <Route path="/checkout"       element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
                                            <Route path="/payment"        element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
                                            <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                                            <Route path="/student/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                                            <Route path="/student/discussion" element={<ProtectedRoute><StudentDiscussion /></ProtectedRoute>} />
                                            <Route path="/courses"        element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                                            <Route path="/courses/:id"    element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                                            <Route path="/courses/:courseId/player" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
                                            <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                            <Route path="/ai-companion"   element={<ProtectedRoute><AiCompanionPage /></ProtectedRoute>} />

                                            {/* ── Admin Routes ──────────────────────────────── */}
                                            <Route path="/admin/login" element={<AdminLogin />} />
                                            <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                                                <Route index            element={<Navigate to="/admin/dashboard" replace />} />
                                                <Route path="dashboard" element={<AdminDashboardPage />} />
                                                <Route path="states"    element={<AdminStates />} />
                                                <Route path="blogs"     element={<AdminBlogs />} />
                                                <Route path="content"   element={<AdminPDFManager />} />
                                                <Route path="content-marketplace" element={<AdminMarketplace />} />
                                                <Route path="pdf-manager" element={<AdminPDFManager />} />
                                                <Route path="orders"    element={<AdminOrders />} />
                                            </Route>

                                            {/* ── 404 ───────────────────────────────────────── */}
                                            <Route path="/404" element={<NotFound />} />
                                            <Route path="*"    element={<Navigate to="/404" replace />} />
                                        </Routes>
                                    </Suspense>
                                </ErrorBoundary>
                            </main>

                            {(!isAdminRoute || (isAdminRoute && !isAdminLoggedIn)) && <Footer />}
                        </div>

                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: '#fff',
                                    color: '#1f2937',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                },
                                success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                                error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                            }}
                        />
                    </Router>
                    <ChatWidgetWrapper />
                    </CartProvider>
                </AuthProvider>
            </SpaceThemeProvider>
        </QueryClientProvider>
    );
}

export default App;






