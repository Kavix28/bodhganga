import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FiUser, FiMail, FiPhone, FiCalendar, FiEdit2, FiSave, FiX, FiShoppingBag, FiBookOpen } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [myPurchases, setMyPurchases] = useState([]);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        emailOrPhone: user?.emailOrPhone || '',
    });

    // Fetch user purchases
    useEffect(() => {
        const fetchPurchases = async () => {
            try {
                setIsLoading(true);
                const response = await api.get('/payment/my-purchases');
                setMyPurchases(response.data || []);
            } catch (error) {
                console.error('Error fetching purchases:', error);
                toast.error('Failed to load purchase history');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPurchases();
    }, []);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle save profile
    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        setIsSaving(true);
        
        try {
            // Note: This endpoint might not exist in the backend yet
            // For now, we'll just update the local state
            const updatedUser = {
                ...user,
                name: formData.name.trim()
            };
            
            updateUser(updatedUser);
            setIsEditing(false);
            toast.success('Profile updated successfully');
            
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle cancel edit
    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            emailOrPhone: user?.emailOrPhone || '',
        });
        setIsEditing(false);
    };

    if (isLoading) {
        return <Loader fullScreen />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container-custom py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-gray-600 mt-2">Manage your account settings and view your learning progress</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Information */}
                        <div className="lg:col-span-2">
                            <div className="card">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="btn-secondary flex items-center space-x-2"
                                        >
                                            <FiEdit2 className="w-4 h-4" />
                                            <span>Edit</span>
                                        </button>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="btn-primary flex items-center space-x-2"
                                            >
                                                {isSaving ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                ) : (
                                                    <FiSave className="w-4 h-4" />
                                                )}
                                                <span>Save</span>
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                disabled={isSaving}
                                                className="btn-secondary flex items-center space-x-2"
                                            >
                                                <FiX className="w-4 h-4" />
                                                <span>Cancel</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {/* Avatar */}
                                    <div className="flex items-center space-x-4">
                                        <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center">
                                            <FiUser className="w-10 h-10 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{user?.name || 'User'}</h3>
                                            <p className="text-gray-600">Learning enthusiast</p>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="input"
                                                    placeholder="Enter your full name"
                                                />
                                            ) : (
                                                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                                                    <FiUser className="w-5 h-5 text-gray-400" />
                                                    <span className="text-gray-900">{user?.name || 'Not provided'}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Email/Phone */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email/Phone
                                            </label>
                                            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                                                {user?.emailOrPhone?.includes('@') ? (
                                                    <FiMail className="w-5 h-5 text-gray-400" />
                                                ) : (
                                                    <FiPhone className="w-5 h-5 text-gray-400" />
                                                )}
                                                <span className="text-gray-900">{user?.emailOrPhone || 'Not provided'}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Contact support to change your email/phone
                                            </p>
                                        </div>

                                        {/* Role */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Account Type
                                            </label>
                                            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                                                <FiUser className="w-5 h-5 text-gray-400" />
                                                <span className="text-gray-900 capitalize">{user?.role?.toLowerCase() || 'User'}</span>
                                            </div>
                                        </div>

                                        {/* Member Since */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Member Since
                                            </label>
                                            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                                                <FiCalendar className="w-5 h-5 text-gray-400" />
                                                <span className="text-gray-900">
                                                    {user?.createdAt 
                                                        ? new Date(user.createdAt).toLocaleDateString()
                                                        : 'Recently'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Purchase History */}
                            <div className="card mt-8">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Purchase History</h2>
                                
                                {myPurchases.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FiShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No purchases yet</p>
                                        <p className="text-gray-500 text-sm">Browse our courses to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {myPurchases.map((purchase) => (
                                            <div key={purchase.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                                        <FiBookOpen className="w-6 h-6 text-primary-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">
                                                            Course Purchase
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(purchase.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold text-gray-900">
                                                        ₹{purchase.amount}
                                                    </div>
                                                    <div className={`text-sm px-2 py-1 rounded-full ${
                                                        purchase.status === 'COMPLETED' 
                                                            ? 'bg-green-100 text-green-800'
                                                            : purchase.status === 'PENDING'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {purchase.status}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            {/* Account Stats */}
                            <div className="card">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Overview</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Courses Purchased</span>
                                        <span className="font-semibold text-gray-900">{myPurchases.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Total Spent</span>
                                        <span className="font-semibold text-gray-900">
                                            ₹{myPurchases.reduce((total, purchase) => 
                                                purchase.status === 'COMPLETED' ? total + purchase.amount : total, 0
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Account Status</span>
                                        <span className="font-semibold text-green-600">Active</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="card mt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                
                                <div className="space-y-3">
                                    <button className="w-full btn-secondary text-left">
                                        Change Password
                                    </button>
                                    <button className="w-full btn-secondary text-left">
                                        Download Data
                                    </button>
                                    <button className="w-full btn-secondary text-left text-red-600 hover:bg-red-50">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;