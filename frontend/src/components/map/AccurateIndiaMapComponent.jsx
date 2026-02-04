import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp, Book, HelpCircle, CheckSquare, Navigation } from 'lucide-react';
import indiaMapImage from '../../assets/images/india-map-accurate.png';

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  GEOGRAPHICALLY ACCURATE INDIA MAP                                     ║
 * ║  Built using precise, accurate political boundaries                    ║
 * ║  Complete coverage of 28 States + 8 Union Territories                  ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

const AccurateIndiaMapComponent = ({ viewMode = 'states', userProgress = {} }) => {
    const navigate = useNavigate();
    const [hoveredRegion, setHoveredRegion] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const mapContainerRef = useRef(null);

    /**
     * REGION DEFINITIONS WITH ACCURATE COORDINATES
     * Mapped to the new geographically accurate India map
     * Using percentage-based positioning for responsiveness
     */
    const regions = [
        // ═══════════════════════════════════════════════════════════════
        // NORTHERN REGION (States & UTs)
        // ═══════════════════════════════════════════════════════════════
        { id: 'ladakh', name: 'Ladakh', isState: false, x: 48, y: 20, size: 35 },
        { id: 'jammu-kashmir', name: 'Jammu & Kashmir', isState: false, x: 38, y: 16, size: 30 },
        { id: 'himachal-pradesh', name: 'Himachal Pradesh', isState: true, x: 40, y: 19, size: 18 },
        { id: 'punjab', name: 'Punjab', isState: true, x: 44, y: 21, size: 12 },
        { id: 'chandigarh', name: 'Chandigarh', isState: false, x: 40, y: 22, size: 4 },
        { id: 'uttarakhand', name: 'Uttarakhand', isState: true, x: 43, y: 23, size: 14 },
        { id: 'haryana', name: 'Haryana', isState: true, x: 40, y: 26, size: 12 },
        { id: 'delhi', name: 'Delhi', isState: false, x: 40, y: 27, size: 4 },

        // ═══════════════════════════════════════════════════════════════
        // WESTERN REGION
        // ═══════════════════════════════════════════════════════════════
        { id: 'rajasthan', name: 'Rajasthan', isState: true, x: 32, y: 32, size: 28 },
        { id: 'gujarat', name: 'Gujarat', isState: true, x: 24, y: 48, size: 25 },
        { id: 'dnh-dd', name: 'DNH & DD', isState: false, x: 26, y: 54, size: 4 },

        // ═══════════════════════════════════════════════════════════════
        // CENTRAL REGION
        // ═══════════════════════════════════════════════════════════════
        { id: 'uttar-pradesh', name: 'Uttar Pradesh', isState: true, x: 40, y: 30, size: 26 },
        { id: 'madhya-pradesh', name: 'Madhya Pradesh', isState: true, x: 35, y: 48, size: 28 },
        { id: 'chhattisgarh', name: 'Chhattisgarh', isState: true, x: 48, y: 52, size: 18 },

        // ═══════════════════════════════════════════════════════════════
        // EASTERN REGION
        // ═══════════════════════════════════════════════════════════════
        { id: 'bihar', name: 'Bihar', isState: true, x: 52, y: 35, size: 16 },
        { id: 'jharkhand', name: 'Jharkhand', isState: true, x: 52, y: 48, size: 14 },
        { id: 'west-bengal', name: 'West Bengal', isState: true, x: 58, y: 52, size: 16 },
        { id: 'odisha', name: 'Odisha', isState: true, x: 55, y: 62, size: 18 },

        // ═══════════════════════════════════════════════════════════════
        // NORTHEASTERN REGION
        // ═══════════════════════════════════════════════════════════════
        { id: 'sikkim', name: 'Sikkim', isState: true, x: 60, y: 32, size: 6 },
        { id: 'arunachal-pradesh', name: 'Arunachal Pradesh', isState: true, x: 76, y: 38, size: 16 },
        { id: 'assam', name: 'Assam', isState: true, x: 70, y: 36, size: 14 },
        { id: 'nagaland', name: 'Nagaland', isState: true, x: 76, y: 35, size: 8 },
        { id: 'manipur', name: 'Manipur', isState: true, x: 76, y: 40, size: 8 },
        { id: 'mizoram', name: 'Mizoram', isState: true, x: 74, y: 48, size: 8 },
        { id: 'tripura', name: 'Tripura', isState: true, x: 68, y: 43, size: 7 },
        { id: 'meghalaya', name: 'Meghalaya', isState: true, x: 67, y: 38, size: 8 },

        // ═══════════════════════════════════════════════════════════════
        // SOUTHERN REGION
        // ═══════════════════════════════════════════════════════════════
        { id: 'maharashtra', name: 'Maharashtra', isState: true, x: 32, y: 62, size: 24 },
        { id: 'goa', name: 'Goa', isState: true, x: 28, y: 72, size: 6 },
        { id: 'telangana', name: 'Telangana', isState: true, x: 42, y: 65, size: 14 },
        { id: 'andhra-pradesh', name: 'Andhra Pradesh', isState: true, x: 45, y: 75, size: 18 },
        { id: 'karnataka', name: 'Karnataka', isState: true, x: 33, y: 75, size: 20 },
        { id: 'tamil-nadu', name: 'Tamil Nadu', isState: true, x: 42, y: 90, size: 18 },
        { id: 'kerala', name: 'Kerala', isState: true, x: 32, y: 92, size: 16 },
        { id: 'puducherry', name: 'Puducherry', isState: false, x: 42, y: 87, size: 4 },

        // ═══════════════════════════════════════════════════════════════
        // ISLAND UNION TERRITORIES
        // ═══════════════════════════════════════════════════════════════
        { id: 'lakshadweep', name: 'Lakshadweep', isState: false, x: 12, y: 85, size: 6 },
        { id: 'andaman-nicobar', name: 'Andaman & Nicobar', isState: false, x: 78, y: 88, size: 10 },
    ];

    /**
     * Get Regional Progress Data
     */
    const getRegionProgress = (regionId) => {
        const progress = userProgress[regionId];
        if (!progress) {
            return { overall: 0, notes: 0, questions: 0, solutions: 0 };
        }

        // Handle both number and object formats
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
     * Using Indian Tricolor Theme
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
    const handleMouseMove = (e, region) => {
        if (!mapContainerRef.current) return;

        const rect = mapContainerRef.current.getBoundingClientRect();
        setTooltipPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        setHoveredRegion(region);
    };

    return (
        <div className="relative w-full" ref={mapContainerRef}>
            {/* Map Container with Accurate India Map */}
            <div className="relative w-full mx-auto" style={{ maxWidth: '900px' }}>
                {/* Background Map Image */}
                <div className="relative w-full">
                    <img
                        src={indiaMapImage}
                        alt="India Map"
                        className="w-full h-auto rounded-xl shadow-2xl"
                        style={{ maxHeight: '700px', objectFit: 'contain' }}
                    />

                    {/* Interactive Region Markers Overlay */}
                    <div className="absolute inset-0">
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

                            // Calculate responsive size
                            const baseSize = region.size;
                            const size = hoveredRegion?.id === region.id
                                ? baseSize * 1.15
                                : baseSize;

                            return (
                                <div
                                    key={region.id}
                                    className="absolute transition-all duration-300 rounded-full"
                                    style={{
                                        left: `${region.x}%`,
                                        top: `${region.y}%`,
                                        width: `${size}px`,
                                        height: `${size}px`,
                                        transform: 'translate(-50%, -50%)',
                                        backgroundColor: fillColor,
                                        opacity: opacity,
                                        cursor: shouldDim ? 'not-allowed' : 'pointer',
                                        border: hoveredRegion?.id === region.id
                                            ? '3px solid white'
                                            : '2px solid rgba(255,255,255,0.5)',
                                        boxShadow: hoveredRegion?.id === region.id
                                            ? '0 4px 20px rgba(0,0,0,0.4), 0 0 30px rgba(255,255,255,0.3)'
                                            : '0 2px 8px rgba(0,0,0,0.2)',
                                        zIndex: hoveredRegion?.id === region.id ? 50 : 10,
                                    }}
                                    onMouseEnter={(e) => !shouldDim && handleMouseMove(e, region)}
                                    onMouseMove={(e) => !shouldDim && handleMouseMove(e, region)}
                                    onMouseLeave={() => setHoveredRegion(null)}
                                    onClick={() => handleRegionClick(region)}
                                />
                            );
                        })}
                    </div>
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

export default AccurateIndiaMapComponent;
