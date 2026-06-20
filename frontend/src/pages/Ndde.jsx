import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import { 
    BookOpen, Layers, Target, Compass, Sparkles, Map, 
    Bookmark, Award, GraduationCap, ChevronRight
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

const Ndde = () => {
    useSEO({
        title: "National Digital District Encyclopedia (NDDE) - BodhGanga",
        description: "Explore the National Digital District Encyclopedia (NDDE), India's First Digital District Encyclopedia. A structured, research-backed digital archive documenting India's 750+ districts.",
        keywords: "NDDE, National Digital District Encyclopedia, District GK, UPSC District Preparation, State PSC preparation, Grassroots India",
        ogTitle: "National Digital District Encyclopedia (NDDE)",
        ogDescription: "Decode India at the grassroots. Experience a location-based multi-layered learning model covering geography, history, culture, and governance of all districts.",
        ogImage: "/logo.png"
    });

    const [activeTab, setActiveTab] = useState('lectures');

    const learningLayers = [
        {
            id: 'lectures',
            icon: BookOpen,
            title: "In-depth District Lectures",
            desc: "Comprehensive in-depth video analysis",
            content: "Detailed video sessions exploring districts as living ecosystems, covering physical geography, historical timelines, trade routes, cultural evolution, and governance challenges."
        },
        {
            id: 'explainers',
            icon: Bookmark,
            title: "Concise Digital Explainers",
            desc: "Concise note modules for quick learning and revision",
            content: "Precisely structured PDF study materials tailored for UPSC, State PSCs, SSC, and CUET. Translates dry database statistics into high-yield exam preparation matrices."
        },
        {
            id: 'micro',
            icon: Sparkles,
            title: "Micro-learning Formats",
            desc: "Visual fact capsules and interactive challenges",
            content: "Rapid retention formats including infographic slides, visual fact cards, state GK quizzes, and 'Where Am I Going in India?' interactive geography maps."
        }
    ];

    const thematicArchives = [
        { title: "Legends & Historical Personalities", desc: "Local rulers, freedom fighters, social reformers, and legendary historical figures.", icon: "ðŸ‘¥" },
        { title: "National Movements & Wars", desc: "Grassroots freedom struggles, regional revolts, military posts, and unsung local heroes.", icon: "âš”ï¸" },
        { title: "Festivals & Cultural Traditions", desc: "Local fairs, classical and folk dance forms, regional music heritage, and seasonal rituals.", icon: "ðŸŽª" },
        { title: "Tribal Communities of India", desc: "Socio-cultural mapping, dialects, customs, and geographical settlements of indigenous communities.", icon: "ðŸ›ï¸" }
    ];

    return (
        <div className="min-h-screen bg-ivory-light text-emerald-dark font-sans relative overflow-hidden select-none">
            {/* Background Watermark */}
            <div 
                className="absolute inset-0 pointer-events-none select-none bg-contain bg-no-repeat z-0" 
                style={{
                    backgroundImage: `url(${indiaMap})`,
                    backgroundPosition: 'left 5% center',
                    opacity: 0.02,
                    mixBlendMode: 'multiply'
                }}
            />

            {/* â”€â”€ HERO BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-b from-emerald-dark via-emerald-dark to-emerald-950 px-6 border-b border-gold/15 py-24 text-center overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.02)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[140px] pointer-events-none" />

                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="relative max-w-4xl mx-auto space-y-6 z-10"
                >
                    <motion.div 
                        variants={itemVariants}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-900/40 border border-gold/30 shadow-lg shimmer-badge mx-auto"
                    >
                        <Sparkles className="w-4 h-4 text-gold animate-pulse" />
                        <span className="text-xs sm:text-sm font-bold tracking-widest text-gold uppercase font-serif">India's First Digital District Encyclopedia</span>
                    </motion.div>

                    <motion.h1 
                        variants={itemVariants}
                        className="text-4xl sm:text-6xl font-serif text-white font-bold leading-tight tracking-tight"
                    >
                        National Digital District <span className="text-gradient-gold">Encyclopedia</span>
                    </motion.h1>

                    <motion.p 
                        variants={itemVariants}
                        className="text-base sm:text-xl text-gold-glow-soft font-serif max-w-3xl mx-auto leading-relaxed italic"
                    >
                        "NDDE is National Digital District Encyclopedia ”“ India’s First Digital District Encyclopedia"
                    </motion.p>
                </motion.div>
            </section>

            {/* â”€â”€ STATS HUB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="bg-white border-b border-emerald/5 py-10 shadow-sm relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: "780+", label: 'Districts Documented', icon: 'ðŸ—ºï¸' },
                            { value: "36", label: 'States & UTs Covered', icon: 'ðŸ‡®ðŸ‡³' },
                            { value: "8+", label: 'Thematic Archives', icon: 'ðŸ“š' },
                            { value: "10+", label: 'Knowledge Dimensions', icon: 'ðŸ”' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center space-y-1">
                                <div className="text-2xl mb-1">{stat.icon}</div>
                                <div className="text-3xl font-extrabold text-emerald font-serif tracking-tight">{stat.value}</div>
                                <div className="text-[10px] text-emerald/60 font-bold uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* â”€â”€ WHAT IS NDDE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-20 max-w-5xl mx-auto px-6 relative z-10">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                    className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center"
                >
                    <motion.div variants={itemVariants} className="md:col-span-7 space-y-6 text-left">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Ecosystem Definition</span>
                            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">What Is NDDE?</h2>
                            <div className="w-12 h-1 bg-gold rounded-full" />
                        </div>
                        <div className="space-y-4 text-emerald-dark/85 text-sm sm:text-base leading-relaxed font-medium">
                            <p>
                                The **National Digital District Encyclopedia (NDDE)** is a long-term national knowledge initiative aimed at documenting every district of India in a structured, systematic, and accessible digital format.
                            </p>
                            <p>
                                The project addresses a critical knowledge gap: while India is extensively studied at the national and state levels, districts””the primary units of administration, culture, and development””remain scattered, fragmented, or undocumented in a unified manner.
                            </p>
                            <p>
                                This initiative brings together district-level geography, history, culture, economy, tribes, governance, and national movements into a single, coherent knowledge framework.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="md:col-span-5">
                        <div className="card-premium p-8 bg-emerald-950 text-white border border-gold/25 rounded-3xl shadow-xl space-y-6 text-left">
                            <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                                <Target className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-xl font-bold font-serif text-gold">What the Encyclopedia Does</h3>
                            <ul className="space-y-3 text-xs text-white/80 font-medium">
                                <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                                    <span>Creates district-wise digital profiles of India.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                                    <span>Presents India at the micro-administrative and grassroots level.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                                    <span>Organizes information in an exam-relevant and reference-ready manner.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                                    <span>Bridges academic depth with digital accessibility.</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* â”€â”€ STRUCTURE OF THE ENCYCLOPEDIA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-20 bg-white border-y border-emerald/5 px-6 relative z-10">
                <div className="max-w-5xl mx-auto text-left space-y-8">
                    <div className="text-center space-y-4">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Multi-Layer Learning Model</span>
                        <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">Structure of the Encyclopedia</h2>
                        <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                    </div>

                    <div className="space-y-4 text-emerald-dark/85 text-sm sm:text-base leading-relaxed font-medium">
                        <p>
                            The encyclopedia follows a multi-layered learning model: each layer is interconnected, ensuring contextual, location-based learning rather than isolated facts.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
                        {/* Left Tabs selection */}
                        <div className="lg:col-span-5 space-y-4">
                            {learningLayers.map((layer) => {
                                const IconComponent = layer.icon;
                                const isActive = activeTab === layer.id;
                                return (
                                    <button
                                        key={layer.id}
                                        onClick={() => setActiveTab(layer.id)}
                                        className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                                            isActive 
                                                ? 'bg-emerald border-gold text-white shadow-lg' 
                                                : 'bg-white border-emerald/5 hover:border-gold/30 text-emerald-dark'
                                        }`}
                                    >
                                        <div className={`p-2.5 rounded-xl ${isActive ? 'bg-gold text-emerald-dark' : 'bg-emerald-50 text-emerald'}`}>
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className={`text-sm font-bold font-serif ${isActive ? 'text-gold' : 'text-emerald-dark'}`}>{layer.title}</h4>
                                            <p className={`text-[10px] leading-tight ${isActive ? 'text-white/80' : 'text-emerald-dark/60'}`}>{layer.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Tab Content Viewer */}
                        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-emerald/5 shadow-md min-h-[220px] flex flex-col justify-center text-left">
                            {learningLayers.map((layer) => {
                                if (layer.id !== activeTab) return null;
                                return (
                                    <div key={layer.id} className="space-y-4 animate-fade-in">
                                        <h3 className="text-xl font-bold font-serif text-emerald-dark">{layer.title}</h3>
                                        <p className="text-xs sm:text-sm text-emerald-dark/70 leading-relaxed font-medium">
                                            {layer.content}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4 text-emerald-dark/85 text-sm sm:text-base leading-relaxed font-medium pt-8">
                        <p className="font-bold">Thematic Knowledge Layers:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {thematicArchives.map((archive, idx) => (
                                <div key={idx} className="card-premium bg-white p-6 border border-emerald/5 hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between shadow-sm">
                                    <div>
                                        <div className="text-3xl mb-4">{archive.icon}</div>
                                        <h3 className="text-sm font-bold text-emerald-dark font-serif tracking-tight mb-2">{archive.title}</h3>
                                        <p className="text-[10px] text-emerald-dark/60 leading-relaxed font-medium">{archive.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* â”€â”€ INTENDED IMPACT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-20 max-w-5xl mx-auto px-6 relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Our Strategic Value</span>
                    <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">Intended Impact</h2>
                    <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    {[
                        { title: "Competitive Exam Reference", desc: "A reference resource for UPSC, State PSCs, SSC, and other competitive exams.", icon: Award },
                        { title: "Academic & Institutional Aid", desc: "A teaching and learning aid for educators and institutions.", icon: GraduationCap },
                        { title: "Long-Term Digital Archive", desc: "A long-term digital archive representing India at the district level.", icon: Map },
                        { title: "Future Research Repository", desc: "A foundation for future books, courses, and policy-oriented knowledge tools.", icon: Layers }
                    ].map((item, idx) => {
                        const IconComp = item.icon;
                        return (
                            <div key={idx} className="p-6 bg-white border border-emerald/5 rounded-3xl flex gap-4 shadow-sm">
                                <div className="p-3 bg-emerald-50 text-emerald rounded-2xl h-fit shrink-0">
                                    <IconComp className="w-5 h-5 text-emerald" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-base font-bold font-serif text-emerald-dark">{item.title}</h3>
                                    <p className="text-xs text-emerald-dark/70 leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* â”€â”€ VISION & WHY IT MATTERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="py-20 bg-gradient-to-b from-emerald-950 to-emerald-dark text-white border-t border-gold/15 px-6 relative overflow-hidden z-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Vision Statement</span>
                        <h2 className="text-3xl sm:text-4xl font-serif text-white font-bold animate-pulse">Our Vision</h2>
                        <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                    </div>

                    <div className="p-8 bg-slate-900/60 backdrop-blur-xl border border-gold/25 rounded-3xl space-y-4 text-center">
                        <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                            To build a permanent, authoritative, and accessible digital encyclopedia of India’s districts, capturing the nation’s diversity, history, and governance at the level where India truly functions.
                        </p>
                    </div>

                    <div className="text-center space-y-4 pt-8">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Pillars of India</span>
                        <h2 className="text-3xl sm:text-4xl font-serif text-white font-bold">Why This Matters</h2>
                        <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                        <p className="text-base sm:text-xl text-gold font-serif leading-relaxed italic max-w-2xl mx-auto">
                            "India is not just a country of states””it is a nation of districts. Understanding districts is essential to understanding India itself."
                        </p>
                    </div>
                </div>
            </section>

            {/* â”€â”€ INDIA UNLOCKED BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="bg-gradient-to-r from-emerald-dark via-emerald-950 to-emerald-dark py-14 border-b border-gold/15 text-center relative overflow-hidden z-10">
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[rgba(212,175,55,0.2)]" />
                <div className="max-w-4xl mx-auto px-6 space-y-3">
                    <p className="text-[10px] text-gold font-bold uppercase tracking-[0.25em] leading-none mb-1">Decentralizing Knowledge</p>
                    <h2 className="text-2xl sm:text-4xl font-serif text-white font-bold leading-tight">
                        India Unlocked ”” District by District
                    </h2>
                    <p className="text-xs text-white/60 max-w-xl mx-auto leading-relaxed">
                        To truly understand India, one must understand its districts. Join us in exploring the physical, historical, and economic wealth of India's grassroots.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default Ndde;
