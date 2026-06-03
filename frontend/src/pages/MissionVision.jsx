import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import { 
    Target, Eye, Heart, ShieldCheck, Compass, Sparkles, 
    BookOpen, Layers, Award, ChevronRight 
} from 'lucide-react';
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

const MissionVision = () => {
    useSEO({
        title: "Mission & Vision - BodhGanga Academy",
        description: "Read the core mission, vision, values, and long-term goals of BodhGanga Academy. Discover how we're mapping India's civilizational mosaic district by district.",
        keywords: "BodhGanga Academy Mission, BodhGanga Vision, Core Values Education, Academic Excellence India",
        ogTitle: "Mission & Vision - BodhGanga Academy",
        ogDescription: "To build the most comprehensive, research-backed district-level digital knowledge repository for India. Explore our core values and future milestones.",
        ogImage: "/logo.png"
    });

    const coreValues = [
        {
            title: "Academic Precision",
            desc: "Conducting rigorous, verified, and location-based primary and secondary research for exam correctness.",
            icon: ShieldCheck
        },
        {
            title: "Grassroots Access",
            desc: "Democratizing complex regional details, making high-quality local GK accessible to rural and urban learners alike.",
            icon: Heart
        },
        {
            title: "Interdisciplinary Mapping",
            desc: "Pioneering the Horizontal Integration method to connect geography, economics, and history into a single narrative.",
            icon: Compass
        },
        {
            title: "Civilizational Preservation",
            desc: "Creating a permanent digital registry documenting tribal dialects, local folklore, and unsung freedom struggles.",
            icon: Sparkles
        }
    ];

    const milestones = [
        { title: "Complete National Mapping", desc: "Cataloging all 780+ districts of India under the NDDE framework, building the most extensive geographical catalog available." },
        { title: "Digital Heritage Museum", desc: "Developing interactive audio/visual archives for tribal dialects, local art forms, and geo-tagged archaeological sites." },
        { title: "Academic Integration", desc: "Partnering with school boards, state education departments, and coaching institutes to implement districtGK into core curricula." }
    ];

    return (
        <div className="min-h-screen bg-ivory-light text-emerald-dark font-sans relative overflow-hidden select-none">
            {/* Watermark */}
            <div 
                className="absolute inset-0 pointer-events-none select-none bg-contain bg-no-repeat z-0" 
                style={{
                    backgroundImage: `url(${indiaMap})`,
                    backgroundPosition: 'left 5% center',
                    opacity: 0.02,
                    mixBlendMode: 'multiply'
                }}
            />

            {/* ── HERO BANNER ────────────────────────────────────────── */}
            <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-b from-emerald-dark via-emerald-dark to-emerald-950 px-6 border-b border-gold/15 py-24 text-center overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.02)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem]" />
                
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="relative max-w-4xl mx-auto space-y-6 z-10"
                >
                    <motion.div 
                        variants={itemVariants}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-900/40 border border-gold/30 shadow-lg"
                    >
                        <Target className="w-4 h-4 text-gold" />
                        <span className="text-xs font-bold tracking-widest text-gold uppercase font-serif">Strategic Milestones</span>
                    </motion.div>

                    <motion.h1 
                        variants={itemVariants}
                        className="text-4xl sm:text-6xl font-serif text-white font-bold leading-tight"
                    >
                        Mission & <span className="text-gradient-gold">Vision</span>
                    </motion.h1>

                    <motion.p 
                        variants={itemVariants}
                        className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto leading-relaxed"
                    >
                        Learn about the foundational values and long-term milestones driving our efforts to document India's districts.
                    </motion.p>
                </motion.div>
            </section>

            {/* ── MISSION & VISION CARDS ──────────────────────────────── */}
            <section className="py-20 max-w-6xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Mission Card */}
                    <div className="card-premium relative bg-emerald-950 text-white border border-gold/25 rounded-3xl p-8 lg:p-10 shadow-2xl flex flex-col justify-between group hover:border-gold transition-all duration-300 text-left">
                        <div className="space-y-6">
                            <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                                <Target className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-2xl font-bold font-serif text-white">Our Mission</h3>
                            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
                                To build the most comprehensive, research-backed district-wise digital knowledge platform ever created for India. Through the National Digital District Encyclopedia (NDDE), we aim to move beyond fragmented learning by presenting India’s districts as complete living systems—enabling students, educators, and citizens to explore the country through an integrated, multidimensional framework.
                            </p>
                        </div>
                    </div>

                    {/* Vision Card */}
                    <div className="card-premium relative bg-emerald-950 text-white border border-gold/25 rounded-3xl p-8 lg:p-10 shadow-2xl flex flex-col justify-between group hover:border-gold transition-all duration-300 text-left">
                        <div className="space-y-6">
                            <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                                <Eye className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-2xl font-bold font-serif text-white">Our Vision</h3>
                            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
                                To establish a permanent national digital knowledge archive that documents India in its true grassroots form. By combining academic precision, modern technology, and visual learning, we envision BodhGanga Academy as the definitive repository of regional knowledge, preserving the civilizational mosaic of India for current learners and future generations.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CORE VALUES ────────────────────────────────────────── */}
            <section className="py-20 bg-white border-y border-emerald/5 px-6 relative z-10">
                <div className="max-w-5xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Foundational Pillars</span>
                        <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">Core Values</h2>
                        <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {coreValues.map((val, idx) => {
                            const IconComp = val.icon;
                            return (
                                <div key={idx} className="p-6 bg-ivory-light border border-emerald/5 rounded-3xl space-y-4 text-left shadow-sm">
                                    <div className="w-10 h-10 rounded-xl bg-emerald/5 text-emerald flex items-center justify-center">
                                        <IconComp className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-bold font-serif text-emerald-dark">{val.title}</h3>
                                    <p className="text-xs text-emerald-dark/70 leading-relaxed font-medium">{val.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── LONG-TERM GOALS ────────────────────────────────────── */}
            <section className="py-20 max-w-5xl mx-auto px-6 relative z-10 text-left">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                    <div className="md:col-span-7 space-y-6">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Future Milestones</span>
                        <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">Long-Term Goals</h2>
                        <div className="w-12 h-1 bg-gold rounded-full" />
                        <p className="text-xs sm:text-sm text-emerald-dark/80 leading-relaxed font-medium">
                            Our roadmap extends beyond test-prep databases. We view the National Digital District Encyclopedia as a permanent civilizational registry. Over the next decade, BodhGanga Academy aims to establish deep partnerships with national institutions, local research collectives, and technology firms to build an active, visual, and bilingual geographic library.
                        </p>
                    </div>

                    <div className="md:col-span-5 space-y-4">
                        {milestones.map((item, idx) => (
                            <div key={idx} className="p-5 bg-white border border-emerald/5 rounded-2xl shadow-sm space-y-2">
                                <h4 className="text-sm font-bold font-serif text-gold flex items-center gap-1.5">
                                    <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                    {item.title}
                                </h4>
                                <p className="text-[10px] text-emerald-dark/70 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── INDIA UNLOCKED BANNER ───────────────────────────────── */}
            <section className="bg-gradient-to-r from-emerald-dark via-emerald-950 to-emerald-dark py-14 border-b border-gold/15 text-center relative overflow-hidden z-10">
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[rgba(212,175,55,0.2)]" />
                <div className="max-w-4xl mx-auto px-6 space-y-3">
                    <p className="text-[10px] text-gold font-bold uppercase tracking-[0.25em] leading-none mb-1">India Unlocked</p>
                    <h2 className="text-2xl sm:text-4xl font-serif text-white font-bold leading-tight">
                        Decoding India, District by District.
                    </h2>
                    <p className="text-xs text-white/60 max-w-xl mx-auto leading-relaxed">
                        To truly understand India, one must understand its districts. Join us in exploring the physical, historical, and economic wealth of India's grassroots.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default MissionVision;
