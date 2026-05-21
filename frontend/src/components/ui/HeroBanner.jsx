import React, { memo } from 'react';

/**
 * HeroBanner — Rebuilt to use strict gov-clone structural rules.
 * Matches Step 9: Height ~220px, left-aligned, no heavy padding.
 */
const HeroBanner = ({ image, title, subtitle }) => {
    const fallback = 'https://images.unsplash.com/photo-1598894103134-2e1189edcc25?auto=format&fit=crop&q=80&w=1200';

    return (
        <div className="hero" style={{backgroundImage: `url(${image || fallback})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
            <div className="container">
                <div className="hero-content">
                    {title && (
                        <h1 className="hero-title">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="hero-subtitle">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(HeroBanner);
