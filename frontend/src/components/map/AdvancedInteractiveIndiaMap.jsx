import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp, Book, HelpCircle, CheckSquare, Navigation } from 'lucide-react';
import indiaMapImage from '../../assets/images/india-map.webp';
import { indianStates } from '../../data/states';
import { unionTerritories } from '../../data/unionTerritories';

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  SIMPLIFIED INTERACTIVE INDIA MAP                                      ║
 * ║  Uses the provided india-map.webp with clickable region grid          ║
 * ║  All 28 States + 8 Union Territories                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

const AdvancedInteractiveIndiaMap = ({ viewMode = 'states', userProgress = {} }) => {
    const navigate = useNavigate();
    const [hoveredRegion, setHoveredRegion] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const mapContainerRef = useRef(null);

    // Combine all regions
    const allRegions = [...indianStates, ...unionTerritories];

    /**
     * Get Regional Progress Data
     */
    const getRegionProgress = (regionId) => {
        const progress = userProgress[regionId];
        if (!progress) {
            return { overall: 0, notes: 0, questions: 0, solutions: 0 };
        }

        if (typeof progress === 'number') {
            return {
                overall: progress,
                notes: progress,
                questions: progress,
                solutions: progress,
            };
        }

        return {
            overall: progress.overall || 0,
            notes: progress.notes || 0,
            questions: progress.questions || 0,
            solutions: progress.solutions || 0,
        };
    };

    /**
     * Get Color Based on Coverage Level
     */
    const getCoverageColor = (overall) => {
        if (overall >= 70) return '#138808'; // Green
        if (overall >= 25) return '#FF9933'; // Saffron
        return '#9CA3AF'; // Gray
    };

    /**
     * Handle Region Click
     */
    const handleRegionClick = (region) => {
        const isState = indianStates.some(s => s.id === region.id);
        const shouldDim =
            (viewMode === 'states' && !isState) ||
            (viewMode === 'uts' && isState);

        if (shouldDim) return;

        const path = isState
            ? `/states/${region.id}`
            : `/union-territories/${region.id}`;
        navigate(path);
    };

    /**
     * Handle Mouse Movement
     */
    const handleMouseMove = (e, region) => {
        if (!mapContainerRef.current) return;
        const rect = mapContainerRef.current.getBoundingClientRect();
        setTooltipPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        setHoveredRegion(region);
    };

    // Filter regions based on view mode
    const displayRegions = allRegions.filter(region => {
        const isState = indianStates.some(s => s.id === region.id);
        if (viewMode === 'states') return isState;
        if (viewMode === 'uts') return !isState;
        return true;
    });

    return (
        <div className="relative w-full" ref={mapContainerRef}>
            {/* Map Container */}
            <div className="relative w-full mx-auto" style={{ maxWidth: '700px' }}>
                {/* India Map Image */}
                <div className="relative">
                    <img
                        src={indiaMapImage}
                        alt="India Map"
                        className="w-full h-auto rounded-lg shadow-lg"
                        style={{ maxHeight: '700px', objectFit: 'contain' }}
                    />

                    {/* Interactive Overlay with VISIBLE Pointer Markers */}
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 565 600"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* Define VISIBLE pointer markers for each region */}
                        {displayRegions.map((region) => {
                            const progress = getRegionProgress(region.id);
                            const fillColor = getCoverageColor(progress.overall);

                            // Get precise geographical position
                            const position = getRegionPosition(region.id);
                            if (!position) return null;

                            // Calculate center point for marker
                            const centerX = position.type === 'circle'
                                ? position.x
                                : position.x + position.w / 2;
                            const centerY = position.type === 'circle'
                                ? position.y
                                : position.y + position.h / 2;

                            const isHovered = hoveredRegion?.id === region.id;

                            return (
                                <g key={region.id} className="pointer-events-auto">
                                    {/* Transparent Interactive Hotspot (full region area) */}
                                    {position.type === 'circle' ? (
                                        <circle
                                            cx={position.x}
                                            cy={position.y}
                                            r={position.r + 5}
                                            fill="transparent"
                                            className="cursor-pointer"
                                            onMouseEnter={(e) => handleMouseMove(e, region)}
                                            onMouseMove={(e) => handleMouseMove(e, region)}
                                            onMouseLeave={() => setHoveredRegion(null)}
                                            onClick={() => handleRegionClick(region)}
                                        />
                                    ) : (
                                        <rect
                                            x={position.x}
                                            y={position.y}
                                            width={position.w}
                                            height={position.h}
                                            fill="transparent"
                                            className="cursor-pointer"
                                            onMouseEnter={(e) => handleMouseMove(e, region)}
                                            onMouseMove={(e) => handleMouseMove(e, region)}
                                            onMouseLeave={() => setHoveredRegion(null)}
                                            onClick={() => handleRegionClick(region)}
                                        />
                                    )}

                                    {/* VISIBLE Pointer Marker - Outer Ring (White Border) */}
                                    <circle
                                        cx={centerX}
                                        cy={centerY}
                                        r={isHovered ? 12 : 9}
                                        fill="#FFFFFF"
                                        fillOpacity={0.9}
                                        className="transition-all duration-300 pointer-events-none"
                                        style={{
                                            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))'
                                        }}
                                    />

                                    {/* VISIBLE Pointer Marker - Inner Colored Dot */}
                                    <circle
                                        cx={centerX}
                                        cy={centerY}
                                        r={isHovered ? 9 : 6}
                                        fill={fillColor}
                                        fillOpacity={1}
                                        className="transition-all duration-300 pointer-events-none"
                                    />

                                    {/* VISIBLE Pointer Marker - Center Highlight */}
                                    <circle
                                        cx={centerX}
                                        cy={centerY}
                                        r={isHovered ? 4 : 2}
                                        fill="#FFFFFF"
                                        fillOpacity={0.8}
                                        className="transition-all duration-300 pointer-events-none"
                                    />

                                    {/* Hover Pulse Effect */}
                                    {isHovered && (
                                        <circle
                                            cx={centerX}
                                            cy={centerY}
                                            r={16}
                                            fill={fillColor}
                                            fillOpacity={0.2}
                                            stroke={fillColor}
                                            strokeWidth="2"
                                            strokeOpacity={0.4}
                                            className="pointer-events-none animate-pulse"
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* Tooltip */}
            {hoveredRegion && (
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        left: `${tooltipPos.x + 20}px`,
                        top: `${tooltipPos.y - 10}px`,
                        transform: 'translateY(-100%)',
                    }}
                >
                    <div
                        className="bg-white/98 backdrop-blur-lg shadow-2xl rounded-xl px-6 py-5 min-w-[280px]"
                        style={{
                            borderColor: '#000080',
                            borderWidth: '3px',
                            borderStyle: 'solid',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-4 pb-3 border-b-2 border-gray-200">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                                style={{
                                    background: indianStates.some(s => s.id === hoveredRegion.id)
                                        ? 'linear-gradient(135deg, #FF9933, #FF6600)'
                                        : 'linear-gradient(135deg, #138808, #0F6606)',
                                }}
                            >
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-lg leading-tight mb-1" style={{ color: '#000080' }}>
                                    {hoveredRegion.name}
                                </h4>
                                <span
                                    className="text-xs px-3 py-1 rounded-full font-bold inline-block"
                                    style={{
                                        background: indianStates.some(s => s.id === hoveredRegion.id) ? '#FF9933' : '#138808',
                                        color: 'white',
                                    }}
                                >
                                    {indianStates.some(s => s.id === hoveredRegion.id) ? 'State' : 'Union Territory'}
                                </span>
                            </div>
                        </div>

                        {/* Progress Details */}
                        <div className="space-y-3">
                            {(() => {
                                const progress = getRegionProgress(hoveredRegion.id);
                                return (
                                    <>
                                        {/* Individual Metrics */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <Book className="w-4 h-4" style={{ color: '#000080' }} />
                                                    <span className="text-sm font-semibold text-gray-700">Notes</span>
                                                </div>
                                                <span className="text-sm font-black" style={{ color: '#000080' }}>
                                                    {progress.notes}%
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <HelpCircle className="w-4 h-4" style={{ color: '#FF9933' }} />
                                                    <span className="text-sm font-semibold text-gray-700">Questions</span>
                                                </div>
                                                <span className="text-sm font-black" style={{ color: '#FF9933' }}>
                                                    {progress.questions}%
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <CheckSquare className="w-4 h-4" style={{ color: '#138808' }} />
                                                    <span className="text-sm font-semibold text-gray-700">Solutions</span>
                                                </div>
                                                <span className="text-sm font-black" style={{ color: '#138808' }}>
                                                    {progress.solutions}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Overall Progress */}
                                        <div className="mt-4 pt-4 border-t-2 border-gray-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="w-5 h-5" style={{ color: '#FF9933' }} />
                                                    <span className="font-black text-sm text-gray-800">
                                                        Overall Progress
                                                    </span>
                                                </div>
                                                <span
                                                    className="text-2xl font-black"
                                                    style={{ color: getCoverageColor(progress.overall) }}
                                                >
                                                    {progress.overall}%
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className="h-full transition-all duration-500 rounded-full"
                                                    style={{
                                                        width: `${progress.overall}%`,
                                                        background: getCoverageColor(progress.overall),
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Call to Action */}
                                        <div className="mt-4 text-center">
                                            <div
                                                className="flex items-center justify-center gap-2 text-sm font-bold"
                                                style={{ color: '#FF9933' }}
                                            >
                                                <Navigation className="w-4 h-4" />
                                                <span>Click to access Notes →</span>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Get PRECISE geographical position for each region
 * Coordinates are EXACTLY mapped to the india-map.webp image
 * Based on viewBox: 0 0 565 600
 * Each coordinate represents the visual center/focal point of the state/UT
 */
function getRegionPosition(regionId) {
    const positions = {
        // ═══════════════════════════════════════════════════════════════
        // NORTHERN REGION - States & Union Territories
        // ═══════════════════════════════════════════════════════════════

        // Jammu & Kashmir - Northwestern corner, large territory
        'jammu-kashmir': { x: 100, y: 85, w: 55, h: 50, type: 'rect' },

        // Ladakh - North-central, east of J&K
        'ladakh': { x: 170, y: 70, w: 70, h: 55, type: 'rect' },

        // Himachal Pradesh - Below J&K, mountainous region
        'himachal-pradesh': { x: 115, y: 135, w: 50, h: 40, type: 'rect' },

        // Punjab - West of Himachal, rectangular shape
        'punjab': { x: 65, y: 145, w: 35, h: 35, type: 'rect' },

        // Chandigarh - Tiny UT between Punjab and Haryana
        'chandigarh': { x: 98, y: 157, r: 6, type: 'circle' },

        // Uttarakhand - East of Himachal, below Ladakh
        'uttarakhand': { x: 165, y: 150, w: 45, h: 35, type: 'rect' },

        // Haryana - Surrounds Delhi, below Punjab
        'haryana': { x: 105, y: 175, w: 50, h: 40, type: 'rect' },

        // Delhi - NCT, tiny territory in center of Haryana
        'delhi': { x: 115, y: 183, r: 7, type: 'circle' },

        // ═══════════════════════════════════════════════════════════════
        // WESTERN REGION
        // ═══════════════════════════════════════════════════════════════

        // Rajasthan - Large western state
        'rajasthan': { x: 70, y: 235, w: 75, h: 115, type: 'rect' },

        // Gujarat - Southwest coast, large state
        'gujarat': { x: 55, y: 360, w: 75, h: 100, type: 'rect' },

        // Dadra & Nagar Haveli and Daman &  Diu - Tiny UT in Gujarat region
        'dnh-dd': { x: 75, y: 375, r: 6, type: 'circle' },

        // ═══════════════════════════════════════════════════════════════
        // CENTRAL REGION
        // ═══════════════════════════════════════════════════════════════

        // Uttar Pradesh - Large north-central state
        'uttar-pradesh': { x: 170, y: 205, w: 85, h: 65, type: 'rect' },

        // Madhya Pradesh - Heart of India, large central state
        'madhya-pradesh': { x: 145, y: 305, w: 95, h: 75, type: 'rect' },

        // Chhattisgarh - East-central, carved from MP
        'chhattisgarh': { x: 240, y: 325, w: 60, h: 65, type: 'rect' },

        // ═══════════════════════════════════════════════════════════════
        // EASTERN REGION
        // ═══════════════════════════════════════════════════════════════

        // Bihar - East of UP, above Jharkhand
        'bihar': { x: 245, y: 230, w: 65, h: 45, type: 'rect' },

        // Jharkhand - Carved from Bihar, mineral-rich state
        'jharkhand': { x: 255, y: 295, w: 55, h: 50, type: 'rect' },

        // West Bengal - Eastern state with Kolkata
        'west-bengal': { x: 295, y: 295, w: 55, h: 85, type: 'rect' },

        // Odisha - East coast, below Jharkhand
        'odisha': { x: 255, y: 380, w: 65, h: 85, type: 'rect' },

        // Sikkim - Tiny state in Himalayas, between Nepal and Bhutan
        'sikkim': { x: 295, y: 215, r: 8, type: 'circle' },

        // ═══════════════════════════════════════════════════════════════
        // NORTHEASTERN REGION (Seven Sisters)
        // ═══════════════════════════════════════════════════════════════

        // Arunachal Pradesh - Largest NE state, northernmost
        'arunachal-pradesh': { x: 380, y: 180, w: 85, h: 55, type: 'rect' },

        // Assam - Largest of Seven Sisters, tea state
        'assam': { x: 360, y: 250, w: 90, h: 55, type: 'rect' },

        // Nagaland - East of Assam
        'nagaland': { x: 445, y: 250, w: 30, h: 35, type: 'rect' },

        // Manipur - South of Nagaland
        'manipur': { x: 445, y: 295, w: 28, h: 32, type: 'rect' },

        // Mizoram - Southernmost NE state
        'mizoram': { x: 435, y: 335, w: 28, h: 40, type: 'rect' },

        // Tripura - West of Mizoram, surrounded by Bangladesh
        'tripura': { x: 390, y: 320, w: 35, h: 35, type: 'rect' },

        // Meghalaya - Between Assam and Bangladesh, wettest place
        'meghalaya': { x: 375, y: 280, w: 45, h: 32, type: 'rect' },

        // ═══════════════════════════════════════════════════════════════
        // SOUTHERN REGION
        // ═══════════════════════════════════════════════════════════════

        // Maharashtra - Large western state, Mumbai
        'maharashtra': { x: 135, y: 395, w: 95, h: 85, type: 'rect' },

        // Goa - Tiny state, west coast
        'goa': { x: 85, y: 450, w: 22, h: 22, type: 'rect' },

        // Telangana - Carved from AP, Hyderabad
        'telangana': { x: 210, y: 420, w: 55, h: 50, type: 'rect' },

        // Andhra Pradesh - East coast, below Telangana
        'andhra-pradesh': { x: 240, y: 480, w: 65, h: 75, type: 'rect' },

        // Karnataka - Southwest, Bangalore
        'karnataka': { x: 150, y: 485, w: 80, h: 75, type: 'rect' },

        // Tamil Nadu - Southernmost mainland state
        'tamil-nadu': { x: 210, y: 540, w: 65, h: 45, type: 'rect' },

        // Kerala - Southwest coast, Malabar
        'kerala': { x: 145, y: 535, w: 55, h: 55, type: 'rect' },

        // Puducherry - Tiny UT, multiple enclaves in TN
        'puducherry': { x: 225, y: 545, r: 6, type: 'circle' },

        // ═══════════════════════════════════════════════════════════════
        // ISLAND UNION TERRITORIES
        // ═══════════════════════════════════════════════════════════════

        // Lakshadweep - Island group, Arabian Sea, west coast
        'lakshadweep': { x: 50, y: 500, r: 10, type: 'circle' },

        // Andaman & Nicobar Islands - Island group, Bay of Bengal
        'andaman-nicobar': { x: 485, y: 475, w: 35, h: 105, type: 'rect' },
    };

    return positions[regionId] || null;
}

export default AdvancedInteractiveIndiaMap;
