import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp, Book, HelpCircle, CheckSquare, Navigation } from 'lucide-react';
import indiaMapImage from '../../assets/images/india-map-accurate.png';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════╗
 * ║  SVG-BASED GEOGRAPHICALLY ACCURATE INDIA MAP (CORRECTED)                         ║
 * ║  ───────────────────────────────────────────────────────────────────────────────  ║
 * ║  TECHNICAL ARCHITECTURE:                                                         ║
 * ║  • Base layer: PNG image (india-map-accurate.png) - 1024x1024px                 ║
 * ║  • Overlay layer: SVG with viewBox="0 0 1024 1024" MATCHING image exactly       ║
 * ║  • Coordinate system: 1:1 pixel-perfect binding to image                         ║
 * ║  • Scaling: preserveAspectRatio="xMidYMid meet" ensures perfect alignment       ║
 * ║  ───────────────────────────────────────────────────────────────────────────────  ║
 * ║  ROOT CAUSE OF PREVIOUS FAILURE:                                                 ║
 * ║  • Image was 1024x1024 (aspect 1:1) but SVG was 1000x1150 (aspect ~0.87)       ║
 * ║  • This mismatch caused severe coordinate drift across the map                   ║
 * ║  • Northeastern states appeared in China/Myanmar/Bangladesh                      ║
 * ║  ───────────────────────────────────────────────────────────────────────────────  ║
 * ║  CORRECTION APPLIED:                                                             ║
 * ║  • viewBox now matches image dimensions: "0 0 1024 1024"                        ║
 * ║  • All coordinates recalculated based on actual state positions on 1024x1024    ║
 * ║  • Mathematical binding ensures perfect alignment at ALL screen sizes            ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════╝
 */

