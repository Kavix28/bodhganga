import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { MapPin, Building } from 'lucide-react';
import { useState } from 'react';
import { useSpaceTheme } from '../../context/SpaceThemeContext';


const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { spaceTheme, changeTheme, themes } = useSpaceTheme();
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);


    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const isActivePath = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const navLinks = [
        { path: '/states', label: 'States', public: true, icon: MapPin },
        { path: '/union-territories', label: 'Union Territories', public: true, icon: Building },
        ...(isAuthenticated ? [
            { path: '/dashboard', label: 'Dashboard', public: false },
            { path: '/profile', label: 'Profile', public: false, adminHidden: true },
        ] : [])
    ];

    return (
        <nav className="bg-white/95 backdrop-blur-xl shadow-md sticky top-0 z-50 transition-all duration-300 tricolor-accent">
            <div className="container-custom">
                <div className="flex items-center justify-between h-20">
                    {/* Logo - BodhGanga Academy */}
                    <Link to="/" className="flex items-center gap-3 group" onClick={closeMobileMenu}>
                        <div className="relative w-12 h-12 bg-gradient-to-br from-[var(--saffron)] to-[var(--saffron-dark)] rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:scale-110">
                            <MapPin className="w-6 h-6 text-white" />
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--saffron)] to-[var(--green)] opacity-0 group-hover:opacity-50 rounded-2xl blur transition-opacity duration-300"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black tracking-tight" style={{ color: 'var(--navy)' }}>BodhGanga</span>
                            <span className="text-xs font-bold -mt-1" style={{ color: 'var(--saffron)' }}>Government Exam Academy</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {/* Navigation Links */}
                        <div className="flex items-center gap-6">
                            {navLinks.map((link) => {
                                if (link.adminHidden && user?.role === 'ADMIN') return null;

                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`relative text-base font-semibold transition-all duration-200 group ${isActivePath(link.path)
                                            ? 'text-indigo-600'
                                            : 'text-slate-700 hover:text-indigo-600'
                                            }`}
                                    >
                                        {link.label}
                                        {isActivePath(link.path) && (
                                            <div className="absolute -bottom-8 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full slide-in-right"></div>
                                        )}
                                        {!isActivePath(link.path) && (
                                            <div className="absolute -bottom-8 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Space Theme Toggle */}
                        <div className="relative">
                            <button
                                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                                onBlur={() => setTimeout(() => setIsThemeMenuOpen(false), 200)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 border border-slate-300"
                                title="Change Space Theme"
                            >
                                <span className="text-xl">
                                    {themes.find(t => t.id === spaceTheme)?.icon || '✨'}
                                </span>
                                <span className="text-sm font-semibold text-slate-700">
                                    {themes.find(t => t.id === spaceTheme)?.name || 'Theme'}
                                </span>
                            </button>

                            {/* Theme Dropdown */}
                            {isThemeMenuOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 z-50 scale-in">
                                    <div className="p-2">
                                        <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                            Space Themes
                                        </div>
                                        {themes.map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => {
                                                    changeTheme(theme.id);
                                                    setIsThemeMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${spaceTheme === theme.id
                                                    ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700'
                                                    : 'hover:bg-slate-100 text-slate-700'
                                                    }`}
                                            >
                                                <span className="text-2xl">{theme.icon}</span>
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm">{theme.name}</div>
                                                    <div className="text-xs text-slate-500">{theme.description}</div>
                                                </div>
                                                {spaceTheme === theme.id && (
                                                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Auth Section */}
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                {user?.role === 'ADMIN' && (
                                    <Link
                                        to="/admin/dashboard"
                                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                                    >
                                        Admin Panel
                                    </Link>
                                )}

                                {/* User Menu - Futuristic */}
                                <div className="relative group">
                                    <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                                            <FiUser className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-slate-900">
                                                {user?.name || 'User'}
                                            </div>
                                            {user?.role === 'ADMIN' && (
                                                <div className="text-xs font-semibold text-red-600">
                                                    Administrator
                                                </div>
                                            )}
                                        </div>
                                    </button>

                                    {/* Dropdown Menu - Glassmorphism */}
                                    <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transform scale-95 group-hover:scale-100 transition-all duration-200">
                                        <div className="p-2">
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all duration-200"
                                            >
                                                My Profile
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 flex items-center gap-2"
                                            >
                                                <FiLogOut className="w-4 h-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleMobileMenu}
                        className="md:hidden p-3 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                    >
                        {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation - Slide Down */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-6 border-t border-slate-200 bg-white/90 backdrop-blur-xl slide-down">
                        <div className="flex flex-col gap-2">
                            {/* Navigation Links */}
                            {navLinks.map((link) => {
                                if (link.adminHidden && user?.role === 'ADMIN') return null;

                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`px-4 py-3 text-base font-semibold rounded-xl transition-all duration-200 ${isActivePath(link.path)
                                            ? 'text-indigo-600 bg-gradient-to-r from-indigo-50 to-purple-50'
                                            : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                                            }`}
                                        onClick={closeMobileMenu}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}

                            {isAuthenticated ? (
                                <>
                                    {user?.role === 'ADMIN' && (
                                        <Link
                                            to="/admin/dashboard"
                                            className="px-4 py-3 text-base font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200"
                                            onClick={closeMobileMenu}
                                        >
                                            Admin Panel
                                        </Link>
                                    )}

                                    <div className="border-t border-slate-200 mt-4 pt-4">
                                        <div className="px-4 py-2 text-sm text-slate-500 font-semibold">
                                            Signed in as {user?.name || 'User'}
                                            {user?.role === 'ADMIN' && (
                                                <span className="block text-xs text-red-600 font-semibold mt-1">
                                                    Administrator
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 flex items-center gap-2 mt-2"
                                        >
                                            <FiLogOut className="w-5 h-5" />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="border-t border-slate-200 mt-4 pt-4 flex flex-col gap-2">
                                    <Link
                                        to="/login"
                                        className="px-4 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200"
                                        onClick={closeMobileMenu}
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="btn-primary w-full text-center"
                                        onClick={closeMobileMenu}
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
