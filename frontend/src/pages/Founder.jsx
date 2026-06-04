import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import { 
    Award, BookOpen, Compass, Landmark, Briefcase, 
    MessageSquare, CheckCircle, ChevronRight, Sparkles 
} from 'lucide-react';
import founderImage from '/prateek-sir.png';
import indiaMap from '../assets/images/india-map.webp';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { type: "spring", stiffness: 100, damping: 15 } 
    }
};

const Founder = () => {
    useSEO({
        title: "Founder & CEO - Prateek Bhargava - BodhGanga Academy",
        description: "Read the professional journey and vision of Prateek Bhargava, Founder of BodhGanga Academy & NDDE. Learn about his telecom career, exam background, and the Horizontal Integration philosophy.",
        keywords: "Prateek Bhargava, Founder BodhGanga, BodhGanga CEO, MTNL Deputy Manager, Horizontal Integration creator",
        ogTitle: "Founder & CEO - Prateek Bhargava",
        ogDescription: "Discover how Prateek Bhargava's background at MTNL and competitive exams inspired India's First Digital District Encyclopedia.",
        ogImage: "/prateek-sir.png"
    });


    const achievements = [
        { title: "Telecom Leader", desc: "Serving as Deputy Manager at MTNL (Department of Telecommunications) since 2009.", icon: Briefcase },
        { title: "Exam Veteran", desc: "Successfully cleared multiple national competitive examinations, mastering the testing ecosystem.", icon: Award },
        { title: "Ecosystem Architect", desc: "Designed the 'Horizontal Integration' methodology to bridge separated GS disciplines.", icon: Compass },
        { title: "Education Reformer", desc: "Pioneering the National Digital District Encyclopedia (NDDE) to map all 780+ districts.", icon: BookOpen }
    ];

    const timelineItems = [
        {
            year: "2009 - Present",
            title: "MTNL Leadership & Academic Research",
            desc: "Serving as Deputy Manager at MTNL (DoT), while systematically analyzing public service exam patterns and noting the lack of interdisciplinary connections in general studies."
        },
        {
            year: "Competitive Examination Journey",
            title: "Mastering the Testing Landscape",
            desc: "Cleared multiple competitive examinations, experiencing firsthand the struggle of aspirants trying to compile local GK from fragmented sources and official archives."
        },
        {
            year: "Birth of NDDE & Horizontal Integration",
            title: "Bridging the Rote-Learning Void",
            desc: "Pioneered the 'Horizontal Integration' framework. This realization led to the founding of BodhGanga Academy to document India contextually at the district level."
        },
        {
            year: "Long-Term Mission",
            title: "Decentralizing National Knowledge",
            desc: "Directing the production of exhaustive lectures, revision modules, infographics, and geography challenges to preserve district-level data for future generations."
        }
    ];

    return (
        <div className="min-h-screen bg-ivory-light text-emerald-dark font-sans relative overflow-hidden select-none">
            {/* Watermark */}
            <div 
                className="absolute inset-0 pointer-events-none select-none bg-contain bg-no-repeat z-0" 
                style={{
                    backgroundImage: `url(${indiaMap})`,
                    backgroundPosition: 'right 5% center',
                    opacity: 0.02,
                    mixBlendMode: 'multiply'
                }}
            />

            {/* ── HERO BANNER ────────────────────────────────────────── */}
            <section className="relative bg-gradient-to-b from-emerald-dark via-emerald-dark to-emerald-950 px-6 border-b border-gold/15 py-24 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.02)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem]" />
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-light/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
                    {/* Left: Biography Details */}
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="lg:col-span-7 space-y-6 text-left"
                    >
                        <motion.div 
                            variants={itemVariants}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-900/40 border border-gold/30 shadow-lg shimmer-badge"
                        >
                            <Sparkles className="w-4 h-4 text-gold" />
                            <span className="text-xs font-bold tracking-widest text-gold uppercase font-serif">Leadership & Vision</span>
                        </motion.div>

                        <motion.h1 
                            variants={itemVariants}
                            className="text-4xl sm:text-6xl font-serif text-white font-bold leading-tight"
                        >
                            Prateek Bhargava
                        </motion.h1>

                        <motion.p 
                            variants={itemVariants}
                            className="text-lg text-gold font-serif leading-relaxed italic"
                        >
                            Founder & CEO, BodhGanga Academy
                        </motion.p>

                        <motion.p 
                            variants={itemVariants}
                            className="text-sm sm:text-base text-white/80 leading-relaxed max-w-2xl font-medium"
                        >
                            An educator, researcher, and public service mentor, Prateek Bhargava is the driving force behind the National Digital District Encyclopedia (NDDE). With a background in telecommunications and a career in public sector leadership, he is dedicated to transforming how general studies are taught in India.
                        </motion.p>
                    </motion.div>

                    {/* Right: Portrait Image */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="lg:col-span-5 flex justify-center"
                    >
                        <div className="relative group max-w-sm w-full">
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-gold to-gold-dark rounded-3xl blur opacity-35 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
                            <div className="relative bg-emerald-950 rounded-3xl p-3 border border-gold/25 shadow-2xl overflow-hidden aspect-[4/5] flex items-center justify-center">
                                <img 
                                    src={founderImage} 
                                    alt="Prateek Bhargava" 
                                    className="w-full h-full object-cover rounded-2xl grayscale hover:grayscale-0 transition-all duration-700"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600";
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── KEY ACCOMPLISHMENTS ──────────────────────────────────── */}
            <section className="bg-white border-b border-emerald/5 py-16 relative z-10">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {achievements.map((item, idx) => {
                            const IconComponent = item.icon;
                            return (
                                <div key={idx} className="p-6 bg-ivory-light border border-emerald/5 rounded-3xl space-y-4 text-left shadow-sm">
                                    <div className="w-10 h-10 rounded-xl bg-emerald/5 text-emerald flex items-center justify-center">
                                        <IconComponent className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-sm font-bold font-serif text-emerald-dark">{item.title}</h4>
                                    <p className="text-xs text-emerald-dark/70 leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── FOUNDER MESSAGE (STYLIZED BLOCKQUOTE) ────────────────── */}
            <section className="py-20 max-w-4xl mx-auto px-6 relative z-10 text-center">
                <div className="relative space-y-6">
                    <div className="text-4xl text-gold font-serif opacity-30">“</div>
                    <p className="text-xl sm:text-2xl font-serif text-emerald-dark italic leading-relaxed max-w-2xl mx-auto">
                        To truly understand India, one must understand its districts. The real India is not a macro abstraction—it is a network of local stories, resource structures, and governance challenges.
                    </p>
                    <div className="text-4xl text-gold font-serif opacity-30">”</div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold uppercase tracking-wider font-serif text-gold">Prateek Bhargava</h4>
                        <p className="text-[10px] text-emerald-dark/60 uppercase tracking-widest font-bold">Founder & CEO, BodhGanga Academy</p>
                    </div>
                </div>
            </section>

            {/* ── PROFESSIONAL TIMELINE & EXPERIENCE ───────────────────── */}
            <section className="py-20 bg-white border-y border-emerald/5 px-6 relative z-10">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Chronicles & Experience</span>
                        <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">Professional Journey</h2>
                        <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                    </div>

                    <div className="relative border-l-2 border-gold/30 pl-8 ml-4 space-y-10 text-left">
                        {timelineItems.map((item, idx) => (
                            <div key={idx} className="relative space-y-2">
                                <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-gold border-4 border-white" />
                                <span className="text-xs text-gold font-bold font-serif">{item.year}</span>
                                <h3 className="text-base font-bold font-serif text-emerald-dark">{item.title}</h3>
                                <p className="text-xs sm:text-sm text-emerald-dark/70 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PHILOSOPHY OF HORIZONTAL INTEGRATION ───────────────── */}
            <section className="py-20 max-w-5xl mx-auto px-6 relative z-10 text-left">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                    <div className="md:col-span-7 space-y-6">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Bridging fragmented subjects</span>
                        <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">Horizontal Integration Concept</h2>
                        <div className="w-12 h-1 bg-gold rounded-full" />
                        <div className="space-y-4 text-emerald-dark/85 text-xs sm:text-sm leading-relaxed font-medium">
                            <p>
                                Traditional test preparation tools split studies into isolated subjects: Geography, History, Economy, and Culture are studied on completely separate timelines. 
                            </p>
                            <p>
                                Prateek Bhargava developed **Horizontal Integration** to counteract this disconnect. By exploring a location's details contextually, learners trace how physical geography shapes regional economies, how historical demographics drive social systems, and how administrative borders structure trade networks.
                            </p>
                            <p>
                                This interdisciplinary method moves students away from rote memorization and prepares them for the complex, analytical general studies papers found in modern civil service exams.
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-5">
                        <div className="card-premium p-8 bg-emerald-950 text-white border border-gold/25 rounded-3xl shadow-xl space-y-4 text-left">
                            <h4 className="text-base font-bold font-serif text-gold">Educational Contributions</h4>
                            <p className="text-xs text-white/70 leading-relaxed font-medium">
                                Under his leadership, BodhGanga Academy has been creating:
                            </p>
                            <ul className="space-y-2 text-[11px] text-white/80 font-medium">
                                <li className="flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                    <span>Detailed District Lectures</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                    <span>Bilingual PDF Revision Notes</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                    <span>High-Yield Subject MCQs</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                    <span>Visual Infographics & Mapping grids</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── INDIA UNLOCKED BANNER ───────────────────────────────── */}
            <section className="bg-gradient-to-r from-emerald-dark via-emerald-950 to-emerald-dark py-14 border-b border-gold/15 text-center relative overflow-hidden z-10">
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[rgba(212,175,55,0.2)]" />
                <div className="max-w-4xl mx-auto px-6 space-y-3">
                    <p className="text-[10px] text-gold font-bold uppercase tracking-[0.25em] leading-none mb-1">National Knowledge Mission</p>
                    <h2 className="text-2xl sm:text-4xl font-serif text-white font-bold leading-tight">
                        India Unlocked — District by District
                    </h2>
                    <p className="text-xs text-white/60 max-w-xl mx-auto leading-relaxed">
                        Join Prateek Bhargava and the BodhGanga research team in documenting and mapping India's civilizational mosaic.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default Founder;
