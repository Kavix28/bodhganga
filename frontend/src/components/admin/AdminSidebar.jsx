import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../common/Logo';
import {
    LayoutDashboard,
    Map,
    FileText,
    Upload,
    Users,
    Settings,
    BarChart3
} from 'lucide-react';

/**
 * AdminSidebar Component
 * Navigation sidebar for admin panel
 */
const AdminSidebar = () => {
    const location = useLocation();

    const menuItems = [
        {
            path: '/admin/dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard',
            description: 'Overview & Analytics'
        },
        {
            path: '/admin/states',
            icon: Map,
            label: 'States & UTs',
            description: 'Regional Management'
        },
        {
            path: '/admin/content',
            icon: FileText,
            label: 'PDF Manager',
            description: 'Content Library'
        },
        {
            path: '/admin/upload',
            icon: Upload,
            label: 'Upload Content',
            description: 'Bulk Upload'
        },
        {
            path: '/admin/users',
            icon: Users,
            label: 'Users',
            description: 'User Management'
        },
        {
            path: '/admin/settings',
            icon: Settings,
            label: 'Settings',
            description: 'Configuration'
        }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="admin-sidebar">
            {/* Logo Section */}
            <div className="p-6 border-b border-gray-700">
                <Link to="/" className="flex items-center group transition-all duration-300">
                    <Logo variant="navbar" size="sm" subText="ADMIN PANEL" />
                </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`admin-nav-item ${active ? 'active' : ''}`}
                        >
                            <Icon className="w-5 h-5" />
                            <div className="flex-1">
                                <div className="font-semibold text-sm">{item.label}</div>
                                <div className="text-xs opacity-75">{item.description}</div>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
                <div className="text-xs text-gray-400 text-center">
                    Version 1.0.0
                    <br />
                    © 2024 BodhGanga Academy
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
