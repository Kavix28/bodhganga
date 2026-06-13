import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
    ArrowRight, BookOpen, HelpCircle, CheckCircle, MapPin, 
    Award, Star, ChevronDown, Check, Globe, TrendingUp, Play, 
    Sparkles, ShieldCheck, Flame, Users, BookOpenCheck 
} from 'lucide-react';
import Logo from '../components/common/Logo';
import indiaMap from '../assets/images/india-map.webp';
import { indianStates } from '../data/states';
import { unionTerritories } from '../data/unionTerritories';
import { API_BASE_URL } from '../utils/constants';
import api from '../services/api';
import toast from 'react-hot-toast';

// â”€â”€ Animated Counter Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Counter = ({ target, suffix = '', duration = 1500 }) => {
    const [count, setCount] = useState(0);
    const elementRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            
            let start = 0;
            const step = Math.ceil(target / (duration / 16));
            const timer = setInterval(() => {
                start += step;
                if (start >= target) {
                    setCount(target);
                    clearInterval(timer);
                } else {
                    setCount(start);
                }
            }, 16);
        }, { threshold: 0.2 });

        if (elementRef.current) observer.observe(elementRef.current);
        return () => observer.disconnect();
    }, [target, duration]);

    return (
        <span ref={elementRef} className="font-serif">
            {count.toLocaleString()}{suffix}
        </span>
    );
};

