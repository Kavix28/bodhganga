import React from 'react';
import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import { 
    Award, BookOpen, Compass, Landmark, Briefcase, 
    ChevronRight, Sparkles, Users, Target
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

            {/* ── HERO BANNER & FOUNDER PORTRAIT ─────────────────────── */}
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
                            Prateek Bhargava is an educator, researcher, and the founder of BodhGanga Academy and the National Digital District Encyclopedia (NDDE) — India’s First Digital District Encyclopedia. Alongside his educational initiatives, he has been serving as a Deputy Manager at MTNL (Department of Telecommunication) since 2009. He himself cleared multiple competitive examinations reflecting his strong academic foundation and deep understanding of India’s competitive examination ecosystem.
                        </motion.p>
                    </motion.div>

                    {/* Right: Portrait Image (Matches the homepage style exactly) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="lg:col-span-5 flex justify-center"
                    >
                        <div className="relative group w-full max-w-[360px] h-[440px] rounded-3xl overflow-hidden shadow-2xl border border-gold/20 p-2 bg-white">
                            <div className="absolute inset-0 border border-gold/10 rounded-[22px] m-1 pointer-events-none z-10" />
                            <img
                                src="/prateek-sir.png"
                                alt="Prateek Bhargava Portrait"
                                loading="lazy"
                                className="w-full h-full object-cover object-center rounded-[20px] filter grayscale-[15%] brightness-[0.98] contrast-[1.03] transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600";
                                }}
                            />
                            <div className="absolute bottom-6 left-6 right-6 bg-emerald-950/90 backdrop-blur-md border border-gold/20 p-4 rounded-2xl z-20 text-center">
                                <h4 className="text-white font-serif font-bold text-xs tracking-wide">Deputy Manager, MTNL</h4>
                                <p className="text-gold font-sans font-bold text-[8px] uppercase tracking-widest mt-1">Telecom Officer Since 2009</p>
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

            {/* ── THE FOUNDER STORY / OBSERVATIONS ─────────────────────── */}
            <section className="py-20 max-w-5xl mx-auto px-6 relative z-10 text-left">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
                    <div className="md:col-span-7 space-y-6">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Inspiration & Realization</span>
                            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">The Founder's Journey</h2>
                            <div className="w-12 h-1 bg-gold rounded-full" />
                        </div>
                        <div className="space-y-4 text-emerald-dark/85 text-sm sm:text-base leading-relaxed font-medium">
                            <p>
                                Having personally experienced the journey of competitive examinations and structured learning, Prateek Bhargava developed a strong interest in creating educational resources that go beyond rote memorization and fragmented preparation.
                            </p>
                            <p>
                                Over the years, he observed that while students study subjects like Geography, History, Economy, Environment, and Polity separately, very few platforms help learners understand how these subjects connect with one another in the real India.
                            </p>
                            <p>
                                Most educational content explains India only at the national or state level, while the actual diversity, administration, culture, ecology, economy, and historical depth of the country exist at the district level.
                            </p>
                            <p className="font-semibold text-emerald">
                                This realization became the inspiration behind the creation of the National Digital District Encyclopedia (NDDE).
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-5 space-y-6">
                        <div className="card-premium p-8 bg-emerald-950 text-white border border-gold/25 rounded-3xl shadow-xl space-y-4 text-left">
                            <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                                <Target className="w-6 h-6 text-gold" />
                            </div>
                            <h4 className="text-base font-bold font-serif text-gold">The NDDE Vision</h4>
                            <p className="text-xs text-white/70 leading-relaxed font-medium">
                                The vision of NDDE is to build a structured, research-backed, and digitally accessible knowledge archive documenting every district of India through an integrated learning framework.
                            </p>
                        </div>

                        <div className="card-premium p-8 bg-emerald-950 text-white border border-gold/25 rounded-3xl shadow-xl space-y-4 text-left">
                            <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                                <Compass className="w-6 h-6 text-gold" />
                            </div>
                            <h4 className="text-base font-bold font-serif text-gold">Horizontal Integration</h4>
                            <p className="text-xs text-white/70 leading-relaxed font-medium">
                                At the core of this initiative is the philosophy of Horizontal Integration — an approach that connects Geography, History, Economy, Environment, Culture, Governance, Agriculture, Strategic Importance, and Current Affairs into one interconnected district-wise framework.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── EDUCATIONAL CONTRIBUTIONS & AUDIENCE ─────────────────── */}
            <section className="py-20 bg-white border-y border-emerald/5 px-6 relative z-10">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                    <div className="space-y-4">
                        <h3 className="text-xl sm:text-2xl font-serif text-emerald-dark font-bold">What We Develop</h3>
                        <p className="text-xs text-emerald-dark/60">Under his leadership, BodhGanga Academy has been continuously developing educational series:</p>
                        <div className="w-12 h-1 bg-gold rounded-full" />
                        <ul className="space-y-3 pt-2 text-xs sm:text-sm text-emerald-dark/80 font-medium">
                            <li className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                <span>District-wise comprehensive lectures</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                <span>Exam-oriented notes and revision frameworks</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                <span>MCQ banks and analytical content</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                <span>Infographics and visual learning modules</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                <span>Cultural and environmental knowledge series</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                <span>India-focused educational archives for competitive examinations</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl sm:text-2xl font-serif text-emerald-dark font-bold">Initiative Target Audience</h3>
                        <p className="text-xs text-emerald-dark/60">The encyclopedia and BodhGanga Academy modules are custom built for:</p>
                        <div className="w-12 h-1 bg-gold rounded-full" />
                        <ul className="space-y-3 pt-2 text-xs sm:text-sm text-emerald-dark/80 font-medium">
                            <li className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                <span>UPSC and State PSC aspirants</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                <span>SSC and CUET students</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                <span>Teachers and institutions</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                <span>Researchers and policy enthusiasts</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gold shrink-0" />
                                <span>Learners seeking a deeper understanding of India</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* ── MISSION MISSION & MOTTO ─────────────────────────────── */}
            <section className="py-20 max-w-4xl mx-auto px-6 relative z-10 text-center">
                <div className="relative space-y-6">
                    <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Foundational Belief</span>
                    <div className="text-4xl text-gold font-serif opacity-30">“</div>
                    <p className="text-xl sm:text-2xl font-serif text-emerald-dark italic leading-relaxed max-w-2xl mx-auto">
                        To truly understand India, one must understand its districts.
                    </p>
                    <div className="text-4xl text-gold font-serif opacity-30">”</div>
                    <p className="text-xs text-emerald-dark/70 leading-relaxed font-medium max-w-3xl mx-auto pt-2">
                        For Prateek Bhargava, NDDE is not merely an educational project, but a long-term national knowledge mission aimed at documenting India in its true grassroots form and preserving district-level knowledge for future generations. Through BodhGanga Academy and NDDE, he continues working toward the vision of creating one of the most comprehensive district-wise educational knowledge platforms in India.
                    </p>
                    <div className="space-y-1 pt-6">
                        <h4 className="text-sm font-bold uppercase tracking-wider font-serif text-gold">Prateek Bhargava</h4>
                        <p className="text-[10px] text-emerald-dark/60 uppercase tracking-widest font-bold">Founder & CEO, BodhGanga Academy</p>
                    </div>
                </div>
            </section>

            {/* ── INDIA UNLOCKED BANNER ───────────────────────────────── */}
            <section className="bg-gradient-to-r from-emerald-dark via-emerald-950 to-emerald-dark py-14 border-b border-gold/15 text-center relative overflow-hidden z-10">
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[rgba(212,175,55,0.2)]" />
                <div className="max-w-4xl mx-auto px-6 space-y-3">
                    <p className="text-[10px] text-gold font-bold uppercase tracking-[0.25em] leading-none mb-1">India Unlocked 🇮🇳</p>
                    <h2 className="text-2xl sm:text-4xl font-serif text-white font-bold leading-tight">
                        Decoding India, District by District.
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
