import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
    BookOpen,
    HelpCircle,
    CheckCircle,
    MapPin,
    TrendingUp,
    Award,
    Users,
    ArrowRight,
    Target,
    FileText
} from 'lucide-react';
import StateNavigator from '../components/states/StateNavigator';
import { indianStates } from '../data/states';
import { unionTerritories } from '../data/unionTerritories';

const Landing = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        states: 0,
        uts: 0,
        notes: 0,
        questions: 0
    });

    // Calculate total content stats
    const totalNotes = [...indianStates, ...unionTerritories].reduce((sum, item) => sum + item.notesCount, 0);
    const totalQuestions = [...indianStates, ...unionTerritories].reduce((sum, item) => sum + item.questionsCount, 0);
    const totalSolutions = [...indianStates, ...unionTerritories].reduce((sum, item) => sum + item.solutionsCount, 0);

    // Animate stats on load
    useEffect(() => {
        const targets = {
            states: 28,
            uts: 8,
            notes: totalNotes,
            questions: totalQuestions
        };
        const duration = 2000;
        const steps = 60;
        const increment = {
            states: targets.states / steps,
            uts: targets.uts / steps,
            notes: targets.notes / steps,
            questions: targets.questions / steps
        };

        let currentStep = 0;
        const timer = setInterval(() => {
            if (currentStep < steps) {
                setStats({
                    states: Math.floor(increment.states * currentStep),
                    uts: Math.floor(increment.uts * currentStep),
                    notes: Math.floor(increment.notes * currentStep),
                    questions: Math.floor(increment.questions * currentStep)
                });
                currentStep++;
            } else {
                setStats(targets);
                clearInterval(timer);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [totalNotes, totalQuestions]);

    const handleGetStarted = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            navigate('/register');
        }
    };

    const features = [
        {
            icon: MapPin,
            title: 'All States & UTs Covered',
            description: '28 States and 8 Union Territories with complete exam content.',
            color: 'saffron'
        },
        {
            icon: BookOpen,
            title: 'Comprehensive Notes',
            description: 'Structured, exam-oriented study notes for every state.',
            color: 'navy'
        },
        {
            icon: HelpCircle,
            title: 'Practice Questions',
            description: 'Extensive question banks with previous year patterns.',
            color: 'saffron'
        },
        {
            icon: CheckCircle,
            title: 'Detailed Solutions',
            description: 'Step-by-step explanations for complete understanding.',
            color: 'green'
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* HERO SECTION WITH TRICOLOR THEME */}
            <section className="relative bg-gradient-to-br from-gray-50 to-white overflow-hidden tricolor-accent">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, var(--navy) 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="relative container-custom py-20 lg:py-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Hero Content */}
                        <div className="text-center lg:text-left space-y-8 slide-up">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full border-2 border-[var(--saffron)] scale-in">
                                <Award className="w-4 h-4 text-[var(--saffron)]" />
                                <span className="text-sm font-semibold text-[var(--saffron)]">Government Exam Preparation Platform</span>
                            </div>

                            {/* Main Headline */}
                            <h1 className="hero-title">
                                Prepare for Government Exams with{' '}
                                <span style={{ color: 'var(--green)' }}>Confidence</span>
                            </h1>

                            {/* Subheadline */}
                            <p className="hero-subtitle">
                                Comprehensive <strong>Notes</strong>, <strong>Question Banks</strong> & <strong>Solutions</strong> for All Indian States & Union Territories
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <button
                                    onClick={handleGetStarted}
                                    className="btn-saffron btn-lg group"
                                >
                                    <span>Start Your Preparation</span>
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <Link
                                    to="/states"
                                    className="btn-navy btn-lg"
                                >
                                    <MapPin className="mr-2 w-5 h-5" />
                                    <span>Browse States</span>
                                </Link>
                            </div>

                            {/* Animated Stats */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-4">
                                <div className="stats-card saffron inline-block">
                                    <div className="stats-value">{stats.states}</div>
                                    <div className="stats-label">States</div>
                                </div>
                                <div className="stats-card green inline-block">
                                    <div className="stats-value">{stats.uts}</div>
                                    <div className="stats-label">Union Territories</div>
                                </div>
                                <div className="stats-card navy inline-block">
                                    <div className="stats-value">{(stats.notes / 1000).toFixed(1)}K+</div>
                                    <div className="stats-label">Study Notes</div>
                                </div>
                            </div>
                        </div>

                        {/* Hero Visual - India Map Concept */}
                        <div className="relative hidden lg:flex justify-center items-center">
                            <div className="relative w-96 h-96">
                                {/* Main Circle with National Accent */}
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-green-50 rounded-full border-4 flex items-center justify-center national-accent shadow-2xl">
                                    <div className="w-72 h-72 bg-white rounded-full flex items-center justify-center border-4 border-gray-100">
                                        <div className="text-center space-y-4">
                                            <MapPin className="w-24 h-24 mx-auto text-[var(--navy)]" />
                                            <div className="text-2xl font-bold text-[var(--navy)]">36 Regions</div>
                                            <div className="text-sm text-gray-600">Complete Coverage</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Icons */}
                                <div className="absolute -top-8 -right-8 w-20 h-20 content-icon notes rounded-2xl shadow-2xl animate-bounce" style={{ animationDelay: '0s' }}>
                                    <BookOpen className="w-10 h-10" />
                                </div>
                                <div className="absolute -bottom-8 -left-8 w-16 h-16 content-icon questions rounded-2xl shadow-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>
                                    <HelpCircle className="w-8 h-8" />
                                </div>
                                <div className="absolute top-20 -left-12 w-14 h-14 content-icon solutions rounded-2xl shadow-2xl animate-bounce" style={{ animationDelay: '0.6s' }}>
                                    <CheckCircle className="w-7 h-7" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tricolor Bottom Border */}
                <div className="tricolor-border-bottom"></div>
            </section>

            {/* FEATURES SECTION */}
            <section className="py-24 bg-gray-50">
                <div className="container-custom">
                    <div className="text-center mb-20 slide-down">
                        <h2 className="text-5xl font-black mb-6" style={{ color: 'var(--navy)' }}>
                            Why <span style={{ color: 'var(--saffron)' }}>BodhGanga</span> Academy?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            A comprehensive platform designed specifically for Indian government exam aspirants
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={index}
                                    className={`stats-card ${feature.color} text-center scale-in hover:shadow-2xl transition-all duration-300 cursor-default`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className={`w-16 h-16 content-icon ${feature.color === 'saffron' ? 'questions' : feature.color === 'navy' ? 'notes' : 'solutions'} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--navy)' }}>{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* STATES SECTION */}
            <section className="py-24 bg-white">
                <div className="container-custom">
                    <StateNavigator
                        items={[...indianStates, ...unionTerritories].slice(0, 12)}
                        type="state"
                        title="Explore States & Union Territories"
                    />

                    {/* View All Button */}
                    <div className="text-center mt-16">
                        <Link
                            to="/states"
                            className="btn-saffron btn-lg"
                        >
                            View All 36 Regions
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* EXAM TYPES SECTION */}
            <section className="py-24 bg-gradient-to-br from-orange-50 via-white to-green-50">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black mb-4" style={{ color: 'var(--navy)' }}>
                            Exam Types Covered
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Comprehensive preparation for all major government examinations
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {['UPSC', 'SSC', 'State PSC', 'Police', 'Railway', 'Banking', 'Teaching', 'Revenue', 'Forest', 'Judiciary'].map((exam, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg p-6 text-center border-2 border-gray-200 hover:border-[var(--navy)] hover:shadow-lg transition-all duration-200 cursor-default"
                            >
                                <div className="exam-badge mb-2">{exam}</div>
                                <p className="text-sm text-gray-600">Complete Material</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="relative py-32 bg-gradient-to-br from-[var(--navy)] to-[var(--navy-dark)] text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '30px 30px'
                    }}></div>
                </div>

                <div className="relative container-custom text-center">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <h2 className="text-5xl md:text-6xl font-black leading-tight">
                            Ready to Ace Your Government Exam?
                        </h2>
                        <p className="text-2xl text-blue-100 leading-relaxed">
                            Join thousands of successful candidates who prepared with <strong className="text-[var(--saffron)]">BodhGanga Academy</strong>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                            <button
                                onClick={handleGetStarted}
                                className="btn-saffron btn-lg text-xl px-12 py-5 group"
                            >
                                {isAuthenticated ? 'Go to Dashboard' : 'Start Preparing Now'}
                                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                            </button>
                            <Link
                                to="/states"
                                className="btn bg-white text-[var(--navy)] btn-lg text-xl px-12 py-5 hover:bg-gray-100"
                            >
                                <MapPin className="mr-3 w-6 h-6" />
                                Browse Content
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