const SVGBasedIndiaMap = ({ viewMode = 'states', userProgress = {} }) => {
    const navigate = useNavigate();
    const [hoveredRegion, setHoveredRegion] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const mapContainerRef = useRef(null);

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * REGION DEFINITIONS WITH CORRECTED SVG COORDINATES
     * ═══════════════════════════════════════════════════════════════════════════════
     * ViewBox: 0 0 1024 1024 (matches image exactly)
     * Coordinates measured from actual map geography using pixel analysis
     * Format: { id, name, isState, cx, cy, r }
     *   - cx, cy: SVG circle center coordinates (0-1024 range)
     *   - r: circle radius scaled appropriately
     */
    const regions = [
        // ═══════════════════════════════════════════════════════════════
        // NORTHERN STATES & UNION TERRITORIES
        // ═══════════════════════════════════════════════════════════════
        { id: 'jammu-kashmir', name: 'Jammu & Kashmir', isState: false, cx: 230, cy: 120, r: 28 },
        { id: 'ladakh', name: 'Ladakh', isState: false, cx: 360, cy: 85, r: 32 },
        { id: 'himachal-pradesh', name: 'Himachal Pradesh', isState: true, cx: 295, cy: 165, r: 20 },
        { id: 'punjab', name: 'Punjab', isState: true, cx: 260, cy: 195, r: 16 },
        { id: 'chandigarh', name: 'Chandigarh', isState: false, cx: 280, cy: 205, r: 7 },
        { id: 'uttarakhand', name: 'Uttarakhand', isState: true, cx: 330, cy: 205, r: 17 },
        { id: 'haryana', name: 'Haryana', isState: true, cx: 285, cy: 235, r: 16 },
        { id: 'delhi', name: 'Delhi', isState: false, cx: 300, cy: 250, r: 7 },

        // ═══════════════════════════════════════════════════════════════
        // WESTERN STATES
        // ═══════════════════════════════════════════════════════════════
        { id: 'rajasthan', name: 'Rajasthan', isState: true, cx: 245, cy: 320, r: 30 },
        { id: 'gujarat', name: 'Gujarat', isState: true, cx: 185, cy: 460, r: 27 },
        { id: 'dnh-dd', name: 'DNH & DD', isState: false, cx: 210, cy: 530, r: 7 },

        // ═══════════════════════════════════════════════════════════════
        // CENTRAL STATES
        // ═══════════════════════════════════════════════════════════════
        { id: 'uttar-pradesh', name: 'Uttar Pradesh', isState: true, cx: 345, cy: 305, r: 28 },
        { id: 'madhya-pradesh', name: 'Madhya Pradesh', isState: true, cx: 310, cy: 445, r: 30 },
        { id: 'chhattisgarh', name: 'Chhattisgarh', isState: true, cx: 425, cy: 510, r: 22 },

        // ═══════════════════════════════════════════════════════════════
        // EASTERN STATES (CORRECTED - moved south from Nepal)
        // ═══════════════════════════════════════════════════════════════
        { id: 'bihar', name: 'Bihar', isState: true, cx: 450, cy: 345, r: 20 },
        { id: 'jharkhand', name: 'Jharkhand', isState: true, cx: 455, cy: 445, r: 18 },
        { id: 'west-bengal', name: 'West Bengal', isState: true, cx: 515, cy: 470, r: 20 },
        { id: 'odisha', name: 'Odisha', isState: true, cx: 470, cy: 560, r: 22 },

        // ═══════════════════════════════════════════════════════════════
        // NORTHEASTERN STATES & TERRITORIES (COMPLETELY RECALCULATED)
        // CRITICAL FIXES: All moved west and south to be within India
        // ═══════════════════════════════════════════════════════════════
        { id: 'sikkim', name: 'Sikkim', isState: true, cx: 510, cy: 305, r: 9 },
        { id: 'arunachal-pradesh', name: 'Arunachal Pradesh', isState: true, cx: 640, cy: 290, r: 20 },
        { id: 'assam', name: 'Assam', isState: true, cx: 610, cy: 350, r: 18 },
        { id: 'nagaland', name: 'Nagaland', isState: true, cx: 670, cy: 345, r: 11 },
        { id: 'manipur', name: 'Manipur', isState: true, cx: 670, cy: 385, r: 11 },
        { id: 'mizoram', name: 'Mizoram', isState: true, cx: 650, cy: 425, r: 11 },
        { id: 'tripura', name: 'Tripura', isState: true, cx: 600, cy: 420, r: 10 },
        { id: 'meghalaya', name: 'Meghalaya', isState: true, cx: 585, cy: 365, r: 11 },

        // ═══════════════════════════════════════════════════════════════
        // SOUTHERN STATES & UNION TERRITORIES
        // ═══════════════════════════════════════════════════════════════
        { id: 'maharashtra', name: 'Maharashtra', isState: true, cx: 285, cy: 595, r: 26 },
        { id: 'goa', name: 'Goa', isState: true, cx: 235, cy: 700, r: 9 },
        { id: 'telangana', name: 'Telangana', isState: true, cx: 350, cy: 620, r: 18 },
        { id: 'andhra-pradesh', name: 'Andhra Pradesh', isState: true, cx: 360, cy: 725, r: 22 },
        { id: 'karnataka', name: 'Karnataka', isState: true, cx: 280, cy: 740, r: 24 },
        { id: 'tamil-nadu', name: 'Tamil Nadu', isState: true, cx: 320, cy: 895, r: 22 },
        { id: 'kerala', name: 'Kerala', isState: true, cx: 255, cy: 920, r: 20 },
        { id: 'puducherry', name: 'Puducherry', isState: false, cx: 340, cy: 885, r: 7 },

        // ═══════════════════════════════════════════════════════════════
        // ISLAND UNION TERRITORIES
        // ═══════════════════════════════════════════════════════════════
        { id: 'lakshadweep', name: 'Lakshadweep', isState: false, cx: 105, cy: 875, r: 9 },
        { id: 'andaman-nicobar', name: 'Andaman & Nicobar', isState: false, cx: 680, cy: 970, r: 13 },
    ];

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
     * Get Color Based on Coverage Level (Indian Tricolor Theme)
     */
    const getCoverageColor = (overall) => {
        if (overall >= 70) return '#138808'; // Green - Fully Covered
        if (overall >= 25) return '#FF9933'; // Saffron - Partially Covered
        return '#9CA3AF'; // Gray - Not Started
    };

    /**
     * Handle Region Click Navigation
     */
    const handleRegionClick = (region) => {
        const shouldDim =
            (viewMode === 'states' && !region.isState) ||
            (viewMode === 'uts' && region.isState);

        if (shouldDim) return;

        const path = region.isState
            ? `/states/${region.id}`
            : `/union-territories/${region.id}`;
        navigate(path);
    };

    /**
     * Handle Mouse Movement for Tooltip
     */
    const handleMouseMove = (e) => {
        if (!mapContainerRef.current) return;
        const rect = mapContainerRef.current.getBoundingClientRect();
        setTooltipPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <div className="relative w-full" ref={mapContainerRef}>
            {/* Map Container with Accurate India Map */}
            <div className="relative w-full mx-auto" style={{ maxWidth: '900px' }}>
                {/* Base Map Image and SVG Overlay - Single Container */}
                <div className="relative w-full">
                    {/* Background Map Image */}
                    <img
                        src={indiaMapImage}
                        alt="India Map"
                        className="w-full h-auto rounded-xl shadow-2xl"
                        style={{ maxHeight: '1000px', objectFit: 'contain', display: 'block' }}
                    />

                    {/* SVG Overlay with CORRECTED viewBox matching image dimensions exactly */}
                    <svg
                        viewBox="0 0 1024 1024"
                        preserveAspectRatio="xMidYMid meet"
                        className="absolute inset-0 w-full h-full"
                        style={{ pointerEvents: 'none' }}
                    >
                        {regions.map((region) => {
                            const progress = getRegionProgress(region.id);
                            const shouldDim =
                                (viewMode === 'states' && !region.isState) ||
                                (viewMode === 'uts' && region.isState);

                            const fillColor = shouldDim
                                ? '#E5E7EB'
                                : getCoverageColor(progress.overall);

                            const opacity = shouldDim
                                ? 0.3
                                : hoveredRegion?.id === region.id
                                    ? 0.95
                                    : 0.7;

                            const radius = hoveredRegion?.id === region.id
                                ? region.r * 1.15
                                : region.r;

                            return (
                                <circle
                                    key={region.id}
                                    cx={region.cx}
                                    cy={region.cy}
                                    r={radius}
                                    fill={fillColor}
                                    opacity={opacity}
                                    stroke={hoveredRegion?.id === region.id ? '#ffffff' : 'rgba(255,255,255,0.5)'}
                                    strokeWidth={hoveredRegion?.id === region.id ? 3 : 2}
                                    style={{
                                        pointerEvents: shouldDim ? 'none' : 'all',
                                        cursor: shouldDim ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        filter: hoveredRegion?.id === region.id
                                            ? 'drop-shadow(0 4px 20px rgba(0,0,0,0.4)) drop-shadow(0 0 30px rgba(255,255,255,0.3))'
                                            : 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
                                    }}
                                    onMouseEnter={() => !shouldDim && setHoveredRegion(region)}
                                    onMouseMove={(e) => !shouldDim && handleMouseMove(e)}
                                    onMouseLeave={() => setHoveredRegion(null)}
                                    onClick={() => handleRegionClick(region)}
                                />
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HOVER TOOLTIP - Tricolor Themed Progress Analytics             */}
            {/* ═══════════════════════════════════════════════════════════════ */}
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
                        className="bg-white/98 backdrop-blur-lg shadow-2xl rounded-xl px-6 py-5 border-3 min-w-[280px]"
                        style={{
                            borderColor: '#000080',
                            borderWidth: '3px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.5) inset',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-4 pb-3 border-b-2 border-gray-200">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                                style={{
                                    background: hoveredRegion.isState
                                        ? 'linear-gradient(135deg, #FF9933, #FF6600)'
                                        : 'linear-gradient(135deg, #138808, #0F6606)',
                                }}
                            >
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4
                                    className="font-black text-lg leading-tight mb-1"
                                    style={{ color: '#000080' }}
                                >
                                    {hoveredRegion.name}
                                </h4>
                                <span
                                    className="text-xs px-3 py-1 rounded-full font-bold inline-block"
                                    style={{
                                        background: hoveredRegion.isState
                                            ? '#FF9933'
                                            : '#138808',
                                        color: 'white',
                                    }}
                                >
                                    {hoveredRegion.isState ? 'State' : 'Union Territory'}
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
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        Notes
                                                    </span>
                                                </div>
                                                <span
                                                    className="text-sm font-black"
                                                    style={{ color: '#000080' }}
                                                >
                                                    {progress.notes}%
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <HelpCircle className="w-4 h-4" style={{ color: '#FF9933' }} />
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        Questions
                                                    </span>
                                                </div>
                                                <span
                                                    className="text-sm font-black"
                                                    style={{ color: '#FF9933' }}
                                                >
                                                    {progress.questions}%
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <CheckSquare className="w-4 h-4" style={{ color: '#138808' }} />
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        Solutions
                                                    </span>
                                                </div>
                                                <span
                                                    className="text-sm font-black"
                                                    style={{ color: '#138808' }}
                                                >
                                                    {progress.solutions}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Overall Progress */}
                                        <div className="mt-4 pt-4 border-t-2 border-gray-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp
                                                        className="w-5 h-5"
                                                        style={{ color: '#FF9933' }}
                                                    />
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
                                                        background: `linear-gradient(90deg, ${getCoverageColor(
                                                            progress.overall
                                                        )}, ${getCoverageColor(progress.overall)}dd)`,
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

export default SVGBasedIndiaMap;
