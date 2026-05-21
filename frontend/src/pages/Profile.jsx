import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiX, FiShoppingBag, FiMapPin } from 'react-icons/fi';
import { BookOpen, Award, Shield } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [purchases, setPurchases] = useState([]);
    const [enrollments, setEnrollments] = useState([]);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        city: user?.city || '',
        state: user?.state || '',
        country: user?.country || '',
        qualification: user?.qualification || '',
    });

    useEffect(() => {
        // Fetch enrollments
        api.get('/courses/my-courses')
            .then(res => setEnrollments(res?.data || res || []))
            .catch(() => {});
    }, []);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) { toast.error('Name is required'); return; }
        setIsSaving(true);
        try {
            const res = await api.put('/profile/settings/update', formData);
            if (res?.success) {
                updateUser({ ...user, ...formData });
                setIsEditing(false);
                toast.success('Profile updated successfully');
            }
        } catch (err) {
            toast.error(err?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            city: user?.city || '',
            state: user?.state || '',
            country: user?.country || '',
            qualification: user?.qualification || '',
        });
        setIsEditing(false);
    };

    const Field = ({ label, value, name, placeholder }) => (
        <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-dark/60">
                {label}
            </label>
            {isEditing ? (
                <input
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none"
                />
            ) : (
                <div className="px-4 py-3 bg-emerald/5 rounded-xl text-sm font-semibold text-emerald-dark border border-emerald/5 shadow-inner">
                    {value || <span className="text-emerald-dark/40 italic">Not provided</span>}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-ivory-light py-16">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header */}
                <div className="mb-10 space-y-2">
                    <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest">Scholar Account Settings</span>
                    <h1 className="text-3xl font-bold text-emerald-dark font-serif tracking-tight">My Profile</h1>
                    <p className="text-xs text-emerald-dark/60 font-semibold">Manage your account information and curriculum accomplishments.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left — Profile Card */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="card-premium bg-white p-6 sm:p-8 space-y-6">
                            {/* Avatar + Edit Toggle */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold-dark rounded-2xl flex items-center justify-center shadow-lg">
                                        <FiUser className="w-7 h-7 text-emerald-dark" />
                                    </div>
                                    <div className="text-left space-y-1">
                                        <h2 className="text-xl font-bold text-emerald-dark font-serif tracking-tight">{user?.name || 'Scholar'}</h2>
                                        <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                            user?.role === 'ADMIN'
                                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                : 'bg-emerald/10 text-emerald border border-emerald/20'
                                        }`}>
                                            {user?.role || 'USER'}
                                        </span>
                                    </div>
                                </div>

                                {!isEditing ? (
                                    <button 
                                        onClick={() => setIsEditing(true)} 
                                        className="px-4 py-2 border border-emerald/10 hover:border-emerald text-emerald hover:bg-emerald/5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 self-start sm:self-auto"
                                    >
                                        <FiEdit2 className="w-3.5 h-3.5" /> Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleSave} 
                                            disabled={isSaving} 
                                            className="px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {isSaving ? (
                                                <div className="w-3.5 h-3.5 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <FiSave className="w-3.5 h-3.5" />
                                            )}
                                            Save
                                        </button>
                                        <button 
                                            onClick={handleCancel} 
                                            disabled={isSaving} 
                                            className="px-4 py-2 border border-emerald/10 hover:border-emerald text-emerald hover:bg-emerald/5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                                        >
                                            <FiX className="w-3.5 h-3.5" /> Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Field label="Full Name" value={user?.name} name="name" placeholder="Your full name" />

                                {/* Email — read only */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-dark/60">Email</label>
                                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-light/5 rounded-xl text-sm font-semibold text-emerald-dark/60 border border-emerald/5">
                                        <FiMail className="w-4 h-4 text-emerald/60 flex-shrink-0" />
                                        {user?.email || <span className="italic">Not provided</span>}
                                    </div>
                                </div>

                                {/* Phone — read only */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-dark/60">Phone</label>
                                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-light/5 rounded-xl text-sm font-semibold text-emerald-dark/60 border border-emerald/5">
                                        <FiPhone className="w-4 h-4 text-emerald/60 flex-shrink-0" />
                                        {user?.phoneNo || <span className="italic">Not provided</span>}
                                    </div>
                                    {isEditing && <p className="text-[10px] text-emerald-dark/40 font-bold uppercase tracking-wider mt-1">Please contact support to update your phone</p>}
                                </div>

                                <Field label="Qualification" value={user?.qualification} name="qualification" placeholder="e.g. B.A., B.Sc." />
                                <Field label="City" value={user?.city} name="city" placeholder="Your city" />
                                <Field label="State" value={user?.state} name="state" placeholder="Your state" />
                                <Field label="Country" value={user?.country} name="country" placeholder="Your country" />
                            </div>
                        </div>

                        {/* Enrolled Courses */}
                        <div className="card-premium bg-white p-6 sm:p-8">
                            <h3 className="text-lg font-bold text-emerald-dark mb-6 font-serif flex items-center gap-2 border-b border-emerald/5 pb-4">
                                <BookOpen className="w-5 h-5 text-emerald" />
                                Enrolled Courses
                            </h3>
                            {enrollments.length === 0 ? (
                                <div className="text-center py-8">
                                    <BookOpen className="w-12 h-12 text-emerald/10 mx-auto mb-3" />
                                    <p className="text-emerald-dark/60 text-sm font-semibold">No courses enrolled yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {enrollments.map(course => (
                                        <div key={course.id} className="flex items-center gap-3.5 p-4 bg-emerald-light/5 border border-emerald/5 rounded-2xl hover:border-gold/30 transition-all duration-300">
                                            <div className="w-9 h-9 bg-emerald/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald/10">
                                                <BookOpen className="w-4 h-4 text-emerald" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-emerald-dark text-sm truncate font-serif">
                                                    {course.courseTitle || course.title}
                                                </p>
                                                <p className="text-[10px] text-emerald-dark/50 font-bold uppercase tracking-wider mt-0.5">{course.instructorName}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-8">
                        {/* Stats */}
                        <div className="card-premium bg-white p-6">
                            <h3 className="text-lg font-bold text-emerald-dark mb-4 font-serif pb-2 border-b border-emerald/5">Overview</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Courses Enrolled', value: enrollments.length, icon: BookOpen },
                                    { label: 'Purchases Total', value: purchases.length, icon: FiShoppingBag },
                                    { label: 'Account Integrity', value: 'Active', icon: Shield },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-emerald/5 last:border-0">
                                        <span className="text-xs font-bold text-emerald-dark/60 flex items-center gap-2 uppercase tracking-wider">
                                            <item.icon className="w-4 h-4 text-gold" />
                                            {item.label}
                                        </span>
                                        <span className="font-extrabold text-emerald-dark text-sm">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Achievements */}
                        <div className="bg-gradient-to-br from-emerald-dark to-emerald-950 border border-gold/15 rounded-3xl p-6 text-white shadow-xl space-y-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
                            <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2 border-b border-white/10 pb-3 relative z-10">
                                <Award className="w-5 h-5 text-gold" />
                                Academic Badges
                            </h3>
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center gap-3.5">
                                    <span className="text-2xl">🎓</span>
                                    <div className="text-left">
                                        <p className="text-xs font-bold uppercase tracking-wider text-white">First Step Scholar</p>
                                        <p className="text-[10px] text-white/50 font-semibold mt-0.5">Joined BodhGanga Academy</p>
                                    </div>
                                </div>
                                {enrollments.length > 0 && (
                                    <div className="flex items-center gap-3.5">
                                        <span className="text-2xl">📚</span>
                                        <div className="text-left">
                                            <p className="text-xs font-bold uppercase tracking-wider text-white">Curriculum Pioneer</p>
                                            <p className="text-[10px] text-white/50 font-semibold mt-0.5">Enrolled in first region module</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
