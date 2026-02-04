import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff, FiUsers, FiDollarSign, FiBookOpen, FiLogOut, FiSettings, FiShield, FiActivity, FiFileText } from 'react-icons/fi';
import { clearAdminSession, extendAdminSession } from '../../config/adminConfig';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import UserManagement from './UserManagement';
import BlogManagement from './BlogManagement';

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [contents, setContents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalContents: 12,
        enabledContents: 8,
        totalUsers: 156,
        totalRevenue: 45600
    });

    // Initialize and extend session
    useEffect(() => {
        // Extend session on dashboard access
        extendAdminSession();


        // Mock content data for demo
        setTimeout(() => {
            setContents([
                {
                    id: 1,
                    title: 'Complete React Development Course',
                    description: 'Learn React from basics to advanced concepts with hands-on projects',
                    price: 2999,
                    enabled: true,
                    createdAt: '2024-01-15T10:30:00Z'
                },
                {
                    id: 2,
                    title: 'Node.js Backend Development',
                    description: 'Master backend development with Node.js, Express, and MongoDB',
                    price: 3499,
                    enabled: true,
                    createdAt: '2024-01-10T14:20:00Z'
                },
                {
                    id: 3,
                    title: 'Python Data Science Bootcamp',
                    description: 'Complete data science course with Python, pandas, and machine learning',
                    price: 4999,
                    enabled: false,
                    createdAt: '2024-01-05T09:15:00Z'
                }
            ]);
            setIsLoading(false);
        }, 1000);
    }, []);

    const handleLogout = () => {
        clearAdminSession();
        toast.success('Logged out successfully');
        navigate('/');
    };

    const handleToggleStatus = async (contentId, currentStatus) => {
        try {
            // Mock toggle functionality
            setContents(prev => prev.map(content =>
                content.id === contentId
                    ? { ...content, enabled: !content.enabled }
                    : content
            ));

            // Update stats
            setStats(prev => ({
                ...prev,
                enabledContents: contents.filter(c => c.id === contentId ? !currentStatus : c.enabled).length
            }));

            toast.success(`Content ${!currentStatus ? 'published' : 'unpublished'} successfully`);
        } catch (error) {
            console.error('Error toggling content status:', error);
            toast.error('Failed to update content status');
        }
    };

    const handleDeleteContent = (contentId) => {
        if (window.confirm('Are you sure you want to delete this content?')) {
            setContents(prev => prev.filter(content => content.id !== contentId));
            setStats(prev => ({
                ...prev,
                totalContents: prev.totalContents - 1,
                enabledContents: contents.find(c => c.id === contentId)?.enabled ? prev.enabledContents - 1 : prev.enabledContents
            }));
            toast.success('Content deleted successfully');
        }
    };

    if (isLoading) {
        return <Loader fullScreen />;
    }

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: FiActivity },
        { id: 'content', label: 'Content', icon: FiBookOpen },
        { id: 'blog', label: 'Blog', icon: FiFileText },
        { id: 'users', label: 'Users', icon: FiUsers },
        { id: 'settings', label: 'Settings', icon: FiSettings }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return renderDashboardContent();
            case 'content':
                return renderContentManagement();
            case 'blog':
                return <BlogManagement />;
            case 'users':
                return <UserManagement />;
            case 'settings':
                return renderSettings();
            default:
                return renderDashboardContent();
        }
    };

    const renderDashboardContent = () => (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiBookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalContents}</div>
                    <div className="text-sm text-gray-600">Total Content</div>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiEye className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.enabledContents}</div>
                    <div className="text-sm text-gray-600">Published</div>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiUsers className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                    <div className="text-sm text-gray-600">Total Users</div>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiDollarSign className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Revenue</div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <FiUsers className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">New user registered</p>
                            <p className="text-xs text-gray-500">2 minutes ago</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <FiBookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Content published</p>
                            <p className="text-xs text-gray-500">1 hour ago</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <FiDollarSign className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Payment received</p>
                            <p className="text-xs text-gray-500">3 hours ago</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContentManagement = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Content Management</h3>
                <button className="btn-primary flex items-center space-x-2">
                    <FiPlus className="w-4 h-4" />
                    <span>Create Content</span>
                </button>
            </div>

            <div className="card">
                {contents.length === 0 ? (
                    <div className="text-center py-12">
                        <FiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg mb-2">No content created yet</p>
                        <p className="text-gray-500">Create your first course to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {contents.map((content) => (
                                    <tr key={content.id} className="hover:bg-slate-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center">
                                                        <FiBookOpen className="w-5 h-5 text-primary-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {content.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {content.description?.substring(0, 50)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                ₹{content.price}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${content.enabled
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {content.enabled ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(content.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleToggleStatus(content.id, content.enabled)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                    title={content.enabled ? 'Hide' : 'Publish'}
                                                >
                                                    {content.enabled ? (
                                                        <FiEyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <FiEye className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit"
                                                >
                                                    <FiEdit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteContent(content.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Platform Settings</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Maintenance Mode</span>
                            <button className="bg-gray-200 relative inline-flex h-6 w-11 items-center rounded-full">
                                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">User Registration</span>
                            <button className="bg-primary-600 relative inline-flex h-6 w-11 items-center rounded-full">
                                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Security</h4>
                    <div className="space-y-4">
                        <button className="w-full btn-secondary text-left">
                            Change Admin Password
                        </button>
                        <button className="w-full btn-secondary text-left">
                            View Login Logs
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 fade-in">
            {/* Admin Header */}
            <div className="bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-40">
                <div className="container-custom py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                                <FiShield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
                                <p className="text-sm text-slate-600 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Secure Session Active
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform active:scale-95"
                            >
                                <FiLogOut className="w-4 h-4" />
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-custom py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Admin Panel</h2>
                        <p className="text-gray-600">Manage your learning platform</p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                            ? 'border-primary-500 text-primary-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                {renderTabContent()}
            </div>
        </div>
    );
};

export default Dashboard;