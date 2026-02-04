import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
    FiBookOpen, FiClock, FiTrendingUp, FiAward, FiPlay, FiTarget,
    FiZap, FiCheckCircle, FiArrowRight, FiStar, FiBarChart2, FiMap
} from 'react-icons/fi';
import { MapPin, Globe, Book, HelpCircle, CheckSquare } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import SVGBasedIndiaMap from '../components/map/SVGBasedIndiaMap';
import IndianFlag from '../components/common/IndianFlag';
import { indianStates } from '../data/states';
import { unionTerritories } from '../data/unionTerritories';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myContents, setMyContents] = useState([]);
    const [allContents, setAllContents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mapViewMode, setMapViewMode] = useState('states'); // 'states' or 'uts'
    const [userProgress, setUserProgress] = useState({});
    const [stats, setStats] = useState({
        enrolled: 0,
        completed: 0,
        inProgress: 0,
        totalHours: 0,
        statesCovered: 0,
        utsCovered: 0
    });

    useEffect(() => {
        fetchDashboardData();
        calculateRegionalProgress();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);

            // Fetch user's enrolled content
            const myContentResponse = await api.get('/user/my-contents');
            const enrolledContents = myContentResponse.data || [];
            setMyContents(enrolledContents);

            // Fetch all available content
            const allContentResponse = await api.get('/content/list');
            setAllContents(allContentResponse.data || []);

            // Calculate stats
            const completed = enrolledContents.filter(c => c.progress === 100).length;
            const inProgress = enrolledContents.filter(c => c.progress > 0 && c.progress < 100).length;

            setStats({
                enrolled: enrolledContents.length,
                completed: completed,
                inProgress: inProgress,
                totalHours: enrolledContents.length * 12,
                statesCovered: 12,
                utsCovered: 4
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate progress for each state/UT
    const calculateRegionalProgress = () => {
        const mockProgress = {};

        [...indianStates, ...unionTerritories].forEach((region, index) => {
            const random = Math.random();

            // Generate realistic progress for different categories
            let overall, notes, questions, solutions;

            if (random > 0.7) {
                // Fully covered (70%+)
                overall = Math.floor(Math.random() * 30) + 70;
                notes = Math.floor(Math.random() * 25) + 75;
                questions = Math.floor(Math.random() * 20) + 70;
                solutions = Math.floor(Math.random() * 25) + 65;
            } else if (random > 0.4) {
                // Partially covered (25-70%)
                overall = Math.floor(Math.random() * 45) + 25;
                notes = Math.floor(Math.random() * 40) + 30;
                questions = Math.floor(Math.random() * 35) + 25;
                solutions = Math.floor(Math.random() * 30) + 20;
            } else {
                // Not started (<25%)
                overall = Math.floor(Math.random() * 25);
                notes = Math.floor(Math.random() * 20);
                questions = Math.floor(Math.random() * 15);
                solutions = Math.floor(Math.random() * 10);
            }

            mockProgress[region.id] = {
                overall,
                notes,
                questions,
                solutions
            };
        });

        setUserProgress(mockProgress);
    };

    const handleContentClick = (contentId) => {
        navigate(`/courses/${contentId}`);
    };

    const handleContinueLearning = (contentId) => {
        navigate(`/courses/${contentId}/learn`);
    };

    const handleRegionClick = (regionId, isState) => {
        const path = isState ? `/states/${regionId}` : `/union-territories/${regionId}`;
        navigate(path);
    };

    if (isLoading) {
        return <Loader fullScreen />;
    }

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getTotalRegionsCount = () => mapViewMode === 'states' ? indianStates.length : unionTerritories.length;
    const getCoveredRegionsCount = () => {
        const regions = mapViewMode === 'states' ? indianStates : unionTerritories;
        return regions.filter(r => {
            const progress = userProgress[r.id];
            const overall = typeof progress === 'object' ? progress.overall : (progress || 0);
            return overall >= 25;
        }).length;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* HERO SECTION with Indian Tricolor Theme */}
            <section className="relative text-white overflow-hidden" style={{
                background: 'linear-gradient(135deg, #FF9933 0%, #FFB366 15%, #FFF8F0 35%, #F0FDF4 65%, #16A30B 85%, #138808 100%)'
            }}>
                {/* Tricolor Top Border - Enhanced */}
                <div className="absolute top-0 left-0 right-0 h-2 tricolor-accent" style={{ zIndex: 10 }}></div>

                {/* Ashoka Chakra Watermark - Subtle */}
                <div className="absolute inset-0 opacity-5 flex items-center justify-center">
                    <div className="relative w-96 h-96">
                        <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: '#000080' }}></div>
                        <div className="absolute inset-8 rounded-full border-2" style={{ borderColor: '#000080' }}></div>
                        {[...Array(24)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute top-1/2 left-1/2 w-1 h-20 origin-bottom"
                                style={{
                                    background: '#000080',
                                    transform: `translate(-50%, -100%) rotate(${i * 15}deg)`
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Dotted Pattern */}
                <div className="absolute inset-0 opacity-8">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,128,0.1) 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="relative container-custom py-16">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        {/* Welcome Message */}
                        <div className="flex-1 slide-down">
                            <div className="inline-flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-full mb-4" style={{
                                background: 'rgba(0, 0, 128, 0.15)',
                                border: '2px solid rgba(255, 255, 255, 0.3)'
                            }}>
                                <FiZap className="w-4 h-4" style={{ color: '#FFB366' }} />
                                <span className="text-sm font-semibold" style={{ color: '#000080' }}>{greeting()}, Champion!</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4" style={{ color: '#000080' }}>
                                Welcome Back, <span style={{ color: '#FF9933' }}>{user?.name || 'Student'}!</span>
                            </h1>
                            <p className="text-xl mb-6 flex items-center gap-3" style={{ color: '#0F6606' }}>
                                <span>
                                    Master government exams across <strong style={{ color: '#FF9933' }}>all 28 States & 8 UTs</strong>.
                                    Your success journey for Bharat awaits!
                                </span>
                                <IndianFlag size="lg" />
                            </p>

                            {/* Quick Actions */}
                            <div className="flex flex-wrap gap-4">
                                <Link to="/states" className="btn-saffron">
                                    <FiMap className="w-5 h-5" />
                                    <span>Browse States</span>
                                </Link>
                                <Link to="/union-territories" className="btn-green">
                                    <Globe className="w-5 h-5" />
                                    <span>Union Territories</span>
                                </Link>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4 lg:gap-6">
                            <div className="card-glass text-center p-6 scale-in" style={{ animationDelay: '0.1s' }}>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, var(--saffron), var(--saffron-dark))' }}>
                                    <FiMap className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-4xl font-black text-white mb-2">{indianStates.length}</div>
                                <div className="text-sm text-purple-100 font-semibold">States</div>
                            </div>

                            <div className="card-glass text-center p-6 scale-in" style={{ animationDelay: '0.2s' }}>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, var(--green), var(--green-dark))' }}>
                                    <Globe className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-4xl font-black text-white mb-2">{unionTerritories.length}</div>
                                <div className="text-sm text-purple-100 font-semibold">Union Territories</div>
                            </div>

                            <div className="card-glass text-center p-6 scale-in" style={{ animationDelay: '0.3s' }}>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-dark))' }}>
                                    <FiTrendingUp className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-4xl font-black text-white mb-2">{getCoveredRegionsCount()}</div>
                                <div className="text-sm text-purple-100 font-semibold">Regions Covered</div>
                            </div>

                            <div className="card-glass text-center p-6 scale-in" style={{ animationDelay: '0.4s' }}>
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FiBookOpen className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-4xl font-black text-white mb-2">10.4K+</div>
                                <div className="text-sm text-purple-100 font-semibold">Study Notes</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(248 250 252)" />
                    </svg>
                </div>
            </section>

            {/* MAIN CONTENT */}
            <div className="container-custom py-16 space-y-16">
                {/* INTERACTIVE INDIA MAP SECTION */}
                <section className="slide-up">
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: 'linear-gradient(135deg, var(--saffron-light), var(--saffron))' }}>
                            <FiMap className="w-4 h-4 text-white" />
                            <span className="text-sm font-bold text-white">Interactive India Map</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-3" style={{ color: 'var(--navy)' }}>
                            Your <span style={{ color: 'var(--saffron)' }}>Government Exam</span> Journey
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Click any state or union territory to access comprehensive <strong>study notes</strong>, question banks, and solutions
                        </p>
                    </div>

                    {/* Map Container with Tricolor Border */}
                    <div className="card-hover p-8 tricolor-accent">
                        {/* View Mode Toggle */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--saffron), var(--saffron-dark))' }}>
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>Regional Coverage Map</h3>
                                    <p className="text-sm text-gray-600">
                                        {mapViewMode === 'states' ? `${indianStates.length} States` : `${unionTerritories.length} Union Territories`}
                                    </p>
                                </div>
                            </div>

                            {/* Toggle Buttons using Tricolor Theme */}
                            <div className="inline-flex bg-gray-100 rounded-xl p-1 border-2 border-gray-200">
                                <button
                                    onClick={() => setMapViewMode('states')}
                                    className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 ${mapViewMode === 'states'
                                        ? 'text-white shadow-lg'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    style={mapViewMode === 'states' ? { background: 'linear-gradient(135deg, var(--saffron), var(--saffron-dark))' } : {}}
                                >
                                    <MapPin className="w-4 h-4 inline mr-2" />
                                    States ({indianStates.length})
                                </button>
                                <button
                                    onClick={() => setMapViewMode('uts')}
                                    className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 ${mapViewMode === 'uts'
                                        ? 'text-white shadow-lg'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    style={mapViewMode === 'uts' ? { background: 'linear-gradient(135deg, var(--green), var(--green-dark))' } : {}}
                                >
                                    <Globe className="w-4 h-4 inline mr-2" />
                                    Union Territories ({unionTerritories.length})
                                </button>
                            </div>
                        </div>

                        {/* Coverage Legend using Tricolor */}
                        <div className="flex flex-wrap items-center justify-center gap-6 mb-8 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: 'var(--green)' }}></div>
                                <span className="text-sm font-semibold text-gray-700">Fully Covered (70%+)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: 'var(--saffron)' }}></div>
                                <span className="text-sm font-semibold text-gray-700">Partially Covered (25-70%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white shadow"></div>
                                <span className="text-sm font-semibold text-gray-700">Not Started (&lt;25%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
                                <span className="text-sm font-semibold text-gray-700">Not in View</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-inner border-2" style={{ borderColor: 'var(--navy)' }}>
                            <SVGBasedIndiaMap viewMode={mapViewMode} userProgress={userProgress} />
                        </div>

                        {/* Quick Stats Below Map using Tricolor */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                            <div className="rounded-xl p-6 border-2" style={{ background: 'linear-gradient(to br, #f0fdf4, #dcfce7)', borderColor: 'var(--green)' }}>
                                <div className="text-3xl font-black mb-2" style={{ color: 'var(--green-dark)' }}>
                                    {Object.values(userProgress).filter(p => {
                                        const overall = typeof p === 'object' ? p.overall : p;
                                        return overall >= 70;
                                    }).length}
                                </div>
                                <div className="text-sm font-semibold" style={{ color: 'var(--green)' }}>Regions Mastered</div>
                            </div>
                            <div className="rounded-xl p-6 border-2" style={{ background: 'linear-gradient(to br, #fff7ed, #fed7aa)', borderColor: 'var(--saffron)' }}>
                                <div className="text-3xl font-black mb-2" style={{ color: 'var(--saffron-dark)' }}>
                                    {Object.values(userProgress).filter(p => {
                                        const overall = typeof p === 'object' ? p.overall : p;
                                        return overall >= 25 && overall < 70;
                                    }).length}
                                </div>
                                <div className="text-sm font-semibold" style={{ color: 'var(--saffron)' }}>In Progress</div>
                            </div>
                            <div className="rounded-xl p-6 border-2" style={{ background: 'linear-gradient(to br, #eff6ff, #dbeafe)', borderColor: 'var(--navy)' }}>
                                <div className="text-3xl font-black mb-2" style={{ color: 'var(--navy-dark)' }}>
                                    {getTotalRegionsCount() - getCoveredRegionsCount()}
                                </div>
                                <div className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>To Explore</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* COMPREHENSIVE SCROLLABLE MAP VIEW - ALL STATES & UTs */}
                <section className="slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="mb-8">
                        <h2 className="text-4xl font-black mb-3" style={{ color: 'var(--navy)' }}>
                            All <span style={{ color: mapViewMode === 'states' ? 'var(--saffron)' : 'var(--green)' }}>
                                {mapViewMode === 'states' ? 'States' : 'Union Territories'}
                            </span> at a Glance
                        </h2>
                        <p className="text-lg text-slate-600">
                            Quick access to study materials for every region across India
                        </p>
                    </div>

                    {/* All Regions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {(mapViewMode === 'states' ? indianStates : unionTerritories).map((region, index) => {
                            const progressData = userProgress[region.id] || 0;
                            const progress = typeof progressData === 'object' ? progressData.overall : progressData;
                            const coverageLevel = progress >= 70 ? 'full' : progress >= 25 ? 'partial' : 'none';

                            return (
                                <div
                                    key={region.id}
                                    className="state-card scale-in"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                    onClick={() => handleRegionClick(region.id, mapViewMode === 'states')}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                                            background: coverageLevel === 'full' ? 'var(--green)' :
                                                coverageLevel === 'partial' ? 'var(--saffron)' :
                                                    '#9CA3AF'
                                        }}>
                                            <MapPin className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                            {region.code}
                                        </span>
                                    </div>

                                    <h3 className="state-card-title">{region.name}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{region.capital}</p>

                                    {/* Stats */}
                                    <div className="flex gap-3 text-xs mb-3">
                                        <div className="flex items-center gap-1">
                                            <Book className="w-3 h-3" style={{ color: 'var(--navy)' }} />
                                            <span className="font-semibold">{region.notesCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <HelpCircle className="w-3 h-3" style={{ color: 'var(--saffron)' }} />
                                            <span className="font-semibold">{region.questionsCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckSquare className="w-3 h-3" style={{ color: 'var(--green)' }} />
                                            <span className="font-semibold">{region.solutionsCount}</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600">Coverage</span>
                                            <span className="font-bold" style={{ color: 'var(--navy)' }}>{progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${progress}%`,
                                                    background: coverageLevel === 'full' ? 'var(--green)' :
                                                        coverageLevel === 'partial' ? 'var(--saffron)' :
                                                            '#9CA3AF'
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* MY LEARNING - Continue Where You Left Off */}
                {myContents.length > 0 && (
                    <section className="slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 mb-2">
                                    Continue Your Journey
                                </h2>
                                <p className="text-lg text-slate-600">
                                    Pick up where you left off and keep crushing your goals! 💪
                                </p>
                            </div>
                            <Link to="/courses" className="hidden md:flex btn-outline">
                                View All
                                <FiArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myContents.slice(0, 3).map((content, index) => {
                                const progress = content.progress || 0;
                                return (
                                    <div
                                        key={content.id}
                                        className="group card-hover cursor-pointer scale-in"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                        onClick={() => handleContinueLearning(content.id)}
                                    >
                                        <div className="relative w-full h-48 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-xl mb-4 overflow-hidden">
                                            {content.youtubeThumbnailUrl ? (
                                                <img
                                                    src={content.youtubeThumbnailUrl}
                                                    alt={content.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <FiPlay className="w-16 h-16 text-white opacity-80" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                                                <span className="text-sm font-black text-indigo-600">{progress}%</span>
                                            </div>

                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
                                                    <FiPlay className="w-8 h-8 text-indigo-600 ml-1" />
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                                            {content.title}
                                        </h3>
                                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                                            {content.description}
                                        </p>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-semibold text-slate-700">Progress</span>
                                                <span className="font-black text-indigo-600">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* EMPTY STATE */}
                {myContents.length === 0 && allContents.length === 0 && (
                    <div className="empty-state">
                        <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiTarget className="w-16 h-16 text-indigo-600" />
                        </div>
                        <h3 className="empty-state-title">Start Your Learning Journey!</h3>
                        <p className="empty-state-description">
                            Explore states and union territories to access comprehensive study materials.
                        </p>
                        <div className="flex gap-4 justify-center mt-6">
                            <Link to="/states" className="btn-saffron">
                                <FiMap className="w-5 h-5" />
                                <span>Explore States</span>
                            </Link>
                            <Link to="/union-territories" className="btn-green">
                                <Globe className="w-5 h-5" />
                                <span>Explore UTs</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
