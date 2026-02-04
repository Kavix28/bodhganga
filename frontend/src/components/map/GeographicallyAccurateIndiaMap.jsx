import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp, Book, HelpCircle, CheckSquare, Navigation } from 'lucide-react';
import indiaMapImage from '../../assets/images/india-map-accurate.png';

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  GEOGRAPHICALLY ACCURATE INDIA MAP - SVG-BASED PRECISION             ║
 * ║  Built with SVG viewBox coordinates for true geographic accuracy     ║
 * ║  Complete coverage of 28 States + 8 Union Territories                ║
 * ║  Includes callout lines for small regions                             ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

const GeographicallyAccurateIndiaMap = ({ viewMode = 'states', userProgress = {} }) => {
    const navigate = useNavigate();
    const [hoveredRegion, setHoveredRegion] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    /**
     * VIEWBOX DIMENSIONS
     * Using 1024x1024 to match the original map image aspect ratio
     */
    const VIEWBOX_WIDTH = 1024;
    const VIEWBOX_HEIGHT = 1024;

    /**
     * REGION DEFINITIONS WITH PRECISE SVG COORDINATES
     * Coordinates are in SVG viewBox units (0-1024)
     * Manually calibrated against the actual map image
     * 
     * FORMAT:
     * - x, y: Center position of the region in viewBox coordinates
     * - size: Marker diameter in pixels
     * - hasCallout: true for small regions requiring callout lines
     * - calloutEnd: [x, y] endpoint of callout line (if hasCallout is true)
     */
    const regions = [
        // ═══════════════════════════════════════════════════════════════
        // NORTHERN REGION (States & UTs)
        // ═══════════════════════════════════════════════════════════════
        {
            id: 'ladakh',
            name: 'Ladakh',
            isState: false,
            x: 492,
            y: 205,
            size: 30,
            hasCallout: false
        },
        {
            id: 'jammu-kashmir',
            name: 'Jammu & Kashmir',
            isState: false,
            x: 389,
            y: 164,
            size: 25,
            hasCallout: false
        },
        {
            id: 'himachal-pradesh',
            name: 'Himachal Pradesh',
            isState: true,
            x: 410,
            y: 195,
            size: 15,
            hasCallout: false
        },
        {
            id: 'punjab',
            name: 'Punjab',
            isState: true,
            x: 450,
            y: 215,
            size: 12,
            hasCallout: false
        },
        {
            id: 'chandigarh',
            name: 'Chandigarh',
            isState: false,
            x: 410,
            y: 225,
            size: 8,
            hasCallout: true,
            calloutEnd: [380, 245]
        },
        {
            id: 'uttarakhand',
            name: 'Uttarakhand',
            isState: true,
            x: 440,
            y: 235,
            size: 12,
            hasCallout: false
        },
        {
            id: 'haryana',
            name: 'Haryana',
            isState: true,
            x: 410,
            y: 266,
            size: 10,
            hasCallout: false
        },
        {
            id: 'delhi',
            name: 'Delhi',
            isState: false,
            x: 410,
            y: 277,
            size: 8,
            hasCallout: true,
            calloutEnd: [460, 295]
        },

        // ═══════════════════════════════════════════════════════════════
        // WESTERN REGION
        // ═══════════════════════════════════════════════════════════════
        {
            id: 'rajasthan',
            name: 'Rajasthan',
            isState: true,
            x: 328,
            y: 328,
            size: 24,
            hasCallout: false
        },
        {
            id: 'gujarat',
            name: 'Gujarat',
            isState: true,
            x: 246,
            y: 492,
            size: 20,
            hasCallout: false
        },
        {
            id: 'dnh-dd',
            name: 'DNH & DD',
            isState: false,
            x: 266,
            y: 553,
            size: 8,
            hasCallout: true,
            calloutEnd: [220, 575]
        },

        // ═══════════════════════════════════════════════════════════════
        // CENTRAL REGION
        // ═══════════════════════════════════════════════════════════════
        {
            id: 'uttar-pradesh',
            name: 'Uttar Pradesh',
            isState: true,
            x: 410,
            y: 307,
            size: 22,
            hasCallout: false
        },
        {
            id: 'madhya-pradesh',
            name: 'Madhya Pradesh',
            isState: true,
            x: 358,
            y: 492,
            size: 24,
            hasCallout: false
        },
        {
            id: 'chhattisgarh',
            name: 'Chhattisgarh',
            isState: true,
            x: 492,
            y: 533,
            size: 16,
            hasCallout: false
        },

        // ═══════════════════════════════════════════════════════════════
        // EASTERN REGION
        // ═══════════════════════════════════════════════════════════════
        {
            id: 'bihar',
            name: 'Bihar',
            isState: true,
            x: 533,
            y: 358,
            size: 14,
            hasCallout: false
        },
        {
            id: 'jharkhand',
            name: 'Jharkhand',
            isState: true,
            x: 533,
            y: 492,
            size: 12,
            hasCallout: false
        },
        {
            id: 'west-bengal',
            name: 'West Bengal',
            isState: true,
            x: 594,
            y: 533,
            size: 14,
            hasCallout: false
        },
        {
            id: 'odisha',
            name: 'Odisha',
            isState: true,
            x: 563,
            y: 635,
            size: 16,
            hasCallout: false
        },

        // ═══════════════════════════════════════════════════════════════
        // NORTHEASTERN REGION (Dense cluster - precise positioning)
        // ═══════════════════════════════════════════════════════════════
        {
            id: 'sikkim',
            name: 'Sikkim',
            isState: true,
            x: 614,
            y: 328,
            size: 8,
            hasCallout: true,
            calloutEnd: [640, 310]
        },
        {
            id: 'arunachal-pradesh',
            name: 'Arunachal Pradesh',
            isState: true,
            x: 778,
            y: 389,
            size: 14,
            hasCallout: false
        },
        {
            id: 'assam',
            name: 'Assam',
            isState: true,
            x: 717,
            y: 369,
            size: 12,
            hasCallout: false
        },
        {
            id: 'nagaland',
            name: 'Nagaland',
            isState: true,
            x: 778,
            y: 358,
            size: 8,
            hasCallout: true,
            calloutEnd: [810, 345]
        },
        {
            id: 'manipur',
            name: 'Manipur',
            isState: true,
            x: 778,
            y: 410,
            size: 8,
            hasCallout: true,
            calloutEnd: [810, 420]
        },
        {
            id: 'mizoram',
            name: 'Mizoram',
            isState: true,
            x: 747,
            y: 461,
            size: 8,
            hasCallout: true,
            calloutEnd: [785, 485]
        },
        {
            id: 'tripura',
            name: 'Tripura',
            isState: true,
            x: 696,
            y: 441,
            size: 7,
            hasCallout: true,
            calloutEnd: [720, 465]
        },
        {
            id: 'meghalaya',
            name: 'Meghalaya',
            isState: true,
            x: 686,
            y: 389,
            size: 8,
            hasCallout: true,
            calloutEnd: [655, 370]
        },

        // ═══════════════════════════════════════════════════════════════
        // SOUTHERN REGION
        // ═══════════════════════════════════════════════════════════════
        {
            id: 'maharashtra',
            name: 'Maharashtra',
            isState: true,
            x: 328,
            y: 635,
            size: 20,
            hasCallout: false
        },
        {
            id: 'goa',
            name: 'Goa',
            isState: true,
            x: 287,
            y: 738,
            size: 8,
            hasCallout: true,
            calloutEnd: [260, 760]
        },
        {
            id: 'telangana',
            name: 'Telangana',
            isState: true,
            x: 430,
            y: 666,
            size: 12,
            hasCallout: false
        },
        {
            id: 'andhra-pradesh',
            name: 'Andhra Pradesh',
            isState: true,
            x: 461,
            y: 768,
            size: 16,
            hasCallout: false
        },
        {
            id: 'karnataka',
            name: 'Karnataka',
            isState: true,
            x: 338,
            y: 768,
            size: 18,
            hasCallout: false
        },
        {
            id: 'tamil-nadu',
            name: 'Tamil Nadu',
            isState: true,
            x: 389,
            y: 901,
            size: 16,
            hasCallout: false
        },
        {
            id: 'kerala',
            name: 'Kerala',
            isState: true,
            x: 307,
            y: 901,
            size: 14,
            hasCallout: false
        },
        {
            id: 'puducherry',
            name: 'Puducherry',
            isState: false,
            x: 430,
            y: 891,
            size: 8,
            hasCallout: true,
            calloutEnd: [470, 910]
        },

        // ═══════════════════════════════════════════════════════════════
        // ISLAND UNION TERRITORIES
        // ═══════════════════════════════════════════════════════════════
        {
            id: 'lakshadweep',
            name: 'Lakshadweep',
            isState: false,
            x: 123,
            y: 870,
            size: 8,
            hasCallout: false
        },
        {
            id: 'andaman-nicobar',
            name: 'Andaman & Nicobar',
            isState: false,
            x: 799,
            y: 901,
            size: 10,
            hasCallout: false
        },
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
    const handleMouseMove = (e) => {
        setTooltipPos({
            x: e.clientX,
            y: e.clientY,
        });
    };

    return (
        <div className="relative w-full">
            {/* Map Container with Accurate India Map */}
            <div className="relative w-full mx-auto" style={{ maxWidth: '900px' }}>
                {/* SVG Overlay with Precise viewBox Coordinates */}
                <svg
                    className="w-full h-auto"
                    viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                    style={{
                        aspectRatio: '1 / 1',
                        maxHeight: '900px',
                    }}
                >
                    {/* Background Map Image */}
                    <image
                        href={indiaMapImage}
                        x="0"
                        y="0"
                        width={VIEWBOX_WIDTH}
                        height={VIEWBOX_HEIGHT}
                        preserveAspectRatio="xMidYMid meet"
                    />

                    {/* Interactive Region Markers Overlay */}
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

                        const isHovered = hoveredRegion?.id === region.id;
                        const size = isHovered ? region.size * 1.15 : region.size;
                        const radius = size / 2;

                        return (
                            <g key={region.id}>
                                {/* Callout Line for Small Regions */}
                                {region.hasCallout && !shouldDim && (
                                    <>
                                        <line
                                            x1={region.x}
                                            y1={region.y}
                                            x2={region.calloutEnd[0]}
                                            y2={region.calloutEnd[1]}
                                            stroke={fillColor}
                                            strokeWidth={isHovered ? 3 : 2}
                                            opacity={opacity}
                                        />
                                        {/* Callout Label */}
                                        <rect
                                            x={region.calloutEnd[0] - 40}
                                            y={region.calloutEnd[1] - 12}
                                            width="80"
                                            height="24"
                                            fill="white"
                                            stroke={fillColor}
                                            strokeWidth="2"
                                            rx="4"
                                            opacity={isHovered ? 1 : 0.9}
                                        />
                                        <text
                                            x={region.calloutEnd[0]}
                                            y={region.calloutEnd[1]}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize="10"
                                            fontWeight="bold"
                                            fill="#000080"
                                            opacity={isHovered ? 1 : 0.9}
                                        >
                                            {region.name.length > 12
                                                ? region.id.split('-').map(w => w[0].toUpperCase()).join('')
                                                : region.name
                                            }
                                        </text>
                                    </>
                                )}

                                {/* Region Marker Circle */}
                                <circle
                                    cx={region.x}
                                    cy={region.y}
                                    r={radius}
                                    fill={fillColor}
                                    opacity={opacity}
                                    stroke={isHovered ? 'white' : 'rgba(255,255,255,0.5)'}
                                    strokeWidth={isHovered ? 3 : 2}
                                    style={{
                                        cursor: shouldDim ? 'not-allowed' : 'pointer',
                                        filter: isHovered
                                            ? 'drop-shadow(0px 4px 20px rgba(0,0,0,0.4))'
                                            : 'drop-shadow(0px 2px 8px rgba(0,0,0,0.2))',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!shouldDim) {
                                            setHoveredRegion(region);
                                            handleMouseMove(e);
                                        }
                                    }}
                                    onMouseMove={(e) => {
                                        if (!shouldDim) {
                                            handleMouseMove(e);
                                        }
                                    }}
                                    onMouseLeave={() => setHoveredRegion(null)}
                                    onClick={() => handleRegionClick(region)}
                                />
                            </g>
                        );
                    })}
                </svg>
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

export default GeographicallyAccurateIndiaMap;
