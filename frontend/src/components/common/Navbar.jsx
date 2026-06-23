import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiUser, FiLogOut, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { BookOpen, MapPin, LayoutDashboard, ShoppingCart, Receipt, Heart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import Logo from './Logo';

const navLinks = [
    { path: '/state', label: 'States & UTs', icon: MapPin, public: true },
    { path: '/courses',       label: 'Courses',       icon: BookOpen, public: true },
    { path: '/blog',          label: 'Blog',          icon: null, public: true },
];

const aboutLinks = [
    { path: '/about',          label: 'About BodhGanga' },
    { path: '/ndde',           label: 'About NDDE' },
    { path: '/founder',        label: 'Founder & CEO' },
    { path: '/mission-vision', label: 'Mission & Vision' },
];

const Navbar = () => {
    const { isAuthenticated, user, logout, openAuthModal } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [aboutMenuOpen, setAboutMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const aboutMenuRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
        setUserMenuOpen(false);
        setAboutMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
            if (aboutMenuRef.current && !aboutMenuRef.current.contains(e.target)) setAboutMenuOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const isActive = (path) => {
        if (path.includes('#')) return location.pathname === '/' && location.hash === path.substring(path.indexOf('#'));
        return location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));
    };

    const handleLinkClick = (e, path) => {
        const protectedRoutes = ['/free-resources', '/courses', '/cart', '/library', '/dashboard', '/profile', '/orders'];
        if (protectedRoutes.some(r => path.startsWith(r)) && !isAuthenticated) {
            e.preventDefault();
            openAuthModal('welcome');
        }
    };

    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-emerald-dark/95 backdrop-blur-xl border-b border-gold/15 shadow-2xl' : 'bg-emerald-dark border-b border-gold/5'}`}>
            <div className="h-1 bg-gradient-to-r from-emerald via-gold to-emerald" />
            <nav className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-24">

                    {/* Logo */}
                    <Link to="/" className="flex items-center group flex-shrink-0 transition-all duration-300 hover:opacity-95">
                        <div className="hidden sm:block"><Logo variant="navbar" size="md" showGlow={true} /></div>
                        <div className="block sm:hidden"><Logo variant="navbar" size="sm" showGlow={true} /></div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-2 overflow-hidden">
                        {navLinks.map(link => (
                            <Link key={link.path} to={link.path}
                                onClick={(e) => handleLinkClick(e, link.path)}
                                className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-xl ${isActive(link.path) ? 'text-gold bg-white/5 border border-gold/20' : 'text-white/80 hover:text-gold hover:bg-white/5 border border-transparent'}`}>
                                {link.label}
                                {isActive(link.path) && <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />}
                            </Link>
                        ))}

                        {/* About Dropdown */}
                        <div className="relative" ref={aboutMenuRef}>
                            <button onClick={() => setAboutMenuOpen(p => !p)}
                                className={`flex items-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-xl ${aboutLinks.some(l => isActive(l.path)) ? 'text-gold bg-white/5 border border-gold/20' : 'text-white/80 hover:text-gold hover:bg-white/5 border border-transparent'}`}>
                                <span>About</span>
                                <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${aboutMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {aboutMenuOpen && (
                                <div className="absolute left-0 mt-3 w-56 bg-emerald-dark/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gold/20 py-2 z-50">
                                    {aboutLinks.map(item => (
                                        <Link key={item.path} to={item.path}
                                            className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isActive(item.path) ? 'text-gold bg-white/5' : 'text-white/80 hover:bg-white/5 hover:text-gold'}`}>
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {isAuthenticated && (
                            <Link to="/dashboard"
                                className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-xl ${isActive('/dashboard') ? 'text-gold bg-white/5 border border-gold/20' : 'text-white/80 hover:text-gold hover:bg-white/5 border border-transparent'}`}>
                                Dashboard
                            </Link>
                        )}
                    </div>
                    <Link to="/state" onClick={() => setMobileOpen(false)}
    className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-gold to-gold-dark text-emerald-dark">
    Explore Now
</Link>

                    {/* Right Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/cart" onClick={(e) => handleLinkClick(e, '/cart')}
                            className="relative p-2.5 text-white/70 hover:text-gold hover:bg-white/5 rounded-xl border border-transparent hover:border-gold/15 transition-all duration-300">
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-emerald-950 text-[10px] font-black rounded-full flex items-center justify-center">{cartCount > 9 ? '9+' : cartCount}</span>}
                        </Link>

                        {isAuthenticated ? (
                            <div className="relative" ref={userMenuRef}>
                                <button onClick={() => setUserMenuOpen(p => !p)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-gold/10 hover:border-gold/30 transition-all duration-300">
                                    <div className="w-8 h-8 bg-gradient-to-br from-gold to-gold-dark rounded-lg flex items-center justify-center shadow-md">
                                        <FiUser className="w-4 h-4 text-emerald-dark" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-white leading-tight">{user?.name?.split(' ')[0] || 'Scholar'}</div>
                                        <div className="text-[10px] text-gold/60 font-semibold tracking-wider uppercase mt-0.5">{user?.role === 'ADMIN' ? 'Admin' : 'Student'}</div>
                                    </div>
                                    <FiChevronDown className={`w-4 h-4 text-gold/60 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-3.5 w-56 bg-emerald-dark/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gold/20 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gold/10">
                                            <div className="text-sm font-bold text-white">{user?.name}</div>
                                            <div className="text-xs text-gold/60 truncate mt-0.5">{user?.email}</div>
                                        </div>
                                        <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 hover:text-gold transition-colors">
                                            <FiUser className="w-4 h-4" /> My Profile
                                        </Link>
                                        <Link to="/library" className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 hover:text-gold transition-colors">
                                            <BookOpen className="w-4 h-4" /> My Library
                                        </Link>
                                        <Link to="/wishlist" className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 hover:text-gold transition-colors">
                                            <Heart className="w-4 h-4" /> My Wishlist
                                        </Link>
                                        <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 hover:text-gold transition-colors">
                                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                                        </Link>
                                        <Link to="/orders" className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 hover:text-gold transition-colors">
                                            <Receipt className="w-4 h-4" /> My Orders
                                        </Link>
                                        {user?.role === 'ADMIN' && (
                                            <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-colors">
                                                <LayoutDashboard className="w-4 h-4" /> Admin Panel
                                            </Link>
                                        )}
                                        <div className="border-t border-gold/10 mt-1 pt-1">
                                            <button onClick={handleLogout}
                                                className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-colors">
                                                <FiLogOut className="w-4 h-4" /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/80 hover:text-gold transition-colors">Sign In</Link>
                                <Link to="/register" className="px-5 py-3 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-gold/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-300">Get Started</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <div className="flex md:hidden items-center gap-2">
                        <Link to="/cart" onClick={(e) => handleLinkClick(e, '/cart')}
                            className="relative p-2.5 text-white/70 hover:text-gold hover:bg-white/5 rounded-xl border border-transparent hover:border-gold/15 transition-all duration-300">
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-emerald-950 text-[10px] font-black rounded-full flex items-center justify-center">{cartCount > 9 ? '9+' : cartCount}</span>}
                        </Link>
                        <button onClick={() => setMobileOpen(p => !p)}
                            className="p-2 text-white/80 hover:text-gold hover:bg-white/5 rounded-xl transition-all duration-300 border border-transparent hover:border-gold/15">
                            {mobileOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden bg-emerald-dark border-t border-gold/15 shadow-2xl">
                    <div className="container-custom py-5 space-y-2">
                        {navLinks.map(link => (
                            <Link key={link.path} to={link.path}
                                onClick={(e) => { handleLinkClick(e, link.path); setMobileOpen(false); }}
                                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isActive(link.path) ? 'bg-white/5 text-gold border border-gold/10' : 'text-white/80 hover:bg-white/5 border border-transparent'}`}>
                                {link.icon && <link.icon className="w-4 h-4" />}
                                {link.label}
                            </Link>
                        ))}
                        {isAuthenticated && (
                            <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 border border-transparent">
                                <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </Link>
                        )}
                        <div className="border-t border-gold/15 pt-3 mt-3">
                            <div className="px-4 py-1 text-[10px] text-gold/60 font-black uppercase tracking-widest">About Academy</div>
                            {aboutLinks.map(item => (
                                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isActive(item.path) ? 'bg-white/5 text-gold border border-gold/10' : 'text-white/80 hover:bg-white/5 border border-transparent'}`}>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                        <div className="border-t border-gold/10 pt-4 mt-4">
                            {isAuthenticated ? (
                                <>
                                    <div className="px-4 py-2 text-[10px] text-gold/60 font-bold uppercase tracking-widest">{user?.name} · {user?.role}</div>
                                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 border border-transparent">
                                        <FiUser className="w-4 h-4" /> My Profile
                                    </Link>
                                    <Link to="/library" onClick={() => setMobileOpen(false)} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 border border-transparent">
                                        <BookOpen className="w-4 h-4" /> My Library
                                    </Link>
<Link to="/wishlist" onClick={() => setMobileOpen(false)} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 border border-transparent">
    <Heart className="w-4 h-4" /> My Wishlist
</Link>
                                    <Link to="/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 border border-transparent">
                                        <Receipt className="w-4 h-4" /> My Orders
                                    </Link>
                                    {user?.role === 'ADMIN' && (
                                        <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 border border-transparent">
                                            <LayoutDashboard className="w-4 h-4" /> Admin Panel
                                        </Link>
                                    )}
                                    <button onClick={handleLogout}
                                        className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 border border-transparent">
                                        <FiLogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-3 px-2">
                                    <Link to="/login" className="text-center py-3 text-xs font-bold uppercase tracking-wider text-white hover:text-gold">Sign In</Link>
                                    <Link to="/register" className="text-center py-4 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg">Get Started  Free</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;



