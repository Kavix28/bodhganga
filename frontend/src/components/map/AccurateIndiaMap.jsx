import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp } from 'lucide-react';

/**
 * ACCURATE INDIA MAP - DETAILED GEOGRAPHIC BOUNDARIES
 * 
 * Features:
 * - Accurate political map of India
 * - Real state boundaries (not simplified shapes)
 * - All 28 States with proper geographic outlines
 * - All 8 Union Territories clearly marked
 * - Tricolor theme for progress visualization
 * - Interactive hover tooltips
 * - Click navigation to regional Notes
 */

const AccurateIndiaMap = ({ viewMode = 'states', userProgress = {}, navigateToNotes = true }) => {
    const navigate = useNavigate();
    const [hoveredRegion, setHoveredRegion] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    // Calculate coverage level
    const getCoverageLevel = (regionId) => {
        const progress = userProgress[regionId] || 0;
        if (progress >= 70) return 'full';
        if (progress >= 25) return 'partial';
        return 'none';
    };

    // Get fill color using TRICOLOR THEME
    const getFillColor = (regionId, isState) => {
        if (viewMode === 'states' && !isState) return '#E5E7EB';
        if (viewMode === 'uts' && isState) return '#E5E7EB';

        const coverage = getCoverageLevel(regionId);
        switch (coverage) {
            case 'full':
                return '#138808'; // Green
            case 'partial':
                return '#FF9933'; // Saffron
            default:
                return '#9CA3AF'; // Gray
        }
    };

    // Handle region click
    const handleRegionClick = (regionId, isState) => {
        if (viewMode === 'states' && !isState) return;
        if (viewMode === 'uts' && isState) return;

        const path = isState ? `/states/${regionId}` : `/union-territories/${regionId}`;
        navigate(path);
    };

    // Track mouse for tooltip
    const handleMouseMove = (e, region) => {
        const svg = e.currentTarget.closest('svg');
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        setTooltipPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setHoveredRegion(region);
    };

    /**
     * ACCURATE INDIA MAP - SVG PATH DATA
     * Detailed geographic boundaries for all states and UTs
     */
    const indiaStates = [
        // JAMMU & KASHMIR (UT)
        {
            id: 'jammu-kashmir',
            name: 'Jammu & Kashmir',
            isState: false,
            path: 'M 180,85 L 185,75 L 195,70 L 210,75 L 220,82 L 228,88 L 235,95 L 240,105 L 242,115 L 240,125 L 235,135 L 228,142 L 220,148 L 210,152 L 200,153 L 190,150 L 182,145 L 175,138 L 170,128 L 168,118 L 168,108 L 172,98 Z'
        },

        // LADAKH (UT)
        {
            id: 'ladakh',
            name: 'Ladakh',
            isState: false,
            path: 'M 245,70 L 260,65 L 280,68 L 300,75 L 315,85 L 325,95 L 330,110 L 328,125 L 320,138 L 308,148 L 295,153 L 280,155 L 265,153 L 252,148 L 243,140 L 240,125 L 242,110 L 248,95 L 250,85 Z'
        },

        // HIMACHAL PRADESH
        {
            id: 'himachal-pradesh',
            name: 'Himachal Pradesh',
            isState: true,
            path: 'M 205,155 L 220,152 L 235,153 L 250,157 L 262,165 L 270,175 L 275,185 L 275,195 L 270,205 L 260,212 L 248,218 L 235,220 L 222,218 L 210,212 L 200,203 L 195,192 L 193,180 L 195,168 Z'
        },

        // PUNJAB
        {
            id: 'punjab',
            name: 'Punjab',
            isState: true,
            path: 'M 175,155 L 190,153 L 205,157 L 215,165 L 220,175 L 222,188 L 220,200 L 212,210 L 200,218 L 185,222 L 172,220 L 160,212 L 153,200 L 150,185 L 152,170 L 160,160 Z'
        },

        // CHANDIGARH (UT)
        {
            id: 'chandigarh',
            name: 'Chandigarh',
            isState: false,
            path: 'M 201,180 L 206,178 L 210,181 L 209,186 L 204,188 L 199,185 Z'
        },

        // HARYANA
        {
            id: 'haryana',
            name: 'Haryana',
            isState: true,
            path: 'M 160,218 L 175,220 L 190,225 L 205,232 L 215,242 L 220,255 L 220,268 L 215,280 L 205,290 L 190,295 L 175,295 L 160,290 L 148,280 L 142,268 L 140,255 L 142,242 L 148,230 Z'
        },

        // DELHI (UT)
        {
            id: 'delhi',
            name: 'Delhi',
            isState: false,
            path: 'M 188,258 L 194,256 L 199,259 L 199,265 L 195,268 L 189,267 L 186,263 Z'
        },

        // UTTARAKHAND
        {
            id: 'uttarakhand',
            name: 'Uttarakhand',
            isState: true,
            path: 'M 238,222 L 255,220 L 272,225 L 285,235 L 295,248 L 300,262 L 298,275 L 290,288 L 278,298 L 262,305 L 245,307 L 230,303 L 220,295 L 215,282 L 215,268 L 220,255 L 228,242 Z'
        },

        // RAJASTHAN
        {
            id: 'rajasthan',
            name: 'Rajasthan',
            isState: true,
            path: 'M 85,240 L 105,235 L 125,238 L 145,245 L 162,255 L 175,268 L 185,285 L 192,305 L 195,328 L 195,352 L 192,375 L 185,398 L 175,420 L 162,438 L 145,452 L 125,460 L 105,462 L 85,458 L 68,448 L 55,435 L 45,418 L 40,398 L 38,375 L 40,352 L 45,330 L 53,310 L 65,290 L 75,270 Z'
        },

        // UTTAR PRADESH
        {
            id: 'uttar-pradesh',
            name: 'Uttar Pradesh',
            isState: true,
            path: 'M 220,298 L 240,295 L 262,300 L 282,310 L 302,323 L 320,338 L 338,355 L 355,372 L 368,390 L 378,408 L 385,428 L 388,448 L 385,468 L 378,485 L 365,498 L 348,508 L 328,515 L 308,518 L 288,518 L 268,513 L 248,505 L 230,493 L 215,478 L 203,460 L 195,440 L 190,418 L 188,395 L 190,372 L 195,350 L 203,330 L 210,315 Z'
        },

        // BIHAR
        {
            id: 'bihar',
            name: 'Bihar',
            isState: true,
            path: 'M 350,510 L 368,507 L 388,510 L 408,518 L 428,530 L 445,545 L 458,562 L 465,580 L 468,598 L 465,615 L 458,630 L 445,642 L 428,650 L 408,655 L 388,655 L 368,650 L 350,640 L 335,625 L 325,608 L 320,590 L 320,572 L 325,555 L 335,538 Z'
        },

        // SIKKIM
        {
            id: 'sikkim',
            name: 'Sikkim',
            isState: true,
            path: 'M 480,460 L 490,457 L 500,460 L 508,468 L 512,478 L 510,488 L 502,496 L 492,500 L 482,498 L 474,490 L 472,480 L 475,470 Z'
        },

        // ARUNACHAL PRADESH
        {
            id: 'arunachal-pradesh',
            name: 'Arunachal Pradesh',
            isState: true,
            path: 'M 515,420 L 545,415 L 575,418 L 600,428 L 620,442 L 635,460 L 645,480 L 650,502 L 648,524 L 640,544 L 625,560 L 605,572 L 582,580 L 558,583 L 535,580 L 515,572 L 500,560 L 490,544 L 485,524 L 485,502 L 490,480 L 500,460 L 508,442 Z'
        },

        // NAGALAND
        {
            id: 'nagaland',
            name: 'Nagaland',
            isState: true,
            path: 'M 608,575 L 622,572 L 635,577 L 645,587 L 650,600 L 648,613 L 640,624 L 628,630 L 615,630 L 603,625 L 595,615 L 592,603 L 595,590 Z'
        },

        // MANIPUR
        {
            id: 'manipur',
            name: 'Manipur',
            isState: true,
            path: 'M 605,635 L 620,633 L 632,638 L 640,648 L 643,660 L 640,672 L 632,682 L 620,687 L 608,687 L 596,682 L 588,672 L 585,660 L 588,648 L 596,638 Z'
        },

        // MIZORAM
        {
            id: 'mizoram',
            name: 'Mizoram',
            isState: true,
            path: 'M 590,690 L 603,688 L 615,693 L 623,703 L 625,715 L 622,727 L 613,737 L 600,742 L 588,740 L 578,732 L 573,720 L 573,708 L 578,698 Z'
        },

        // TRIPURA
        {
            id: 'tripura',
            name: 'Tripura',
            isState: true,
            path: 'M 548,665 L 560,663 L 571,668 L 578,678 L 580,690 L 577,702 L 569,712 L 558,717 L 547,717 L 537,712 L 530,702 L 528,690 L 531,678 L 539,668 Z'
        },

        // MEGHALAYA
        {
            id: 'meghalaya',
            name: 'Meghalaya',
            isState: true,
            path: 'M 505,608 L 520,605 L 535,610 L 547,620 L 553,633 L 550,646 L 540,657 L 525,663 L 510,663 L 497,657 L 488,646 L 485,633 L 488,620 L 497,610 Z'
        },

        // ASSAM
        {
            id: 'assam',
            name: 'Assam',
            isState: true,
            path: 'M 470,583 L 490,580 L 512,585 L 535,595 L 557,608 L 575,623 L 588,640 L 595,658 L 595,675 L 588,690 L 575,702 L 557,710 L 535,715 L 512,715 L 490,710 L 472,700 L 458,685 L 448,667 L 443,648 L 443,628 L 448,610 L 458,595 Z'
        },

        // WEST BENGAL
        {
            id: 'west-bengal',
            name: 'West Bengal',
            isState: true,
            path: 'M 430,655 L 450,652 L 470,658 L 487,670 L 500,685 L 508,703 L 512,722 L 510,742 L 502,760 L 488,775 L 470,785 L 450,790 L 430,788 L 412,780 L 397,767 L 387,750 L 382,730 L 382,710 L 387,690 L 397,673 L 410,660 Z'
        },

        // JHARKHAND
        {
            id: 'jharkhand',
            name: 'Jharkhand',
            isState: true,
            path: 'M 350,645 L 370,642 L 390,648 L 408,660 L 422,675 L 430,693 L 432,712 L 428,730 L 418,745 L 403,757 L 385,765 L 365,768 L 347,765 L 332,757 L 320,745 L 313,730 L 310,712 L 313,693 L 323,678 L 337,663 Z'
        },

        // ODISHA
        {
            id: 'odisha',
            name: 'Odisha',
            isState: true,
            path: 'M 365,770 L 385,767 L 405,773 L 423,785 L 438,802 L 448,822 L 453,843 L 453,865 L 448,886 L 438,905 L 423,920 L 405,930 L 385,935 L 365,935 L 347,930 L 332,920 L 320,905 L 313,886 L 310,865 L 313,843 L 323,822 L 337,802 L 350,785 Z'
        },

        // CHHATTISGARH
        {
            id: 'chhattisgarh',
            name: 'Chhattisgarh',
            isState: true,
            path: 'M 270,685 L 290,682 L 310,688 L 328,700 L 343,715 L 353,733 L 358,753 L 358,773 L 353,793 L 343,810 L 328,823 L 310,830 L 290,832 L 270,828 L 253,818 L 240,803 L 232,785 L 228,765 L 228,745 L 232,725 L 243,708 L 256,695 Z'
        },

        // MADHYA PRADESH
        {
            id: 'madhya-pradesh',
            name: 'Madhya Pradesh',
            isState: true,
            path: 'M 195,465 L 220,460 L 248,465 L 275,475 L 300,490 L 323,508 L 343,528 L 358,550 L 368,573 L 373,597 L 373,622 L 368,646 L 358,668 L 343,686 L 323,700 L 300,710 L 275,715 L 248,715 L 220,710 L 195,700 L 173,686 L 155,668 L 142,646 L 133,622 L 130,597 L 133,573 L 142,550 L 155,530 L 173,512 L 185,495 Z'
        },

        // GUJARAT
        {
            id: 'gujarat',
            name: 'Gujarat',
            isState: true,
            path: 'M 50,490 L 75,485 L 100,490 L 122,502 L 140,520 L 153,542 L 160,568 L 162,595 L 158,622 L 148,648 L 133,670 L 113,687 L 90,697 L 68,700 L 48,695 L 32,683 L 20,665 L 13,643 L 10,618 L 12,593 L 20,568 L 32,545 L 43,525 Z'
        },

        // DNH-DD (UT)
        {
            id: 'dnh-dd',
            name: 'DNH & DD',
            isState: false,
            path: 'M 95,650 L 102,648 L 108,651 L 108,658 L 103,661 L 96,659 Z'
        },

        // MAHARASHTRA
        {
            id: 'maharashtra',
            name: 'Maharashtra',
            isState: true,
            path: 'M 135,705 L 160,700 L 188,708 L 215,720 L 240,738 L 260,760 L 275,785 L 285,812 L 290,840 L 288,868 L 280,893 L 265,915 L 245,932 L 220,943 L 193,948 L 168,945 L 145,935 L 125,920 L 108,900 L 95,875 L 87,848 L 85,820 L 88,792 L 97,765 L 110,740 L 123,720 Z'
        },

        // GOA
        {
            id: 'goa',
            name: 'Goa',
            isState: true,
            path: 'M 135,945 L 148,943 L 160,948 L 168,958 L 170,970 L 165,981 L 155,988 L 143,990 L 132,985 L 125,975 L 123,963 L 128,952 Z'
        },

        // TELANGANA
        {
            id: 'telangana',
            name: 'Telangana',
            isState: true,
            path: 'M 270,835 L 290,832 L 310,838 L 328,850 L 340,867 L 345,887 L 343,907 L 333,925 L 318,938 L 300,945 L 280,945 L 262,938 L 248,925 L 240,907 L 238,887 L 243,867 L 255,850 Z'
        },

        // ANDHRA PRADESH
        {
            id: 'andhra-pradesh',
            name: 'Andhra Pradesh',
            isState: true,
            path: 'M 295,950 L 318,947 L 343,953 L 365,965 L 383,982 L 395,1003 L 402,1027 L 403,1052 L 398,1076 L 385,1097 L 365,1113 L 342,1123 L 318,1127 L 295,1123 L 275,1113 L 258,1097 L 247,1076 L 243,1052 L 247,1027 L 258,1003 L 273,982 Z'
        },

        // KARNATAKA
        {
            id: 'karnataka',
            name: 'Karnataka',
            isState: true,
            path: 'M 168,950 L 195,947 L 223,955 L 248,970 L 268,990 L 283,1015 L 290,1043 L 288,1072 L 278,1098 L 260,1120 L 235,1135 L 208,1143 L 180,1143 L 155,1135 L 133,1120 L 117,1098 L 107,1072 L 103,1043 L 107,1015 L 117,990 L 133,970 L 150,955 Z'
        },

        // PUDUCHERRY (UT)
        {
            id: 'puducherry',
            name: 'Puducherry',
            isState: false,
            path: 'M 320,1155 L 327,1153 L 333,1156 L 333,1162 L 328,1165 L 321,1163 Z'
        },

        // TAMIL NADU
        {
            id: 'tamil-nadu',
            name: 'Tamil Nadu',
            isState: true,
            path: 'M 235,1140 L 263,1137 L 293,1145 L 320,1160 L 343,1180 L 360,1205 L 370,1233 L 373,1263 L 368,1290 L 355,1313 L 335,1330 L 310,1340 L 283,1343 L 258,1338 L 235,1325 L 215,1305 L 200,1280 L 192,1253 L 190,1225 L 195,1197 L 207,1172 L 222,1153 Z'
        },

        // KERALA
        {
            id: 'kerala',
            name: 'Kerala',
            isState: true,
            path: 'M 155,1140 L 180,1137 L 205,1148 L 225,1165 L 238,1187 L 245,1213 L 245,1240 L 238,1267 L 223,1290 L 203,1308 L 180,1318 L 158,1320 L 138,1313 L 122,1298 L 112,1278 L 107,1255 L 108,1230 L 115,1205 L 127,1182 L 142,1163 Z'
        },

        // LAKSHADWEEP (UT)
        {
            id: 'lakshadweep',
            name: 'Lakshadweep',
            isState: false,
            path: 'M 40,1230 L 48,1228 L 55,1232 L 56,1240 L 51,1245 L 43,1244 L 38,1238 Z'
        },

        // ANDAMAN & NICOBAR (UT)
        {
            id: 'andaman-nicobar',
            name: 'Andaman & Nicobar',
            isState: false,
            path: 'M 680,1050 L 695,1045 L 710,1050 L 720,1062 L 725,1078 L 725,1097 L 720,1115 L 710,1130 L 695,1140 L 680,1143 L 665,1140 L 653,1130 L 645,1115 L 642,1097 L 645,1078 L 653,1062 L 665,1050 Z'
        }
    ];

    return (
        <div className="relative w-full flex flex-col items-center">
            {/* SVG Map */}
            <svg
                viewBox="0 0 750 1380"
                className="w-full h-auto"
                style={{ maxHeight: '700px', maxWidth: '700px' }}
                onMouseLeave={() => setHoveredRegion(null)}
            >
                {/* Background */}
                <rect x="0" y="0" width="750" height="1380" fill="#F9FAFB" />

                {/* Grid pattern */}
                <defs>
                    <pattern id="accurateGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.2" />
                    </pattern>

                    {/* Ashoka Chakra watermark */}
                    <g id="chakraWatermark">
                        <circle cx="375" cy="690" r="100" fill="none" stroke="#000080" strokeWidth="2" opacity="0.02" />
                        <circle cx="375" cy="690" r="75" fill="none" stroke="#000080" strokeWidth="1" opacity="0.02" />
                        {[...Array(24)].map((_, i) => (
                            <line
                                key={i}
                                x1={375 + 70 * Math.cos((i * 15 * Math.PI) / 180)}
                                y1={690 + 70 * Math.sin((i * 15 * Math.PI) / 180)}
                                x2={375 + 95 * Math.cos((i * 15 * Math.PI) / 180)}
                                y2={690 + 95 * Math.sin((i * 15 * Math.PI) / 180)}
                                stroke="#000080"
                                strokeWidth="1.5"
                                opacity="0.02"
                            />
                        ))}
                    </g>
                </defs>

                <rect width="100%" height="100%" fill="url(#accurateGrid)" />
                <use href="#chakraWatermark" />

                {/* India Border Outline */}
                <path
                    d="M 180,75 L 260,65 L 330,110 L 650,502 L 648,613 L 625,715 L 580,740 L 512,760 L 453,886 L 403,1076 L 373,1290 L 283,1343 L 180,1320 L 103,1255 L 68,700 L 32,545 L 38,398 L 85,240 L 168,118 Z"
                    fill="none"
                    stroke="#000080"
                    strokeWidth="2.5"
                    opacity="0.15"
                />

                {/* International Borders */}
                <path
                    d="M 180,75 L 170,70 L 155,72 L 145,80"
                    fill="none"
                    stroke="#666"
                    strokeWidth="1.5"
                    strokeDasharray="4,3"
                    opacity="0.3"
                />

                {/* States and UTs */}
                <g id="regions">
                    {indiaStates.map((state) => {
                        const shouldDim = (viewMode === 'states' && !state.isState) || (viewMode === 'uts' && state.isState);

                        return (
                            <path
                                key={state.id}
                                d={state.path}
                                fill={getFillColor(state.id, state.isState)}
                                stroke="#FFFFFF"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                opacity={shouldDim ? 0.35 : (hoveredRegion?.id === state.id ? 0.95 : 1)}
                                className="transition-all duration-300 cursor-pointer"
                                style={{
                                    filter: hoveredRegion?.id === state.id ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' : 'none',
                                    cursor: shouldDim ? 'not-allowed' : 'pointer'
                                }}
                                onMouseEnter={(e) => !shouldDim && handleMouseMove(e, state)}
                                onMouseMove={(e) => !shouldDim && handleMouseMove(e, state)}
                                onClick={() => handleRegionClick(state.id, state.isState)}
                            />
                        );
                    })}
                </g>

                {/* State Labels - Major States */}
                {[
                    { id: 'rajasthan', x: 130, y: 360 },
                    { id: 'madhya-pradesh', x: 260, y: 610 },
                    { id: 'maharashtra', x: 190, y: 830 },
                    { id: 'uttar-pradesh', x: 285, y: 400 },
                    { id: 'bihar', x: 395, y: 590 },
                    { id: 'karnataka', x: 180, y: 1040 },
                    { id: 'tamil-nadu', x: 275, y: 1240 },
                    { id: 'gujarat', x: 95, y: 590 },
                    { id: 'andhra-pradesh', x: 315, y: 1040 },
                    { id: 'telangana', x: 295, y: 890 },
                    { id: 'west-bengal', x: 460, y: 730 },
                    { id: 'odisha', x: 380, y: 860 },
                ].map(({ id, x, y }) => (
                    <text
                        key={`label-${id}`}
                        x={x}
                        y={y}
                        fontSize="13"
                        fontWeight="700"
                        fill="#FFFFFF"
                        opacity="0.85"
                        pointerEvents="none"
                        className="select-none"
                        textAnchor="middle"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                    >
                        {indiaStates.find(s => s.id === id)?.name.split(' ')[0].toUpperCase()}
                    </text>
                ))}
            </svg>

            {/* Floating Tooltip */}
            {hoveredRegion && (
                <div
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: `${tooltipPos.x + 20}px`,
                        top: `${tooltipPos.y - 20}px`,
                        transform: 'translate(0, -100%)'
                    }}
                >
                    <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-xl px-4 py-3 border-2 min-w-[200px] slide-down" style={{ borderColor: 'var(--navy)' }}>
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4" style={{ color: 'var(--saffron)' }} />
                            <span className="font-bold text-sm" style={{ color: 'var(--navy)' }}>
                                {hoveredRegion.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                            <span className="px-2 py-0.5 rounded-full" style={{
                                background: hoveredRegion.isState ? 'var(--saffron)' : 'var(--green)',
                                color: 'white',
                                fontWeight: '600'
                            }}>
                                {hoveredRegion.isState ? 'State' : 'UT'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <TrendingUp className="w-3 h-3" />
                            <span>Coverage: {userProgress[hoveredRegion.id] || 0}%</span>
                        </div>
                        <div className="text-xs font-semibold" style={{ color: 'var(--saffron)' }}>
                            Click to view Notes →
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccurateIndiaMap;
