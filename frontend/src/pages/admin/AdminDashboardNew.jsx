import React, { useState, useEffect } from 'react';
import {
    FileText,
    MapPin,
    Upload,
    TrendingUp,
    Users,
    Download,
    AlertCircle
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { indianStates } from '../../data/states';
import { unionTerritories } from '../../data/unionTerritories';

/**
 * AdminDashboardNew Component
 * Enhanced admin dashboard with analytics and quick actions
 */
const AdminDashboardNew = () => {
    const [stats, setStats] = useState({
        totalRegions: 36,
        totalPDFs: 0,
        totalDownloads: 0,
        activeUsers: 0
    });

    // Calculate stats from data
    useEffect(() => {
        const totalNotes = [...indianStates, ...unionTerritories].reduce(
            (sum, item) => sum + item.notesCount, 0
        );
        const totalQuestions = [...indianStates, ...unionTerritories].reduce(
            (sum, item) => sum + item.questionsCount, 0
        );
        const totalSolutions = [...indianStates, ...unionTerritories].reduce(
            (sum, item) => sum + item.solutionsCount, 0
        );

        setStats({
            totalRegions: 36,
            totalPDFs: totalNotes + totalQuestions + totalSolutions,
            totalDownloads: Math.floor(Math.random() * 50000) + 10000,
            activeUsers: Math.floor(Math.random() * 5000) + 1000
        });
    }, []);

    const quickActions = [
        {
            icon: Upload,
            label: 'Upload New PDF',
            description: 'Add study materials',
            color: 'saffron',
            path: '/admin/upload'
        },
        {
            icon: FileText,
            label: 'Manage PDFs',
            description: 'View all content',
            color: 'navy',
            path: '/admin/pdf-manager'
        },
        {
            icon: MapPin,
            label: 'States & UTs',
            description: 'Regional settings',
            color: 'green',
            path: '/admin/states-uts'
        },
        {
            icon: Users,
            label: 'User Analytics',
            description: 'View user data',
            color: 'navy',
            path: '/admin/users'
        }
    ];

    const recentActivity = [
        { action: 'PDF Uploaded', item: 'Indian Constitution Notes.pdf', region: 'Maharashtra', time: '2 hours ago' },
        { action: 'PDF Updated', item: 'History Question Bank.pdf', region: 'Uttar Pradesh', time: '5 hours ago' },
        { action: 'PDF Deleted', item: 'Old Geography Notes.pdf', region: 'Delhi', time: '1 day ago' }
    ];

    return (
        <div className="admin-layout">
            <AdminSidebar />

            <main className="admin-content">
                {/* Header */}
                <div className="admin-header">
                    <div>
                        <h1 className="admin-title">Admin Dashboard</h1>
                        <p className="admin-subtitle">Welcome back! Here's what's happening.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="stat-card saffron">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="stat-label">Total Regions</p>
                                <h3 className="stat-value">{stats.totalRegions}</h3>
                                <p className="stat-change">28 States + 8 UTs</p>
                            </div>
                            <MapPin className="stat-icon" />
                        </div>
                    </div>

                    <div className="stat-card navy">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="stat-label">Total PDFs</p>
                                <h3 className="stat-value">{stats.totalPDFs.toLocaleString()}</h3>
                                <p className="stat-change">
                                    <TrendingUp className="inline w-4 h-4 mr-1" />
                                    +12% this month
                                </p>
                            </div>
                            <FileText className="stat-icon" />
                        </div>
                    </div>

                    <div className="stat-card green">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="stat-label">Total Downloads</p>
                                <h3 className="stat-value">{stats.totalDownloads.toLocaleString()}</h3>
                                <p className="stat-change">
                                    <TrendingUp className="inline w-4 h-4 mr-1" />
                                    +8% this week
                                </p>
                            </div>
                            <Download className="stat-icon" />
                        </div>
                    </div>

                    <div className="stat-card navy">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="stat-label">Active Users</p>
                                <h3 className="stat-value">{stats.activeUsers.toLocaleString()}</h3>
                                <p className="stat-change">
                                    <TrendingUp className="inline w-4 h-4 mr-1" />
                                    +15% this week
                                </p>
                            </div>
                            <Users className="stat-icon" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <a
                                    key={index}
                                    href={action.path}
                                    className={`quick-action-card ${action.color}`}
                                >
                                    <Icon className="w-8 h-8 mb-3" />
                                    <h3 className="font-bold text-lg mb-1">{action.label}</h3>
                                    <p className="text-sm opacity-75">{action.description}</p>
                                </a>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
                            Recent Activity
                        </h2>
                        <a href="/admin/pdf-manager" className="text-sm font-semibold text-[var(--saffron)] hover:underline">
                            View All →
                        </a>
                    </div>

                    <div className="space-y-4">
                        {recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.action.includes('Uploaded') ? 'bg-green-100 text-green-600' :
                                        activity.action.includes('Updated') ? 'bg-blue-100 text-blue-600' :
                                            'bg-red-100 text-red-600'
                                    }`}>
                                    {activity.action.includes('Uploaded') ? <Upload className="w-5 h-5" /> :
                                        activity.action.includes('Updated') ? <FileText className="w-5 h-5" /> :
                                            <AlertCircle className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{activity.action}</p>
                                    <p className="text-sm text-gray-600">{activity.item}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {activity.region} • {activity.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboardNew;
