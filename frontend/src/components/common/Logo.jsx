import React from 'react';

/**
 * BodhGanga Academy - Official Brand Logo Presenter
 * Renders the EXACT original logo asset (/logo.jpeg) with high-DPI scaling directives,
 * custom responsive dimensions, and premium luxury academic typography.
 * 
 * Absolutely NO auto-generated vector placeholders, fake icons, or AI-generated emblem graphics.
 * ONLY loads and optimizes the authentic, designer-created /logo.jpeg asset.
 */
const Logo = ({
    variant = 'navbar',
    theme = 'dark',
    size = 'md',
    showGlow = true,
    className = '',
    textClassName = '',
    subText = 'ACADEMY'
}) => {
    // Elegant responsive sizing maps for the circular logo asset (using 100% valid Tailwind classes)
    const sizeMap = {
        sm: 'w-10 h-10',
        md: 'w-14 h-14',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32'
    };

    // Pixel width/height specifications for absolute inline override to prevent any stylesheet override explosion
    const pixelSizes = {
        sm: 40,
        md: 56,
        lg: 96,
        xl: 128
    };

    const iconSize = sizeMap[size] || className || 'w-14 h-14';
    const pxSize = pixelSizes[size] || 56;

    // Theme state styling
    const isDark = theme === 'dark';
    const textColor = isDark ? 'text-white' : 'text-emerald-dark';
    const subTextColor = isDark ? 'text-gold' : 'text-gold-dark';

    // The official logo brand image with crisp contrast, rounded frame, and high-DPI scaling directives
    const BrandImage = () => (
        <div 
            className={`relative ${iconSize} flex-shrink-0 select-none group`}
            style={{ width: `${pxSize}px`, height: `${pxSize}px` }}
        >
            {/* Soft Ambient Gold Glow to make it stand out on dark background */}
            {showGlow && (
                <div 
                    className={`absolute inset-0 rounded-full blur-md pointer-events-none transition-opacity duration-300 opacity-25 group-hover:opacity-40 ${
                        isDark ? 'bg-gold/30' : 'bg-gold-dark/15'
                    }`} 
                    style={{ width: `${pxSize}px`, height: `${pxSize}px` }}
                />
            )}
            
            {/* Protective luxury circular boundary frame */}
            <div 
                className={`rounded-full p-0.5 border transition-all duration-300 ${
                    isDark 
                        ? 'border-gold/20 group-hover:border-gold bg-emerald-950/40 shadow-lg' 
                        : 'border-gold-dark/15 group-hover:border-gold-dark bg-white shadow-md'
                } flex items-center justify-center overflow-hidden`}
                style={{ width: `${pxSize}px`, height: `${pxSize}px` }}
            >
                <img 
                    src="/logo.jpeg" 
                    alt="BodhGanga Academy" 
                    className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-[1.03]"
                    style={{
                        width: '100%',
                        height: '100%',
                        imageRendering: 'high-quality',
                        contentVisibility: 'auto'
                    }}
                />
            </div>

            {/* Subtle premium online badge overlay */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-gold to-gold-dark rounded-full border-2 border-[#062014] shadow-md flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
        </div>
    );

    // ── Variant A: Navbar Layout (Perfect horizontal balance) ──
    if (variant === 'navbar') {
        return (
            <div className={`flex items-center gap-4 group select-none ${className}`}>
                <BrandImage />
                
                <div className="flex flex-col items-start leading-none">
                    <span className={`text-2xl font-bold font-serif tracking-[0.08em] ${textColor} transition-colors duration-300 group-hover:text-gold uppercase ${textClassName}`}>
                        BodhGanga
                    </span>
                    <span className={`text-[9px] font-extrabold tracking-[0.38em] ${subTextColor} uppercase mt-1.5 font-sans`}>
                        {subText}
                    </span>
                </div>
            </div>
        );
    }

    // ── Variant B: Wide Horizontal Layout (For footer or large layouts) ──
    if (variant === 'horizontal') {
        return (
            <div className={`flex items-center gap-5 group select-none ${className}`}>
                <BrandImage />
                
                <div className="flex flex-col items-start leading-none">
                    <span className={`text-3xl font-extrabold font-serif tracking-[0.1em] ${textColor} transition-colors duration-300 group-hover:text-gold uppercase ${textClassName}`}>
                        BodhGanga
                    </span>
                    <span className={`text-xs font-black tracking-[0.42em] ${subTextColor} uppercase mt-2.5 font-sans`}>
                        {subText}
                    </span>
                </div>
            </div>
        );
    }

    // ── Variant C: Stacked Primary Layout (Hero, auth, or landing portals) ──
    if (variant === 'primary') {
        return (
            <div className={`flex flex-col items-center text-center gap-6 group select-none ${className}`}>
                <BrandImage />
                
                <div className="space-y-2">
                    <h1 className={`text-4xl font-extrabold font-serif tracking-[0.14em] ${textColor} transition-colors duration-300 group-hover:text-gold uppercase ${textClassName}`}>
                        BodhGanga
                    </h1>
                    <div className="flex items-center justify-center gap-3">
                        <span className="w-6 h-0.5 bg-gradient-to-r from-transparent to-gold" />
                        <span className={`text-xs font-black tracking-[0.5em] ${subTextColor} uppercase font-sans`}>
                            {subText}
                        </span>
                        <span className="w-6 h-0.5 bg-gradient-to-l from-transparent to-gold" />
                    </div>
                </div>
            </div>
        );
    }

    // ── Variant D: Compact Icon-Only (Toggles, lists) ──
    return <BrandImage />;
};

export default Logo;
