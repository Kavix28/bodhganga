import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { logoutAdmin, getAdminSession } from '../utils/adminAuth';
import {
    LayoutDashboard, MapPin, FileText, Package,
    ShoppingBag, LogOut, Menu, X, BookOpen
} from 'lucide-react';
import { useState } from 'react';

import Logo from '../components/common/Logo';

const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/states', icon: MapPin, label: 'States & Content' },
    { to: '/admin/blogs', icon: FileText, label: 'Blog Posts' },
    { to: '/admin/content', icon: BookOpen, label: 'Content Manager' },
    { to: '/admin/content-marketplace', icon: ShoppingBag, label: 'Marketplace' },
];

const AdminLayout = () => {
    const navigate = useNavigate();
    const admin = getAdminSession();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logoutAdmin();
        navigate('/admin/login');
    };

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-emerald-800 text-white flex flex-col shadow-xl`}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-5 border-b border-emerald-700">
                    <Logo className="w-8 h-8" hideText={!sidebarOpen} textClassName="!text-sm" subText="ADMIN PANEL" />
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="ml-auto text-emerald-300 hover:text-white transition-colors"
                    >
                        {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                                    isActive
                                        ? 'bg-gold text-emerald-900'
                                        : 'text-emerald-200 hover:bg-emerald-700 hover:text-white'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User + Logout */}
                <div className="border-t border-emerald-700 p-3">
                    {sidebarOpen && admin && (
                        <div className="mb-3 px-2">
                            <div className="text-xs text-emerald-300">Signed in as</div>
                            <div className="text-sm font-semibold truncate">{admin.name || admin.email}</div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-emerald-200 hover:bg-red-600 hover:text-white transition-all duration-200 text-sm font-medium"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