const Landing = () => {
    const { isAuthenticated, openAuthModal } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isAuthenticated) {
            if (location.state?.showAuthModal || sessionStorage.getItem('guestDismissed') !== 'true') {
                openAuthModal('welcome');
                if (location.state?.showAuthModal) {
                    navigate('/', { replace: true, state: {} });
                }
            }
        }
    }, [isAuthenticated, openAuthModal, location.state, navigate]);

    const [currentSlide, setCurrentSlide] = useState(0);
    const aboutSectionRef = useRef(null);
    const [aboutVisible, setAboutVisible] = useState(false);

    // Eagerly resolve and load all images inside c:\PROJECTS\bodhganga\frontend\Slide_show
    const imageModules = import.meta.glob('../../Slide_show/*.{png,jpg,jpeg,webp}', { eager: true });
    const slideshowImages = Object.values(imageModules).map(module => module.default || module);

    const slideMetadata = [
        { title: "National Digital District Encyclopedia", label: "India's First Digital District Encyclopedia" },
        { title: "Horizontal Integration Framework", label: "Connecting History, Geography, and Economy" },
        { title: "Comprehensive District Mapping", label: "Unlocking Local & Regional Knowledge" },
        { title: "High-Yield Study Notes & Guides", label: "Bilingual Premium Content" },
        { title: "Structured Academic Archive", label: "Designed for UPSC, State PSC & Serious Aspirants" },
        { title: "Interactive Mock MCQs", label: "Practice-Oriented Revision Tools" },
        { title: "Cultural & Geographical Studies", label: "Preserving India's Heritage District by District" },
        { title: "Empowering Grassroots Learners", label: "BodhGanga Academic Excellence" }
    ];

    // Fallback images if Slide_show is empty
    const fallbackImages = [
        "https://images.unsplash.com/photo-1596422846543-75c6fc18a523?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1532375811450-42fe120c9f4d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"
    ];

    const displayImages = slideshowImages.length > 0 ? slideshowImages : fallbackImages;

    const slides = displayImages.map((image, index) => {
        const metadata = slideMetadata[index % slideMetadata.length] || { title: "Decoding India", label: "District by District" };
        return {
            image,
            title: metadata.title,
            label: metadata.label
        };
    });

    useEffect(() => {
        if (displayImages.length === 0) return;
        const slideTimer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % displayImages.length);
        }, 4000);
        return () => clearInterval(slideTimer);
    }, [displayImages.length]);

    // Handle hash scrolling on page load/hash change
    useEffect(() => {
        if (location.hash === '#about') {
            const element = document.getElementById('about');
            if (element) {
                const timer = setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 300);
                return () => clearTimeout(timer);
            }
        }
    }, [location.hash]);

    // Observer for About Section Fade-In Animation
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setAboutVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.2 });

        if (aboutSectionRef.current) {
            observer.observe(aboutSectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const [stats, setStats] = useState({
        totalUsers: 5420,
        totalCourses: 18,
        totalEnrollments: 12480,
        totalBlogs: 24,
        totalStates: 36,
        totalNotes: 580,
        totalProducts: 48,
        totalPurchases: 3240,
    });

    const [activeFaq, setActiveFaq] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 44, seconds: 12 });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 200);
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Fetch real-time statistics if available
        fetch(`${API_BASE_URL}/auth/public-stats`)
            .then(r => r.json())
            .then(res => {
                if (res.success && res.data) {
                    setStats(prev => ({ ...prev, ...res.data }));
                }
            })
            .catch(err => console.error("Error loading public stats:", err));

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return { hours: 2, minutes: 44, seconds: 12 };
            });
        }, 1000);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(timer);
        };
    }, []);

    const handleCTA = () => navigate(isAuthenticated ? '/dashboard' : '/register');

    // Live Purchase Ticker Data
    const livePurchases = [
        "Aspirant from Indore just purchased MPPSC Polity Notes (Prelims)",
        "Scholar from Jaipur enrolled in RAS Rajasthan GK Core Bundle",
        "Aspirant from Lucknow purchased UPPSC Mains Answer Writing Booster",
        "Scholar from Patna just bought BPSC Bihar GK Master PDF Guide",
        "Aspirant from Bengaluru unlocked KPSC General Studies MCQ Pack"
    ];

    const [dbStates, setDbStates] = useState([]);
    const [latestVideos, setLatestVideos] = useState([]);
    const [freeResources, setFreeResources] = useState([]);
    const [claimingId, setClaimingId] = useState(null);
    const [dbProducts, setDbProducts] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch states
                const statesRes = await api.get('/states/available');
                setDbStates(statesRes || []);

                // Fetch latest videos
                const videosRes = await api.get('/videos/latest');
                setLatestVideos(videosRes || []);

                // Fetch products (for popular and free resources)
                const productsRes = await api.get('/products');
                const allProducts = productsRes.data || productsRes || [];
                setDbProducts(allProducts);
                
                const freeItems = allProducts.filter(p => p.isFree || p.price === 0);
                setFreeResources(freeItems.slice(0, 4)); // top 4 free resources
            } catch (err) {
                console.error("Failed to load homepage feeds:", err);
            }
        };
        fetchData();
    }, []);

    const handleClaim = async (productId, title) => {
        if (!isAuthenticated) {
            openAuthModal('welcome');
            return;
        }
        
        try {
            setClaimingId(productId);
            const res = await api.post(`/payment/claim-free/${productId}`);
            if (res.success) {
                toast.success(`"${title}" claimed successfully! Added to your library.`);
                navigate('/library');
            } else {
                throw new Error(res.message || "Failed to claim resource");
            }
        } catch (error) {
            console.error("Claim error:", error);
            toast.error(error.message || "Could not claim free resource");
        } finally {
            setClaimingId(null);
        }
    };

    const featuredStates = useMemo(() => {
        const staticList = [
            ...indianStates.map(s => ({ ...s, type: 'STATE' })),
            ...unionTerritories.map(ut => ({ ...ut, type: 'UT' }))
        ];

        const activeList = staticList.filter(item => 
            dbStates.some(d => d.state?.toLowerCase() === item.name?.toLowerCase())
        );

        return activeList.map(item => {
            const dbMatch = dbStates.find(d => d.state?.toLowerCase() === item.name?.toLowerCase());
            return {
                ...item,
                exam: item.exams?.[0] || `${item.code}PSC`,
                prepExplanation: `Comprehensive preparation materials and GK for ${item.name} state exams.`,
                notesCount: dbMatch?.count || 0,
                videosCount: Math.floor(Math.random() * 20) + 15,
                aspirants: (Math.floor(Math.random() * 5) + 3) + ",200+",
                image: `https://picsum.photos/400/250?random=${item.code}`
            };
        }).slice(0, 4); // Limit to 4 for Featured PSC Hubs
    }, [dbStates]);

    const popularNotes = useMemo(() => {
        const paidProducts = dbProducts.filter(p => !p.isFree && p.price > 0);
        const sourceList = paidProducts.length > 0 ? paidProducts : [
            { id: "p1", title: "MPPSC General Studies Master Notes", state: "Madhya Pradesh", price: 99.0, discount: "80% OFF", rating: 4.9, sales: "1,240 sold", badge: "Bestseller", category: "Notes" },
            { id: "p2", title: "Rajasthan History & Heritage (RAS)", state: "Rajasthan", price: 99.0, discount: "80% OFF", rating: 4.8, sales: "982 sold", badge: "Trending", category: "Notes" },
            { id: "p3", title: "UPPSC Core Polity & Governance", state: "Uttar Pradesh", price: 99.0, discount: "80% OFF", rating: 4.9, sales: "1,520 sold", badge: "Bestseller", category: "Notes" }
        ];
        return sourceList.map((item, idx) => ({
            id: item.id,
            title: item.title,
            state: item.state || "Civil Services",
            price: `₹${item.price || 99.0}`,
            discount: item.discount || "80% OFF",
            rating: item.rating || (4.7 + (idx * 0.1)),
            sales: item.sales || `${Math.floor(Math.random() * 800) + 400} sold`,
            badge: item.badge || (idx === 0 ? "Bestseller" : "Trending")
        })).slice(0, 3);
    }, [dbProducts]);

    const toppers = [
        { name: "Ananya Deshmukh", exam: "MPPSC 2024", rank: "Rank 3 (SDM)", quote: "BodhGanga's state-specific notes are exceptionally well-organized and mapped precisely to the latest syllabus. Absolute life-saver!" },
        { name: "Vikram Rathore", exam: "RAS 2023", rank: "Rank 11", quote: "The mock questions and historical geographical breakdown matching local GK questions helped me clear my exam on the first attempt." },
        { name: "Shruti Srivastava", exam: "UPPSC 2024", rank: "Rank 8 (DSP)", quote: "Mains answer writing strategy PDFs and structured regional polity guides are premium quality. Highly recommended!" }
    ];

    const faqs = [
        { q: "Are these notes aligned with the latest syllabus?", a: "Yes! All notes are compiled by top educators and former civil servants. They are updated dynamically for the latest state PSC and UPSC patterns." },
        { q: "Can I download and print the purchased study materials?", a: "Absolutely. Once purchased, you get permanent PDF access in your dashboard. You can read online, download, and print them for offline study." },
        { q: "Is there mock test support available on BodhGanga?", a: "Yes, our interactive question banks feature high-yield questions with detailed step-by-step explanatory models." },
        { q: "How do I access state-specific courses?", a: "Navigate to the 'States & UTs' portal, select your desired state or union territory, and explore maps, notes, playlists, and customized study packages." }
    ];

    return (
        <div className="min-h-screen bg-ivory-light overflow-x-hidden text-emerald-dark select-none relative font-sans">
            
            {/* -- HORIZONTAL SCROLLING BRAND TICKER -- */}
            <div className="bg-emerald-950 border-b border-gold/15 py-2.5 overflow-hidden relative z-40 flex items-center">
                <div className="w-full flex items-center relative">
                    <div className="absolute left-4 z-50 flex items-center bg-emerald-950/90 pr-3 pl-1 backdrop-blur-sm">
                        <span className="flex h-2.5 w-2.5 relative">
                            <span
                                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                style={{ backgroundColor: 'rgba(212,175,55,0.6)' }}
                            />
                            <span
                                className="relative inline-flex rounded-full h-2.5 w-2.5 shadow-[0_0_8px_rgba(212,175,55,0.6)]"
                                style={{ backgroundColor: 'rgba(212,175,55,0.6)' }}
                            />
                        </span>
                    </div>
                    <div className="w-full overflow-hidden flex select-none">
                        <div className="animate-marquee-l2r flex whitespace-nowrap text-xs font-bold uppercase tracking-widest text-gold-glow-soft gap-16">
                            {[...Array(8)].map((_, idx) => (
                                <span key={idx} className="flex items-center gap-2">
                                    India Unlocked — Decoding India, District by District
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* â”€â”€ HERO BANNER SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-dark via-emerald-dark to-emerald-950 px-6 border-b border-gold/15">
                {/* Premium Top Gold Accent Line & Moving Dot */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-[rgba(212,175,55,0.25)] flex items-center pointer-events-none z-20">
                    <div 
                        className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8),0_0_16px_rgba(212,175,55,0.5)] animate-gold-dot-move"
                        style={{
                            position: 'absolute',
                            top: '-3.5px'
                        }}
                    />
                </div>
                
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem]" />
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-light/10 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="relative w-full max-w-7xl mx-auto py-16 lg:py-24 z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        
                        {/* Hero Text */}
                        <div className="lg:col-span-7 text-left space-y-8 animate-fade-in">
                            <div className="space-y-4">
                                <div className="inline-block">
                                    <div className="inline-flex items-center gap-3 px-7 py-3.5 md:px-9 md:py-4.5 rounded-full bg-emerald-950/40 border border-gold/35 backdrop-blur-md shadow-[0_0_15px_rgba(201,169,97,0.1)] shimmer-badge">
                                        <span className="text-lg md:text-xl">ðŸ‡®ðŸ‡³</span>
                                        <span className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold tracking-wide text-gradient-gold uppercase leading-normal">
                                            India’s First Digital District Encyclopedia
                                        </span>
                                    </div>
                                    <div className="mt-3.5 pl-6 md:pl-8 text-xs md:text-sm font-bold tracking-widest text-gold/80 uppercase font-sans">
                                        NDDE — National Digital District Encyclopedia
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-4xl sm:text-6xl xl:text-7xl font-serif text-white font-bold leading-[1.1] tracking-tight">
                                    We Are Uncovering India.<br />
                                    <span className="text-gradient-gold">District by District.</span>
                                </h1>
                                <p className="text-lg text-gold font-serif leading-relaxed max-w-3xl">
                                    BodhGanga Academy presents NDDE (National Digital District Encyclopedia) — a research-backed educational initiative designed to decode India district by district through the unique concept of Horizontal Integration.
                                </p>
                                <div className="space-y-4 text-white/75 text-sm sm:text-base leading-relaxed max-w-3xl font-medium">
                                    <p>
                                        NDDE connects Geography, History, Economy, Environment, Culture, Governance, Agriculture, Current Affairs, and Strategic Importance into one structured learning framework.
                                    </p>
                                    <p>
                                        Our mission is to help learners understand the real India beyond isolated subjects by building the most comprehensive district-wise knowledge platform for UPSC, State PSC, SSC, CUET, Defence, School Education, and other competitive examinations.
                                    </p>
                                    <p>
                                        Every district lecture, infographic, MCQ set, revision module, and analytical framework is created through deep research and integrated learning methods to provide conceptual clarity along with exam-oriented preparation.
                                    </p>
                                </div>
                            </div>

                            {/* Highlight Points & Brand Line */}
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-white/95 text-xs sm:text-sm font-bold tracking-wider">
                                    <div className="flex items-center gap-2.5 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                                        <span className="text-gold">ðŸ“Œ</span> Structured & Research-Backed Content
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                                        <span className="text-gold">ðŸ“Œ</span> District-Wise Integrated Learning
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-white/5 px-4 py-3 rounded-xl border border-white/5 sm:col-span-2">
                                        <span className="text-gold">ðŸ“Œ</span> India Unlocked — District by District
                                    </div>
                                </div>
                                <div className="pt-3">
                                    <p className="text-gradient-gold text-2xl font-serif italic tracking-wider font-extrabold">
                                        Mission of Vision
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button 
                                    onClick={handleCTA}
                                    className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-gold/10 hover:shadow-gold/25 hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    {isAuthenticated ? 'Go to Dashboard' : 'Enroll Now — Free'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <Link 
                                    to="/states"
                                    className="flex items-center justify-center gap-2.5 px-8 py-4 bg-white/5 border border-white/10 hover:border-gold/30 text-white font-bold text-xs uppercase tracking-widest rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all duration-300"
                                >
                                    <Globe className="w-4 h-4 text-gold" />
                                    Explore 36 Regions
                                </Link>
                            </div>

                            {/* Trust signals */}
                            <div className="flex flex-wrap gap-8 pt-8 border-t border-white/10 max-w-xl">
                                {[
                                    { label: 'Enrolled Scholars', value: <Counter target={stats.totalUsers * 4} suffix="+" /> },
                                    { label: 'Mapped Territories', value: <Counter target={36} suffix=" regions" /> },
                                    { label: 'High-Yield Notes', value: <Counter target={stats.totalNotes} suffix="+" /> },
                                ].map((b, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="text-xl sm:text-2xl font-bold text-white font-serif tracking-tight">{b.value}</div>
                                        <div className="text-[9px] text-gold font-bold uppercase tracking-widest">{b.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Premium Interactive Slideshow */}
                        <div className="lg:col-span-5 w-full flex flex-col gap-6 mt-10 lg:mt-0 mx-auto px-4 sm:px-0">
                            {/* Text Block repositioned above the image, aligned horizontally with the image */}
                            <div className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] mx-auto text-left space-y-1">
                                <div className="text-[10px] sm:text-xs tracking-[0.25em] font-extrabold uppercase text-gold">India Unlocked ðŸ‡®ðŸ‡³</div>
                                <div className="text-[9px] sm:text-[10px] text-white/50 font-bold uppercase tracking-wider">Decoding India, District by District</div>
                                <h3 className="text-lg sm:text-2xl font-semibold font-serif text-white tracking-tight leading-tight pt-1">{slides[currentSlide].title}</h3>
                                <p className="text-xs sm:text-sm opacity-90 text-white/70 font-semibold uppercase tracking-wider">{slides[currentSlide].label}</p>
                            </div>

                            <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] h-[420px] sm:h-[500px] md:h-[560px] lg:h-[640px] rounded-[28px] overflow-hidden shadow-2xl border border-gold/25 glow-emerald-card group bg-gradient-to-b from-emerald-900 to-emerald-950 flex items-center justify-center">
                                {/* Slides */}
                                {slides.map((slide, idx) => (
                                    <div
                                        key={idx}
                                        className={`absolute inset-0 w-full h-full overflow-hidden rounded-[28px] bg-gradient-to-b from-emerald-900 to-emerald-950 flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
                                            currentSlide === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                        }`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-[28px] z-10 pointer-events-none" />
                                        <img
                                            src={slide.image}
                                            alt={slide.label}
                                            className="w-full h-full object-cover object-top rounded-[28px] transition-all duration-700"
                                        />
                                    </div>
                                ))}
                                
                                {/* Navigation dots in gold */}
                                <div className="absolute top-6 right-6 z-20 flex gap-2">
                                    {slides.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentSlide(idx)}
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                                currentSlide === idx ? 'bg-gold w-5' : 'bg-white/40 hover:bg-white/70'
                                            }`}
                                            aria-label={`Go to slide ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* â”€â”€ STATS STRIP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="bg-white border-b border-emerald/5 py-10 shadow-sm relative z-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: <Counter target={stats.totalNotes} suffix="+" />, label: 'Exhaustive PDFs', icon: 'ðŸ“–' },
                            { value: <Counter target={stats.totalNotes * 6} suffix="+" />, label: 'Mock MCQs', icon: 'â“' },
                            { value: <Counter target={36} />, label: 'Mapped Territories', icon: 'ðŸ—ºï¸' },
                            { value: <Counter target={stats.totalUsers * 4} suffix="+" />, label: 'Active Learners', icon: 'ðŸŽ“' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center space-y-1">
                                <div className="text-2xl mb-1">{stat.icon}</div>
                                <div className="text-3xl font-extrabold text-emerald font-serif tracking-tight">{stat.value}</div>
                                <div className="text-[9px] text-emerald/60 font-bold uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
 
            {/* â”€â”€ TRUSTED BY ASPIRANTS BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="bg-emerald-950/95 py-6 border-b border-gold/15 overflow-hidden relative z-20">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-3">
                    <p className="text-[10px] text-gold font-bold uppercase tracking-widest leading-none">TRUSTED BY ASPIRANTS NATIONWIDE IN EVERY MAJOR PSC STATE</p>
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-2">
                        {['UPSC CSE', 'BPSC (BIHAR)', 'MPSC (MAHARASHTRA)', 'UPPSC (UTTAR PRADESH)', 'RAS (RAJASTHAN)', 'MPPSC (MADHYA PRADESH)', 'KPSC (KARNATAKA)'].map((p, idx) => (
                            <span key={idx} className="px-4 py-1.5 bg-white/5 border border-gold/10 hover:border-gold/30 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all duration-300">
                                ðŸ›¡ï¸ {p}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* â”€â”€ ABOUT BODHGANGA ACADEMY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section 
                id="about" 
                ref={aboutSectionRef}
                className={`py-24 bg-white px-6 border-b border-emerald/5 relative z-20 transition-all duration-[1000ms] ease-out ${
                    aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
                }`}
            >
                {/* Faint India Map Watermark Texture */}
                <div 
                    className="absolute inset-0 pointer-events-none select-none bg-contain bg-no-repeat z-0" 
                    style={{
                        backgroundImage: `url(${indiaMap})`,
                        backgroundPosition: 'right 5% center',
                        opacity: 0.05,
                        mixBlendMode: 'multiply'
                    }}
                />
                
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="space-y-8">
                        {/* Logo Centered */}
                        <div className="flex justify-center opacity-90 select-none">
                            <img 
                                src="/logo.png" 
                                alt="BodhGanga Academy Logo" 
                                className="w-[72px] md:w-[105px] h-auto object-contain rounded-full border-2 border-gold/20 shadow-md"
                                style={{
                                    filter: 'brightness(1.05) contrast(1.05)'
                                }}
                            />
                        </div>

                        {/* Title block */}
                        <div className="space-y-4">
                            <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest leading-none">Our Genesis</span>
                            <h2 className="text-3xl sm:text-5xl font-bold font-serif text-emerald-dark tracking-tight">
                                About BodhGanga Academy
                            </h2>
                            <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                        </div>

                        {/* Body text aligned left/center for premium look */}
                        <div className="space-y-6 text-emerald-dark/85 text-sm sm:text-base leading-relaxed font-medium text-left max-w-3xl mx-auto">
                            <p className="text-lg sm:text-xl text-emerald font-serif font-semibold leading-relaxed text-center">
                                BodhGanga Academy is a research-driven educational platform built to help learners understand India in its truest grassroots form.
                            </p>
                            <p className="font-bold text-emerald-dark text-center text-base sm:text-lg">
                                India is not just a nation of states—it is a nation of districts.
                            </p>
                            <div className="space-y-4 pt-2">
                                <p>
                                    Every district carries its own geography, history, culture, economy, ecology, governance structure, and historical identity.
                                </p>
                                <p>
                                    Traditional education often explains India only at the national or state level. BodhGanga Academy bridges this gap through NDDE — National Digital District Encyclopedia — a pioneering long-term initiative dedicated to documenting every district of India in a structured, multi-dimensional, and digitally accessible format.
                                </p>
                                <p>
                                    Through district-wise lectures, infographics, revision modules, analytical frameworks, and integrated knowledge systems, BodhGanga is building India’s most comprehensive district-based learning ecosystem.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* â”€â”€ ABOUT THE FOUNDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-24 bg-ivory-light px-6 border-b border-emerald/5 relative z-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                        {/* LEFT: Text content */}
                        <div className="lg:col-span-7 space-y-8 order-2 lg:order-1 text-left">
                            <div className="space-y-4">
                                <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest leading-none">The Leadership Vision</span>
                                <h2 className="text-3xl sm:text-5xl font-bold font-serif text-emerald-dark tracking-tight">
                                    About the Founder
                                </h2>
                                <div className="w-16 h-1 bg-gold rounded-full" />
                            </div>

                            <div className="space-y-5 text-emerald-dark/85 text-sm sm:text-base leading-relaxed font-medium">
                                <p className="text-lg text-emerald font-serif font-semibold leading-relaxed">
                                    Prateek Bhargava is an educator, researcher, and the founder of BodhGanga Academy and the National Digital District Encyclopedia (NDDE) — India’s First Digital District Encyclopedia.
                                </p>
                                <p>
                                    Alongside his educational initiatives, he has been serving as Deputy Manager at MTNL (Department of Telecommunication) since 2009.
                                </p>
                                <p>
                                    Having personally experienced the competitive examination ecosystem, he developed a strong vision to create educational resources that go beyond rote memorization and fragmented learning.
                                </p>
                                <p>
                                    This vision led to the creation of NDDE — a structured, research-backed digital initiative documenting every district of India through Horizontal Integration.
                                </p>

                                <div className="space-y-3 pt-3">
                                    <p className="font-bold text-xs uppercase tracking-wider text-emerald-dark">Under his leadership, BodhGanga Academy continues building:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-emerald-dark/95">
                                        <div className="flex items-center gap-2.5 bg-white/70 px-4 py-2.5 rounded-xl border border-emerald/5 shadow-sm">
                                            <span className="text-gold">âœ¨</span> district-wise comprehensive lectures
                                        </div>
                                        <div className="flex items-center gap-2.5 bg-white/70 px-4 py-2.5 rounded-xl border border-emerald/5 shadow-sm">
                                            <span className="text-gold">âœ¨</span> exam-oriented notes
                                        </div>
                                        <div className="flex items-center gap-2.5 bg-white/70 px-4 py-2.5 rounded-xl border border-emerald/5 shadow-sm">
                                            <span className="text-gold">âœ¨</span> MCQ banks
                                        </div>
                                        <div className="flex items-center gap-2.5 bg-white/70 px-4 py-2.5 rounded-xl border border-emerald/5 shadow-sm">
                                            <span className="text-gold">âœ¨</span> revision frameworks
                                        </div>
                                        <div className="flex items-center gap-2.5 bg-white/70 px-4 py-2.5 rounded-xl border border-emerald/5 shadow-sm">
                                            <span className="text-gold">âœ¨</span> infographics
                                        </div>
                                        <div className="flex items-center gap-2.5 bg-white/70 px-4 py-2.5 rounded-xl border border-emerald/5 shadow-sm">
                                            <span className="text-gold">âœ¨</span> cultural & environmental archives
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Core belief block */}
                            <div className="mt-8 p-6 bg-emerald/5 border-l-4 border-gold rounded-r-2xl shadow-sm">
                                <span className="text-gold text-2xl font-serif leading-none">â€œ</span>
                                <p className="text-base font-serif italic text-emerald-dark font-semibold -mt-2 leading-relaxed">
                                    To truly understand India, one must understand its districts.
                                </p>
                            </div>
                        </div>

                        {/* RIGHT: Founder photo on one side */}
                        <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
                            <div className="relative group w-full max-w-[360px] h-[440px] rounded-3xl overflow-hidden shadow-2xl border border-gold/20 p-2 bg-white">
                                <div className="absolute inset-0 border border-gold/10 rounded-[22px] m-1 pointer-events-none z-10" />
                                <img
                                    src="/prateek-sir.png"
                                    alt="Prateek Bhargava Portrait"
                                    loading="lazy"
                                    className="w-full h-full object-cover object-center rounded-[20px] filter grayscale-[15%] brightness-[0.98] contrast-[1.03] transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                                />
                                <div className="absolute bottom-6 left-6 right-6 bg-emerald-950/90 backdrop-blur-md border border-gold/20 p-4 rounded-2xl z-20 text-center">
                                    <h4 className="text-white font-serif font-bold text-xs tracking-wide">Deputy Manager, MTNL</h4>
                                    <p className="text-gold font-sans font-bold text-[8px] uppercase tracking-widest mt-1">Telecom Officer Since 2009</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* â”€â”€ MISSION & VISION SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-24 bg-gradient-to-b from-emerald-950 to-emerald-dark text-white px-6 relative overflow-hidden border-b border-gold/15 z-20">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
                <div className="absolute top-1/2 left-1/4 w-[500px] h-[300px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16 space-y-4">
                        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest leading-none flex items-center justify-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-gold" /> MAPPED BY HORIZONTAL INTEGRATION
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-bold font-serif text-white tracking-wide">
                            NDDE Mission & Vision
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                        {/* Mission Card */}
                        <div className="card-premium relative bg-slate-900/60 backdrop-blur-xl border border-gold/25 rounded-3xl p-8 lg:p-10 shadow-2xl flex flex-col justify-between group hover:border-gold transition-all duration-300">
                            <div className="space-y-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-gold to-gold-dark rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                                    <span className="text-2xl text-emerald-dark">ðŸŽ¯</span>
                                </div>
                                <h3 className="text-2xl font-bold font-serif text-white tracking-tight">Our Mission</h3>
                                <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                                    <p className="font-semibold text-gold">
                                        To build the most comprehensive research-backed district-wise digital knowledge platform ever created for India.
                                    </p>
                                    <p>
                                        Through NDDE, we aim to present India’s districts as complete living systems—helping students, educators, and citizens explore the country through an integrated multidimensional learning framework.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Vision Card */}
                        <div className="card-premium relative bg-slate-900/60 backdrop-blur-xl border border-gold/25 rounded-3xl p-8 lg:p-10 shadow-2xl flex flex-col justify-between group hover:border-gold transition-all duration-300">
                            <div className="space-y-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-gold to-gold-dark rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                                    <span className="text-2xl text-emerald-dark">ðŸ‘ï¸</span>
                                </div>
                                <h3 className="text-2xl font-bold font-serif text-white tracking-tight">Our Vision</h3>
                                <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                                    <p className="font-semibold text-gold">
                                        To establish a permanent national digital knowledge archive documenting India in its true grassroots form.
                                    </p>
                                    <p>
                                        By combining academic precision, technology, and visual learning, BodhGanga Academy aims to become the definitive repository of regional knowledge for current learners and future generations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* â”€â”€ BRANDS & BENEFITS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-24 bg-ivory-light px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest flex items-center justify-center gap-1.5">
                            <Flame className="w-3 h-3 text-gold fill-gold" /> Why Serious Aspirants Choose BodhGanga
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-bold font-serif text-emerald-dark">Rigorous EdTech Architecture</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: MapPin, title: "All 36 Regions Mapped", desc: "No more hunting for local GK. We map history, geography, economy, and administrative dynamics for all 28 states and 8 UTs." },
                            { icon: BookOpenCheck, title: "Bilingual Premium Notes", desc: "Structured, syllabus-aligned PDF textbooks crafted by top civil services strategists, featuring crisp roadmaps and high-yield layouts." },
                            { icon: Users, title: "Cinematic Learning Ecosystem", desc: "Seamlessly integrates direct notes store, visual roadmap timelines, curated mock tests, and a Netflix-style YouTube video playlist hub." }
                        ].map((f, i) => (
                            <div key={i} className="card-premium bg-white p-8 flex flex-col group hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 rounded-2xl bg-emerald/10 text-emerald flex items-center justify-center mb-6 group-hover:bg-emerald group-hover:text-white transition-all duration-300 shadow-sm">
                                    <f.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-emerald-dark mb-3 font-serif tracking-tight">{f.title}</h3>
                                <p className="text-xs text-emerald-dark/60 leading-relaxed font-medium">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* â”€â”€ FEATURED STATES & UTS SHOWCASE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-24 bg-gradient-to-b from-emerald-950 to-slate-950 text-white px-6 relative overflow-hidden border-y border-gold/15">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
                        <div className="text-left space-y-3">
                            <div className="inline-flex items-center gap-1.5 bg-gold/10 px-3 py-1 rounded-full border border-gold/25 text-gold text-[10px] font-bold uppercase tracking-widest">
                                <Sparkles className="w-3.5 h-3.5" /> Regional Academic Portals
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-serif text-white font-bold leading-tight uppercase tracking-wide">
                                Featured <span className="text-gradient-gold">PSC Hubs</span>
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                                Dedicated study rooms with micro-syllabi, topper roadmaps, regional questionnaires, and specialized video lecture libraries.
                            </p>
                        </div>
                        <Link 
                            to="/states" 
                            className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold hover:text-white transition-colors"
                        >
                            Explore All 36 Regions <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {featuredStates.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredStates.map(state => (
                                <div key={state.id} className="card-premium relative bg-slate-900 border border-emerald-950/60 hover:border-gold/30 rounded-2xl overflow-hidden group flex flex-col justify-between h-[360px] glow-emerald-card">
                                    {/* Thumbnail */}
                                    <div className="h-40 overflow-hidden relative border-b border-emerald-950/60">
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors z-10" />
                                        <img 
                                            src={state.image} 
                                            alt={state.name} 
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                        />
                                        <span className="absolute top-4 left-4 z-20 text-[10px] font-black uppercase bg-gold text-emerald-dark px-3 py-1 rounded-full shadow-md">
                                            {state.exam} Exam
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <h3 className="font-serif font-bold text-white text-lg group-hover:text-gold transition-colors">
                                                {state.name} Civil Services
                                            </h3>
                                            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                                                {state.prepExplanation}
                                            </p>
                                        </div>

                                        {/* Stats & CTA */}
                                        <div className="pt-4 border-t border-emerald-950 mt-4">
                                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-4">
                                                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-gold" /> {state.notesCount} Books</span>
                                                <span className="flex items-center gap-1"><Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 animate-pulse" /> {state.videosCount} Lectures</span>
                                            </div>
                                            <button 
                                                onClick={() => navigate(`/states/${state.id}`)}
                                                className="w-full py-2 bg-slate-800 hover:bg-gradient-to-r hover:from-gold hover:to-gold-dark text-slate-200 hover:text-emerald-dark font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 active:scale-95 border border-emerald-900/40"
                                            >
                                                Enter Portal
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-900/40 rounded-3xl border border-emerald-950">
                            Academic portals are dynamically generating. Mapped regions will appear here.
                        </div>
                    )}
                </div>
            </section>

            {/* â”€â”€ FREE RESOURCES SHELF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-20 bg-ivory-light border-b border-emerald/5 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
                        <div className="text-left space-y-2">
                            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Free Resources</span>
                            <h2 className="text-3xl font-bold font-serif text-emerald-dark">Free Scholar Materials</h2>
                        </div>
                        <Link to="/free-resources" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-emerald hover:text-gold transition-colors">
                            Explore Free Library <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {freeResources.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {freeResources.map(product => (
                                <div key={product.id} className="card-premium bg-white border border-emerald/5 hover:border-gold/30 rounded-2xl overflow-hidden group flex flex-col justify-between h-[360px] relative shadow-sm">
                                    <span className="absolute top-4 left-4 z-20 text-[9px] font-black uppercase bg-gold text-emerald-dark px-2.5 py-0.5 rounded-full shadow-md">
                                        FREE
                                    </span>
                                    
                                    {/* Thumbnail */}
                                    <div className="h-40 overflow-hidden relative bg-slate-900 border-b border-emerald/5">
                                        <img 
                                            src={product.previewUrl || "https://picsum.photos/400/250?random=free"} 
                                            alt={product.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="flex gap-2 text-[8px] font-black uppercase text-gold">
                                                <span>{product.state || 'All India'}</span>
                                                {product.district && <span>· {product.district}</span>}
                                            </div>
                                            <h3 className="font-serif font-bold text-emerald-dark text-sm group-hover:text-gold transition-colors line-clamp-2">
                                                {product.title}
                                            </h3>
                                        </div>

                                        {/* Claim CTA */}
                                        <div className="pt-4 border-t border-emerald/5 mt-4">
                                            <button
                                                onClick={() => handleClaim(product.id, product.title)}
                                                disabled={claimingId === product.id}
                                                className="w-full py-2.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                                            >
                                                {claimingId === product.id ? (
                                                    <><div className="w-3.5 h-3.5 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" /> Unlocking...</>
                                                ) : (
                                                    <><CheckCircle className="w-3.5 h-3.5" /> Get Free Access</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-emerald-dark/50 text-xs font-bold uppercase tracking-widest bg-white rounded-3xl border border-emerald/5">
                            Loading free scholar guides & maps...
                        </div>
                    )}
                </div>
            </section>

            {/* â”€â”€ YOUTUBE PREVIEW SHOWCASE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-24 bg-slate-950 border-b border-gold/15 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.02)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem]" />
                <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-emerald-light/5 rounded-full blur-[140px] pointer-events-none" />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16 space-y-4">
                        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest flex items-center justify-center gap-1.5">
                            <Play className="w-3.5 h-3.5 text-gold fill-gold" /> Cinema Hall Lectures
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-bold font-serif text-white leading-tight">
                            Latest <span className="text-gradient-gold">YouTube Videos</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto font-medium">
                            Explore our latest official classes & mapping guides. Click to start learning instantly in new tab.
                        </p>
                    </div>

                    {latestVideos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {latestVideos.map((video) => (
                                <div 
                                    key={video.id || video.videoId} 
                                    className="netflix-card shadow-2xl hover:scale-[1.03] transition-all duration-500 relative group border border-gold/10 hover:border-gold/30 rounded-2xl overflow-hidden glow-emerald-card aspect-video h-auto cursor-pointer"
                                    onClick={() => window.open(video.youtubeUrl, '_blank')}
                                >
                                    <img 
                                        src={video.thumbnailUrl || video.thumbnail} 
                                        alt={video.title} 
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:brightness-[0.7] group-hover:scale-105 transition-all duration-700"
                                    />
                                    
                                    <span className="absolute top-4 left-4 z-20 text-[8px] font-black uppercase bg-gold text-emerald-dark px-2.5 py-0.5 rounded-md tracking-wider">
                                        YOUTUBE
                                    </span>

                                    <span className="absolute bottom-3 right-3 text-[8px] font-extrabold uppercase px-2 py-0.5 bg-black/80 rounded tracking-widest text-white z-20">
                                        {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : 'LATEST'}
                                    </span>

                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gold/90 text-emerald-dark rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-125 pointer-events-none z-20">
                                        <Play className="w-6 h-6 fill-emerald-dark text-emerald-dark ml-1" />
                                    </div>

                                    <div className="netflix-card-overlay text-left p-6">
                                        <h4 className="text-xs sm:text-sm font-bold text-white font-serif tracking-wide line-clamp-2 mb-1 group-hover:text-gold transition-colors">
                                            {video.title}
                                        </h4>
                                        <p className="text-[9px] text-gold font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-gold" /> YouTube Channel Video
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-900/40 rounded-3xl border border-emerald-950">
                            Synchronizing official video broadcast feeds...
                        </div>
                    )}
                </div>
            </section>

            {/* â”€â”€ BESTSELLERS STUDY NOTES SHELF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-20 bg-white border-y border-emerald/5 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
                        <div className="text-left space-y-2">
                            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Premium Notes Store</span>
                            <h2 className="text-3xl font-bold font-serif text-emerald-dark">Trending Study Packages</h2>
                        </div>
                        <Link to="/store" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-emerald hover:text-gold transition-colors">
                            Browse Bookstore <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {popularNotes.map((note, i) => (
                            <div key={i} className="card-premium bg-ivory-light border border-emerald/5 p-6 flex flex-col relative group">
                                <span className="absolute top-4 right-4 bg-emerald-dark text-gold font-extrabold text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-gold/15">
                                    {note.badge}
                                </span>
                                <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold-dark flex items-center justify-center mb-4">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <h3 className="font-serif font-bold text-emerald-dark text-base leading-snug mb-2 group-hover:text-emerald transition-colors">
                                    {note.title}
                                </h3>
                                <p className="text-[10px] text-emerald-dark/50 uppercase tracking-widest font-bold mb-4">{note.state} Category</p>
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center gap-0.5 text-gold">
                                        {[...Array(5)].map((_, idx) => <Star key={idx} className="w-3.5 h-3.5 fill-gold text-gold" />)}
                                    </div>
                                    <span className="text-[10px] text-emerald-dark/60 font-bold">{note.rating} ({note.sales})</span>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-emerald/5 mt-auto">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-xl font-bold text-emerald-dark">{note.price}</span>
                                        <span className="text-[9px] text-emerald font-extrabold tracking-wider bg-emerald/10 px-2 py-0.5 rounded uppercase">{note.discount}</span>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/store')}
                                        className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-800 hover:to-emerald text-white text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300"
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* â”€â”€ TOPPERS & SOCIAL VALIDATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-24 bg-gradient-to-b from-ivory to-white px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest">Toppers Gallery</span>
                        <h2 className="text-3xl sm:text-5xl font-bold font-serif text-emerald-dark">Trusted by Civil Service Rankers</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {toppers.map((t, i) => (
                            <div key={i} className="card-premium bg-white p-8 flex flex-col justify-between hover:shadow-xl transition-all">
                                <div className="space-y-4">
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-gold fill-gold" />)}
                                    </div>
                                    <p className="text-emerald-dark/80 text-xs italic leading-relaxed font-semibold">"{t.quote}"</p>
                                </div>
                                <div className="flex items-center gap-4.5 pt-6 border-t border-emerald/5 mt-8">
                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald to-emerald-dark rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                                        {t.name[0]}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-emerald-dark text-xs">{t.name}</div>
                                        <div className="text-[9px] text-gold font-bold uppercase tracking-wider mt-0.5">{t.exam} · {t.rank}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* â”€â”€ FAQ SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-24 bg-ivory-light px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest">Support Portal</span>
                        <h2 className="text-3xl font-bold font-serif text-emerald-dark">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="card-premium bg-white p-5 cursor-pointer transition-all duration-300"
                                onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                                <div className="flex justify-between items-center">
                                    <h3 className="font-serif font-bold text-sm text-emerald-dark pr-6">{faq.q}</h3>
                                    <ChevronDown className={`w-4 h-4 text-emerald/60 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                                </div>
                                {activeFaq === i && (
                                    <p className="text-xs text-emerald-dark/70 font-semibold leading-relaxed mt-4 pt-4 border-t border-emerald/5 animate-fade-in">
                                        {faq.a}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* â”€â”€ FOOTER HERO CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-24 bg-emerald-dark relative overflow-hidden px-6 text-center border-t border-gold/15 mb-16 md:mb-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.02)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[130px] pointer-events-none" />
                
                <div className="relative max-w-4xl mx-auto space-y-8 z-10">
                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white font-serif leading-tight">
                        Begin Your Modern Learning Path
                    </h2>
                    <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto font-medium">
                        Join over <strong className="text-gold">5,400+ serious aspirants</strong> utilizing BodhGanga Academy resources to master regional civil service examinations.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <button 
                            onClick={handleCTA}
                            className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-gold/10 hover:shadow-gold/25 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            {isAuthenticated ? 'Go to Dashboard' : 'Enroll Now — Free'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <Link 
                            to="/states"
                            className="flex items-center justify-center gap-2.5 px-8 py-4 bg-white/5 border border-white/10 hover:border-gold/30 text-white font-bold text-xs uppercase tracking-widest rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all duration-300"
                        >
                            <Globe className="w-4 h-4 text-gold" />
                            Browse State Catalogs
                        </Link>
                    </div>
                </div>
            </section>

            {/* â”€â”€ STICKY FOOTER ACTION BUTTON BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {scrolled && (
                <div className="sticky-cta-bar flex items-center justify-between animate-fade-in block md:hidden z-[9999]">
                    <div className="text-left pr-4">
                        <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest">BodhGanga Academy</p>
                        <p className="text-xs font-serif font-bold text-white">Start preparation today</p>
                    </div>
                    <button 
                        onClick={handleCTA}
                        className="px-6 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg"
                    >
                        Enroll Now
                    </button>
                </div>
            )}

            {/* â”€â”€ VIDEO PLAYER MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-fade-in">
                    <div className="relative w-full max-w-4xl bg-emerald-950 border border-gold/30 rounded-3xl overflow-hidden shadow-2xl">
                        <button 
                            onClick={() => setSelectedVideo(null)}
                            className="absolute top-4 right-4 bg-emerald/10 hover:bg-emerald/30 border border-gold/30 text-white font-bold px-3 py-1 rounded-full text-xs uppercase z-[10000]"
                        >
                            âœ• Close
                        </button>
                        
                        <div className="aspect-video w-full">
                            <iframe 
                                className="w-full h-full"
                                src={selectedVideo.youtubeUrl}
                                title={selectedVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        
                        <div className="p-6 text-left space-y-2">
                            <span className="text-[8px] text-gold font-bold uppercase tracking-widest">{selectedVideo.category}</span>
                            <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-snug pr-12">{selectedVideo.title}</h3>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Landing;


