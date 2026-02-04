import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, MapPin } from 'lucide-react';

/**
 * IMAGE-BASED INTERACTIVE INDIA MAP
 * Uses the provided 'indian-map' image with SVG overlay for interactivity
 * All 28 States + 8 UTs with hover analytics and click navigation
 */

const ImageBasedIndiaMap = ({ viewMode = 'states', userProgress = {} }) => {
    const navigate = useNavigate();
    const [hoveredRegion, setHoveredRegion] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const mapRef = useRef(null);

    // State/UT definitions with SVG path coordinates mapped to indian-map image
    // Coordinates are percentages for responsiveness
    const regions = [
        // NORTHERN STATES & UTs
        {
            id: 'jammu-kashmir', name: 'Jammu & Kashmir', isState: false,
            path: 'M 180,60 L 210,50 L 240,55 L 255,75 L 250,95 L 235,110 L 210,115 L 185,110 L 170,95 L 168,75 Z'
        },

        {
            id: 'ladakh', name: 'Ladakh', isState: false,
            path: 'M 260,45 L 295,38 L 330,48 L 350,68 L 348,95 L 330,115 L 300,120 L 270,112 L 258,95 L 258,70 Z'
        },

        {
            id: 'himachal-pradesh', name: 'Himachal Pradesh', isState: true,
            path: 'M 210,118 L 240,115 L 268,125 L 285,145 L 288,165 L 275,182 L 250,188 L 225,183 L 208,168 L 205,148 Z'
        },

        {
            id: 'punjab', name: 'Punjab', isState: true,
            path: 'M 165,125 L 190,120 L 212,128 L 225,145 L 225,165 L 212,180 L 190,185 L 168,178 L 158,163 L 158,143 Z'
        },

        {
            id: 'chandigarh', name: 'Chandigarh', isState: false,
            path: 'M 205,155 L 212,153 L 217,158 L 215,163 L 208,165 L 203,160 Z'
        },

        {
            id: 'uttarakhand', name: 'Uttarakhand', isState: true,
            path: 'M 253,190 L 280,185 L 305,195 L 320,215 L 322,238 L 310,258 L 285,265 L 260,260 L 245,243 L 243,218 Z'
        },

        {
            id: 'haryana', name: 'Haryana', isState: true,
            path: 'M 160,188 L 188,185 L 215,195 L 235,215 L 238,238 L 228,258 L 205,268 L 180,265 L 163,250 L 158,228 L 160,208 Z'
        },

        {
            id: 'delhi', name: 'Delhi', isState: false,
            path: 'M 195,235 L 203,233 L 208,238 L 206,243 L 198,245 L 193,240 Z'
        },

        // WESTERN STATES
        {
            id: 'rajasthan', name: 'Rajasthan', isState: true,
            path: 'M 85,270 L 125,260 L 165,275 L 195,305 L 210,350 L 210,410 L 200,465 L 178,510 L 145,540 L 108,550 L 75,540 L 52,515 L 38,480 L 32,435 L 35,385 L 48,335 L 65,295 Z'
        },

        {
            id: 'gujarat', name: 'Gujarat', isState: true,
            path: 'M 45,545 L 80,535 L 115,548 L 145,575 L 165,615 L 170,665 L 162,710 L 140,745 L 105,765 L 70,768 L 42,755 L 22,730 L 12,695 L 10,655 L 18,610 L 30,575 Z'
        },

        {
            id: 'dnh-dd', name: 'DNH & DD', isState: false,
            path: 'M 115,680 L 125,678 L 130,683 L 128,688 L 120,690 L 115,685 Z'
        },

        // CENTRAL STATES  
        {
            id: 'uttar-pradesh', name: 'Uttar Pradesh', isState: true,
            path: 'M 240,270 L 285,265 L 330,280 L 375,310 L 410,355 L 432,410 L 438,470 L 428,525 L 403,565 L 368,590 L 328,600 L 288,595 L 253,575 L 225,545 L 210,505 L 205,460 L 210,415 L 220,370 L 230,325 Z'
        },

        {
            id: 'madhya-pradesh', name: 'Madhya Pradesh', isState: true,
            path: 'M 212,520 L 255,510 L 300,525 L 345,555 L 380,595 L 402,645 L 410,700 L 405,755 L 385,800 L 350,830 L 305,840 L 260,830 L 220,805 L 190,770 L 172,730 L 165,685 L 168,640 L 180,595 L 195,560 Z'
        },

        {
            id: 'chhattisgarh', name: 'Chhattisgarh', isState: true,
            path: 'M 325,605 L 365,600 L 400,615 L 425,645 L 438,685 L 440,730 L 430,770 L 408,800 L 378,815 L 345,818 L 315,808 L 295,785 L 285,755 L 283,720 L 290,685 L 305,650 Z'
        },

        // EASTERN STATES
        {
            id: 'bihar', name: 'Bihar', isState: true,
            path: 'M 410,570 L 445,565 L 480,580 L 510,610 L 528,650 L 532,690 L 525,725 L 508,752 L 482,768 L 450,772 L 420,762 L 398,742 L 388,715 L 385,685 L 393,655 L 403,625 Z'
        },

        {
            id: 'jharkhand', name: 'Jharkhand', isState: true,
            path: 'M 408,775 L 440,770 L 470,785 L 492,810 L 502,845 L 500,880 L 485,908 L 460,925 L 428,930 L 398,918 L 380,895 L 372,865 L 372,835 L 382,805 Z'
        },

        {
            id: 'west-bengal', name: 'West Bengal', isState: true,
            path: 'M 485,775 L 518,770 L 550,790 L 575,825 L 590,870 L 595,920 L 588,970 L 570,1010 L 542,1035 L 508,1045 L 475,1038 L 450,1015 L 435,985 L 428,950 L 430,910 L 440,870 L 458,835 Z'
        },

        {
            id: 'odisha', name: 'Odisha', isState: true,
            path: 'M 443,820 L 478,815 L 515,835 L 545,870 L 562,920 L 568,980 L 562,1040 L 542,1090 L 510,1125 L 470,1143 L 430,1140 L 400,1118 L 380,1085 L 370,1045 L 368,1000 L 378,955 L 395,910 L 415,870 Z'
        },

        // NORTHEASTERN STATES
        {
            id: 'sikkim', name: 'Sikkim', isState: true,
            path: 'M 558,485 L 572,482 L 585,490 L 590,505 L 585,520 L 572,528 L 558,525 L 548,512 L 548,497 Z'
        },

        {
            id: 'arunachal-pradesh', name: 'Arunachal Pradesh', isState: true,
            path: 'M 595,430 L 640,420 L 685,435 L 720,465 L 740,510 L 745,560 L 735,605 L 710,640 L 675,660 L 635,665 L 600,655 L 575,630 L 560,595 L 555,555 L 560,510 L 575,475 Z'
        },

        {
            id: 'assam', name: 'Assam', isState: true,
            path: 'M 535,665 L 570,660 L 605,675 L 635,705 L 655,750 L 665,805 L 662,860 L 645,905 L 615,935 L 578,950 L 540,948 L 510,930 L 490,900 L 480,860 L 480,815 L 490,770 L 508,725 Z'
        },

        {
            id: 'nagaland', name: 'Nagaland', isState: true,
            path: 'M 680,665 L 702,662 L 722,675 L 732,697 L 730,720 L 715,738 L 695,743 L 675,735 L 665,717 L 665,695 Z'
        },

        {
            id: 'manipur', name: 'Manipur', isState: true,
            path: 'M 680,748 L 700,745 L 718,758 L 725,780 L 720,803 L 705,820 L 685,825 L 667,817 L 658,798 L 660,775 Z'
        },

        {
            id: 'mizoram', name: 'Mizoram', isState: true,
            path: 'M 655,828 L 673,825 L 690,838 L 698,860 L 695,885 L 680,905 L 660,910 L 643,900 L 635,880 L 638,857 Z'
        },

        {
            id: 'tripura', name: 'Tripura', isState: true,
            path: 'M 605,780 L 623,777 L 638,790 L 645,810 L 640,830 L 625,843 L 608,845 L 595,835 L 590,818 L 593,798 Z'
        },

        {
            id: 'meghalaya', name: 'Meghalaya', isState: true,
            path: 'M 570,728 L 590,725 L 608,738 L 618,758 L 615,780 L 600,795 L 582,798 L 565,788 L 558,770 L 560,750 Z'
        },

        // SOUTHERN STATES
        {
            id: 'maharashtra', name: 'Maharashtra', isState: true,
            path: 'M 172,775 L 220,765 L 270,780 L 315,810 L 350,855 L 372,915 L 380,985 L 375,1055 L 355,1115 L 320,1160 L 275,1185 L 225,1190 L 180,1170 L 145,1135 L 120,1085 L 108,1025 L 108,965 L 118,905 L 138,850 Z'
        },

        {
            id: 'goa', name: 'Goa', isState: true,
            path: 'M 148,1195 L 165,1192 L 180,1205 L 185,1225 L 178,1243 L 163,1253 L 148,1250 L 138,1238 L 138,1220 Z'
        },

        {
            id: 'telangana', name: 'Telangana', isState: true,
            path: 'M 318,1000 L 355,990 L 390,1008 L 415,1040 L 425,1082 L 420,1125 L 400,1160 L 370,1180 L 335,1185 L 305,1170 L 285,1145 L 278,1110 L 280,1070 L 293,1035 Z'
        },

        {
            id: 'andhra-pradesh', name: 'Andhra Pradesh', isState: true,
            path: 'M 335,1190 L 375,1182 L 420,1200 L 460,1235 L 488,1285 L 502,1350 L 505,1425 L 495,1495 L 470,1555 L 430,1595 L 385,1615 L 340,1615 L 300,1595 L 270,1560 L 252,1515 L 245,1460 L 248,1400 L 262,1345 L 285,1295 Z'
        },

        {
            id: 'karnataka', name: 'Karnataka', isState: true,
            path: 'M 180,1195 L 230,1185 L 280,1205 L 325,1240 L 360,1295 L 380,1365 L 385,1445 L 375,1525 L 350,1595 L 310,1650 L 260,1680 L 210,1685 L 168,1665 L 135,1625 L 115,1575 L 105,1515 L 105,1450 L 115,1385 L 135,1330 L 158,1280 Z'
        },

        {
            id: 'tamil-nadu', name: 'Tamil Nadu', isState: true,
            path: 'M 260,1685 L 315,1675 L 370,1695 L 420,1735 L 460,1795 L 485,1875 L 495,1965 L 490,2050 L 470,2125 L 435,2185 L 385,2220 L 330,2230 L 280,2210 L 238,2170 L 210,2115 L 195,2050 L 195,1980 L 205,1910 L 222,1845 L 243,1785 Z'
        },

        {
            id: 'kerala', name: 'Kerala', isState: true,
            path: 'M 168,1670 L 215,1660 L 258,1680 L 290,1720 L 308,1780 L 315,1855 L 312,1935 L 298,2010 L 272,2075 L 235,2120 L 195,2145 L 158,2145 L 128,2120 L 108,2078 L 98,2025 L 95,1965 L 100,1905 L 115,1850 L 135,1800 Z'
        },

        {
            id: 'puducherry', name: 'Puducherry', isState: false,
            path: 'M 385,1950 L 395,1948 L 402,1953 L 400,1960 L 392,1963 L 385,1958 Z'
        },

        // ISLAND UTs
        {
            id: 'lakshadweep', name: 'Lakshadweep', isState: false,
            path: 'M 35,1980 L 48,1977 L 58,1985 L 58,1998 L 50,2008 L 38,2008 L 30,2000 L 30,1988 Z'
        },

        {
            id: 'andaman-nicobar', name: 'Andaman & Nicobar', isState: false,
            path: 'M 850,1950 L 880,1940 L 908,1958 L 925,1990 L 932,2035 L 930,2090 L 918,2140 L 895,2180 L 863,2205 L 828,2212 L 798,2198 L 778,2168 L 768,2125 L 768,2075 L 778,2023 L 798,1983 Z'
        }
    ];

    const getRegionProgress = (regionId) => {
        const progress = userProgress[regionId];
        if (!progress) return { overall: 0, notes: 0, questions: 0, solutions: 0 };

        // Handle both number and object formats
        if (typeof progress === 'number') {
            return { overall: progress, notes: progress, questions: progress, solutions: progress };
        }
        return progress;
    };

    const getCoverageColor = (overall) => {
        if (overall >= 70) return '#138808'; // Green - Fully Covered
        if (overall >= 25) return '#FF9933'; // Saffron - Partially Covered
        return '#9CA3AF'; // Gray - Not Started
    };

    const handleRegionClick = (region) => {
        const shouldDim = (viewMode === 'states' && !region.isState) || (viewMode === 'uts' && region.isState);
        if (shouldDim) return;

        const path = region.isState ? `/states/${region.id}` : `/union-territories/${region.id}`;
        navigate(path);
    };

    const handleMouseMove = (e, region) => {
        if (!mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setHoveredRegion(region);
    };

    return (
        <div className="relative w-full max-w-5xl mx-auto" ref={mapRef}>
            {/* SVG Map with Image Background */}
            <svg viewBox="0 0 1000 2400" className="w-full h-auto" style={{ maxHeight: '700px' }}>
                {/* Background Image - indian-map */}
                <defs>
                    <pattern id="indiaMapImage" x="0" y="0" width="1" height="1">
                        <image
                            href="/indian-map.png"
                            x="0"
                            y="0"
                            width="1000"
                            height="2400"
                            preserveAspectRatio="xMidYMid slice"
                        />
                    </pattern>
                </defs>

                {/* Base layer with image */}
                <rect x="0" y="0" width="1000" height="2400" fill="url(#indiaMapImage)" opacity="0.15" />

                {/* Grid overlay for reference */}
                <rect x="0" y="0" width="1000" height="2400" fill="#F9FAFB" opacity="0.5" />

                {/* Interactive State/UT Regions */}
                <g id="interactive-regions">
                    {regions.map(region => {
                        const progress = getRegionProgress(region.id);
                        const shouldDim = (viewMode === 'states' && !region.isState) || (viewMode === 'uts' && region.isState);
                        const fillColor = shouldDim ? '#E5E7EB' : getCoverageColor(progress.overall);
                        const opacity = shouldDim ? 0.3 : (hoveredRegion?.id === region.id ? 0.85 : 0.65);

                        return (
                            <path
                                key={region.id}
                                d={region.path}
                                fill={fillColor}
                                fillOpacity={opacity}
                                stroke="#FFFFFF"
                                strokeWidth="2"
                                strokeLinejoin="round"
                                className="transition-all duration-300 cursor-pointer"
                                style={{
                                    filter: hoveredRegion?.id === region.id ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none',
                                    cursor: shouldDim ? 'not-allowed' : 'pointer'
                                }}
                                onMouseEnter={(e) => !shouldDim && handleMouseMove(e, region)}
                                onMouseMove={(e) => !shouldDim && handleMouseMove(e, region)}
                                onMouseLeave={() => setHoveredRegion(null)}
                                onClick={() => handleRegionClick(region)}
                            />
                        );
                    })}
                </g>

                {/* State Labels for major states */}
                {[
                    { id: 'rajasthan', x: 130, y: 400 },
                    { id: 'uttar-pradesh', x: 320, y: 420 },
                    { id: 'madhya-pradesh', x: 290, y: 700 },
                    { id: 'maharashtra', x: 250, y: 1000 },
                    { id: 'karnataka', x: 220, y: 1450 },
                    { id: 'tamil-nadu', x: 350, y: 1960 },
                    { id: 'andhra-pradesh', x: 390, y: 1420 },
                    { id: 'telangana', x: 350, y: 1090 },
                    { id: 'gujarat', x: 100, y: 660 },
                    { id: 'bihar', x: 465, y: 668 }
                ].map(({ id, x, y }) => {
                    const region = regions.find(r => r.id === id);
                    if (!region) return null;

                    return (
                        <text
                            key={`label-${id}`}
                            x={x}
                            y={y}
                            fontSize="16"
                            fontWeight="700"
                            fill="#FFFFFF"
                            opacity="0.9"
                            pointerEvents="none"
                            textAnchor="middle"
                            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                        >
                            {region.name.toUpperCase().split(' ')[0]}
                        </text>
                    );
                })}
            </svg>

            {/* Hover Tooltip with Progress Analytics */}
            {hoveredRegion && (
                <div
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: `${mousePos.x + 20}px`,
                        top: `${mousePos.y - 10}px`,
                        transform: 'translateY(-100%)'
                    }}
                >
                    <div
                        className="bg-white/98 backdrop-blur-lg shadow-2xl rounded-xl px-5 py-4 border-2 min-w-[260px]"
                        style={{ borderColor: '#000080' }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                            <MapPin className="w-5 h-5" style={{ color: '#FF9933' }} />
                            <div>
                                <h4 className="font-black text-base" style={{ color: '#000080' }}>
                                    {hoveredRegion.name}
                                </h4>
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                                    background: hoveredRegion.isState ? '#FF9933' : '#138808',
                                    color: 'white'
                                }}>
                                    {hoveredRegion.isState ? 'State' : 'Union Territory'}
                                </span>
                            </div>
                        </div>

                        {/* Progress Analytics */}
                        <div className="space-y-2">
                            {(() => {
                                const progress = getRegionProgress(hoveredRegion.id);
                                return (
                                    <>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">📝 Notes:</span>
                                            <span className="font-bold" style={{ color: '#000080' }}>
                                                {progress.notes}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">❓ Questions:</span>
                                            <span className="font-bold" style={{ color: '#000080' }}>
                                                {progress.questions}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">✅ Solutions:</span>
                                            <span className="font-bold" style={{ color: '#000080' }}>
                                                {progress.solutions}%
                                            </span>
                                        </div>

                                        {/* Overall Progress */}
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="w-4 h-4" style={{ color: '#FF9933' }} />
                                                    <span className="font-bold text-sm">Overall Progress:</span>
                                                </div>
                                                <span className="text-xl font-black" style={{ color: '#FF9933' }}>
                                                    {progress.overall}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className="h-full transition-all duration-500"
                                                    style={{
                                                        width: `${progress.overall}%`,
                                                        background: getCoverageColor(progress.overall)
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Call to Action */}
                                        <div className="mt-3 text-center text-xs font-semibold" style={{ color: '#FF9933' }}>
                                            Click to view Notes →
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

export default ImageBasedIndiaMap;
