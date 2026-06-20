import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation, Keyboard } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

/**
 * ADMINISTRATIVE DOCUMENTATION:
 * To add a new slide to the homepage slideshow:
 * 1. Place the new image file (supported formats: .jpg, .jpeg, .png, .webp) 
 *    inside the slideshow assets directory: src/assets/slideshow/
 * 2. Run the build/deploy script (npm run build).
 * 3. The slide will automatically be picked up and added to the carousel.
 * No code changes are ever required!
 */

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

const HomepageSlideshow = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    // Eagerly resolve and load all images inside src/assets/slideshow
    const imageModules = import.meta.glob('../../assets/slideshow/*.{png,jpg,jpeg,webp}', { eager: true });
    
    // Map globbed modules to slide objects
    const slides = Object.values(imageModules).map((module, index) => {
        const image = module.default || module;
        const metadata = slideMetadata[index % slideMetadata.length] || { title: "Decoding India", label: "District by District" };
        return {
            image,
            title: metadata.title,
            label: metadata.label
        };
    });

    // Phase 6: Empty state handling (No crashes, clean text fallback)
    if (slides.length === 0) {
        return (
            <div 
                className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] h-[420px] sm:h-[500px] md:h-[560px] lg:h-[640px] rounded-[28px] overflow-hidden shadow-2xl border border-gold/25 bg-gradient-to-b from-emerald-900 to-emerald-950 flex flex-col items-center justify-center text-center p-6"
                id="homepage-slideshow-empty"
            >
                <span className="text-4xl mb-4" role="img" aria-label="No content">🖼️</span>
                <p className="text-gold font-serif text-lg font-semibold">No featured content available</p>
                <p className="text-white/60 text-xs mt-2">To populate this slideshow, add slide images to the src/assets/slideshow folder and rebuild.</p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-6 mx-auto px-4 sm:px-0">
            {/* Slide Metadata text block (repositioned above the image slider) */}
            <div className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] mx-auto text-left space-y-1">
                <div className="text-[10px] sm:text-xs tracking-[0.25em] font-extrabold uppercase text-gold">India Unlocked 🇮🇳</div>
                <div className="text-[9px] sm:text-[10px] text-white/50 font-bold uppercase tracking-wider">Decoding India, District by District</div>
                <h3 className="text-lg sm:text-2xl font-semibold font-serif text-white tracking-tight leading-tight pt-1">
                    {slides[activeIndex]?.title}
                </h3>
                <p className="text-xs sm:text-sm opacity-90 text-white/70 font-semibold uppercase tracking-wider">
                    {slides[activeIndex]?.label}
                </p>
            </div>

            {/* Slider Container */}
            <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] h-[420px] sm:h-[500px] md:h-[560px] lg:h-[640px] rounded-[28px] overflow-hidden shadow-2xl border border-gold/25 glow-emerald-card group bg-gradient-to-b from-emerald-900 to-emerald-950">
                <Swiper
                    modules={[Autoplay, EffectFade, Pagination, Navigation, Keyboard]}
                    effect="fade"
                    fadeEffect={{ crossFade: true }}
                    loop={slides.length > 1}
                    autoplay={{ delay: 4000, disableOnInteraction: false }}
                    pagination={{ clickable: true }}
                    navigation={true}
                    keyboard={{ enabled: true }}
                    grabCursor={true}
                    onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                    className="w-full h-full homepage-swiper"
                >
                    {slides.map((slide, idx) => (
                        <SwiperSlide key={idx} className="w-full h-full relative">
                            {/* Slide Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-[28px] z-10 pointer-events-none" />
                            
                            {/* Dynamic preloading & lazy loading logic for performance */}
                            <img
                                src={slide.image}
                                alt={slide.label}
                                loading={idx === 0 ? "eager" : "lazy"}
                                fetchPriority={idx === 0 ? "high" : "low"}
                                className="w-full h-full object-cover object-top rounded-[28px] select-none"
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default HomepageSlideshow;
