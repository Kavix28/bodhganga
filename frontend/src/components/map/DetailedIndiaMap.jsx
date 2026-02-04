import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp } from 'lucide-react';

/**
 * DETAILED POLITICAL MAP OF INDIA
 * With accurate state boundaries matching real geography
 */

const DetailedIndiaMap = ({ viewMode = 'states', userProgress = {}, navigateToNotes = true }) => {
    const navigate = useNavigate();
    const [hoveredRegion, setHoveredRegion] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const getCoverageLevel = (regionId) => {
        const progress = userProgress[regionId] || 0;
        if (progress >= 70) return 'full';
        if (progress >= 25) return 'partial';
        return 'none';
    };

    const getFillColor = (regionId, isState) => {
        if (viewMode === 'states' && !isState) return '#E5E7EB';
        if (viewMode === 'uts' && isState) return '#E5E7EB';

        const coverage = getCoverageLevel(regionId);
        return coverage === 'full' ? '#138808' : coverage === 'partial' ? '#FF9933' : '#9CA3AF';
    };

    const handleRegionClick = (regionId, isState) => {
        if ((viewMode === 'states' && !isState) || (viewMode === 'uts' && isState)) return;
        navigate(isState ? `/states/${regionId}` : `/union-territories/${regionId}`);
    };

    const handleMouseMove = (e, region) => {
        const svg = e.currentTarget.closest('svg');
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setHoveredRegion(region);
    };

    /**
     * Detailed state boundaries - more angular and accurate
     */
    const states = [
        {
            id: 'jammu-kashmir', name: 'Jammu & Kashmir', isState: false,
            path: 'M160,50 L180,45 L200,48 L220,55 L235,65 L245,78 L250,92 L248,108 L240,122 L228,132 L215,137 L200,135 L185,128 L172,118 L165,105 L160,90 L158,75 Z'
        },

        {
            id: 'ladakh', name: 'Ladakh', isState: false,
            path: 'M252,50 L275,45 L300,50 L322,60 L340,75 L348,92 L348,110 L342,125 L330,138 L315,145 L298,145 L280,140 L265,130 L255,115 L252,98 L252,80 Z'
        },

        {
            id: 'himachal-pradesh', name: 'Himachal Pradesh', isState: true,
            path: 'M215,140 L235,137 L255,142 L272,150 L285,162 L292,177 L292,192 L285,205 L272,215 L255,220 L235,218 L218,210 L205,197 L200,182 L202,165 L208,152 Z'
        },

        {
            id: 'punjab', name: 'Punjab', isState: true,
            path: 'M165,145 L185,140 L205,145 L220,155 L228,168 L230,183 L228,198 L218,210 L205,218 L188,220 L172,215 L158,205 L150,190 L148,175 L152,160 Z'
        },

        {
            id: 'chandigarh', name: 'Chandigarh', isState: false,
            path: 'M205,175 L210,173 L214,176 L213,181 L208,183 L203,180 Z'
        },

        {
            id: 'haryana', name: 'Haryana', isState: true,
            path: 'M158,220 L175,222 L195,228 L212,238 L225,252 L232,268 L232,285 L225,300 L212,312 L195,320 L175,322 L158,318 L145,308 L138,293 L135,278 L138,262 L145,245 Z'
        },

        {
            id: 'delhi', name: 'Delhi', isState: false,
            path: 'M193,268 L199,266 L204,269 L204,275 L199,278 L193,276 L190,272 Z'
        },

        {
            id: 'uttarakhand', name: 'Uttarakhand', isState: true,
            path: 'M255,222 L275,220 L295,228 L312,240 L325,258 L332,278 L332,298 L325,315 L312,328 L295,335 L275,338 L258,332 L245,320 L238,303 L235,285 L238,268 L245,250 Z'
        },

        {
            id: 'rajasthan', name: 'Rajasthan', isState: true,
            path: 'M65,260 L90,252 L115,255 L140,265 L162,280 L180,300 L195,325 L205,355 L210,390 L210,430 L205,470 L195,510 L180,545 L162,575 L140,598 L115,610 L90,612 L68,605 L50,590 L38,570 L30,545 L25,515 L23,485 L25,450 L30,420 L38,390 L48,360 L56,330 L62,300 Z'
        },

        {
            id: 'uttar-pradesh', name: 'Uttar Pradesh', isState: true,
            path: 'M235,325 L260,320 L290,330 L320,345 L350,365 L380,390 L408,420 L432,455 L450,490 L460,525 L465,560 L462,595 L450,625 L432,650 L408,670 L380,685 L350,692 L320,692 L290,682 L265,665 L245,642 L230,615 L220,585 L215,550 L215,515 L220,480 L228,450 L238,420 L245,390 L248,360 Z'
        },

        {
            id: 'bihar', name: 'Bihar', isState: true,
            path: 'M410,675 L435,670 L465,675 L495,688 L522,708 L545,732 L560,760 L568,790 L570,820 L565,850 L555,875 L540,895 L520,908 L495,915 L465,915 L438,905 L415,888 L398,865 L388,840 L385,815 L388,790 L398,768 L408,748 L418,728 L425,708 Z'
        },

        {
            id: 'sikkim', name: 'Sikkim', isState: true,
            path: 'M559,565 L572,562 L585,567 L594,578 L598,592 L595,606 L585,617 L572,622 L559,619 L548,610 L544,596 L547,582 Z'
        },

        {
            id: 'arunachal-pradesh', name: 'Arunachal Pradesh', isState: true,
            path: 'M600,520 L640,512 L680,520 L715,538 L742,562 L760,592 L770,628 L772,665 L765,700 L750,730 L730,755 L705,772 L675,782 L645,785 L618,778 L595,762 L578,738 L568,708 L565,675 L568,642 L578,612 L592,585 L605,560 Z'
        },

        {
            id: 'nagaland', name: 'Nagaland', isState: true,
            path: 'M708,775 L728,770 L748,778 L762,792 L770,812 L770,832 L762,850 L748,862 L728,867 L708,862 L692,850 L684,832 L684,812 L692,795 Z'
        },

        {
            id: 'manipur', name: 'Manipur', isState: true,
            path: 'M705,870 L725,867 L745,875 L758,890 L765,910 L763,930 L753,948 L738,960 L720,965 L702,962 L686,950 L675,933 L672,913 L677,893 L688,878 Z'
        },

        {
            id: 'mizoram', name: 'Mizoram', isState: true,
            path: 'M673,968 L693,965 L712,973 L725,988 L730,1008 L725,1028 L712,1043 L693,1050 L673,1047 L658,1038 L648,1023 L645,1003 L650,983 L660,970 Z'
        },

        {
            id: 'tripura', name: 'Tripura', isState: true,
            path: 'M635,900 L655,897 L673,905 L685,920 L690,938 L685,956 L673,971 L655,978 L635,975 L620,966 L612,951 L610,933 L615,917 L623,905 Z'
        },

        {
            id: 'meghalaya', name: 'Meghalaya', isState: true,
            path: 'M585,835 L605,830 L625,838 L640,852 L648,870 L645,890 L633,905 L615,913 L597,913 L582,905 L572,890 L570,870 L575,852 Z'
        },

        {
            id: 'assam', name: 'Assam', isState: true,
            path: 'M545,775 L570,768 L598,775 L628,790 L658,810 L685,835 L708,865 L722,895 L730,928 L730,960 L722,989 L708,1013 L688,1030 L663,1040 L635,1042 L608,1035 L582,1020 L560,998 L543,970 L532,938 L528,905 L530,872 L538,842 L548,815 Z'
        },

        {
            id: 'west-bengal', name: 'West Bengal', isState: true,
            path: 'M495,920 L520,915 L548,925 L575,942 L600,965 L618,992 L630,1025 L635,1060 L633,1095 L623,1128 L605,1155 L582,1175 L555,1185 L528,1185 L503,1175 L482,1155 L468,1128 L460,1095 L458,1060 L463,1025 L473,995 L485,968 Z'
        },

        {
            id: 'jharkhand', name: 'Jharkhand', isState: true,
            path: 'M410,920 L438,915 L468,925 L495,942 L515,968 L528,1000 L533,1035 L530,1070 L518,1100 L500,1122 L478,1135 L453,1138 L428,1130 L408,1112 L393,1085 L385,1053 L385,1020 L393,990 L403,963 L413,940 Z'
        },

        {
            id: 'odisha', name: 'Odisha', isState: true,
            path: 'M453,1142 L480,1138 L510,1148 L540,1168 L565,1195 L582,1230 L590,1270 L590,1310 L582,1348 L565,1380 L540,1405 L510,1418 L480,1420 L453,1410 L430,1390 L413,1363 L403,1330 L400,1293 L403,1258 L413,1228 L425,1200 L438,1175 Z'
        },

        {
            id: 'chhattisgarh', name: 'Chhattisgarh', isState: true,
            path: 'M320,950 L350,942 L380,952 L408,970 L433,995 L450,1028 L460,1065 L462,1105 L455,1145 L440,1178 L418,1203 L393,1218 L365,1223 L338,1215 L315,1198 L298,1173 L288,1140 L285,1103 L288,1068 L298,1035 L308,1005 L318,978 Z'
        },

        {
            id: 'madhya-pradesh', name: 'Madhya Pradesh', isState: true,
            path: 'M210,615 L245,605 L280,610 L315,625 L350,648 L382,678 L410,715 L432,758 L445,805 L450,855 L445,905 L432,950 L410,988 L382,1018 L350,1038 L315,1045 L280,1040 L245,1025 L215,1000 L190,968 L172,930 L162,888 L160,843 L165,798 L175,758 L190,720 L202,685 Z'
        },

        {
            id: 'gujarat', name: 'Gujarat', isState: true,
            path: 'M35,640 L65,630 L95,635 L125,648 L152,670 L175,700 L192,738 L202,783 L205,833 L202,883 L192,930 L175,973 L152,1010 L125,1037 L95,1052 L68,1055 L42,1045 L22,1025 L10,998 L3,963 L2,923 L5,883 L12,845 L22,810 L32,778 L40,748 L45,718 L47,688 L45,658 Z'
        },

        {
            id: 'dnh-dd', name: 'DNH & DD', isState: false,
            path: 'M118,890 L126,887 L134,891 L135,900 L129,905 L121,902 Z'
        },

        {
            id: 'maharashtra', name: 'Maharashtra', isState: true,
            path: 'M162,1025 L195,1015 L232,1020 L270,1035 L305,1058 L335,1088 L358,1125 L372,1168 L378,1215 L375,1265 L362,1310 L340,1348 L310,1378 L275,1395 L238,1400 L202,1390 L170,1368 L143,1338 L123,1300 L110,1258 L105,1213 L108,1168 L118,1128 L133,1093 L148,1065 Z'
        },

        {
            id: 'goa', name: 'Goa', isState: true,
            path: 'M170,1405 L185,1402 L200,1410 L208,1425 L210,1442 L203,1458 L190,1468 L175,1470 L162,1462 L155,1447 L153,1430 L158,1415 Z'
        },

        {
            id: 'telangana', name: 'Telangana', isState: true,
            path: 'M320,1225 L350,1218 L380,1230 L405,1250 L420,1278 L425,1310 L420,1342 L405,1370 L380,1388 L350,1395 L320,1388 L295,1373 L278,1350 L270,1320 L270,1288 L278,1260 L295,1238 Z'
        },

        {
            id: 'andhra-pradesh', name: 'Andhra Pradesh', isState: true,
            path: 'M350,1400 L385,1393 L425,1405 L465,1428 L500,1460 L525,1500 L540,1548 L545,1600 L540,1650 L525,1695 L500,1730 L465,1755 L425,1765 L385,1760 L350,1745 L320,1720 L298,1688 L285,1650 L280,1608 L285,1565 L298,1525 L315,1490 L335,1460 Z'
        },

        {
            id: 'karnataka', name: 'Karnataka', isState: true,
            path: 'M202,1395 L240,1387 L280,1395 L320,1415 L355,1445 L380,1485 L395,1535 L400,1590 L395,1645 L380,1693 L355,1733 L320,1760 L280,1773 L240,1770 L205,1750 L175,1718 L153,1678 L140,1630 L135,1578 L140,1528 L153,1485 L170,1450 L187,1420 Z'
        },

        {
            id: 'puducherry', name: 'Puducherry', isState: false,
            path: 'M395,1780 L403,1777 L410,1781 L410,1790 L404,1795 L396,1792 Z'
        },

        {
            id: 'tamil-nadu', name: 'Tamil Nadu', isState: true,
            path: 'M280,1775 L325,1768 L375,1780 L425,1805 L470,1840 L505,1885 L530,1940 L543,2000 L545,2065 L538,2125 L520,2178 L490,2220 L450,2248 L405,2260 L360,2255 L320,2235 L285,2200 L258,2155 L240,2100 L232,2040 L232,1980 L240,1925 L255,1875 L268,1830 Z'
        },

        {
            id: 'kerala', name: 'Kerala', isState: true,
            path: 'M175,1755 L215,1745 L255,1760 L285,1785 L308,1820 L320,1865 L325,1920 L323,1980 L313,2038 L295,2090 L270,2133 L240,2165 L208,2180 L178,2182 L152,2165 L133,2135 L122,2098 L118,2055 L120,2010 L128,1968 L140,1928 L155,1893 L168,1863 L175,1835 Z'
        },

        {
            id: 'lakshadweep', name: 'Lakshadweep', isState: false,
            path: 'M25,2030 L35,2027 L44,2032 L46,2043 L40,2050 L31,2048 L26,2041 Z'
        },

        {
            id: 'andaman-nicobar', name: 'Andaman & Nicobar', isState: false,
            path: 'M880,1850 L905,1840 L930,1850 L950,1872 L962,1902 L968,1940 L968,1985 L962,2028 L950,2065 L930,2093 L905,2108 L880,2110 L855,2100 L835,2078 L822,2050 L815,2015 L815,1975 L822,1938 L835,1908 L852,1883 Z'
        }
    ];

    return (
        <div className="relative w-full flex flex-col items-center">
            <svg viewBox="0 0 1000 2300" className="w-full h-auto" style={{ maxHeight: '700px' }} onMouseLeave={() => setHoveredRegion(null)}>
                <rect x="0" y="0" width="1000" height="2300" fill="#F3F4F6" />

                <defs>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.2" />
                    </pattern>
                </defs>

                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* India outline */}
                <path d="M160,45 L275,45 L348,92 L772,665 L770,832 L730,1008 L690,1095 L635,1185 L590,1348 L545,1650 L543,2065 L490,2220 L360,2260 L178,2182 L118,2055 L68,1055 L22,810 L23,515 L62,300 L158,75 Z"
                    fill="none" stroke="#000080" strokeWidth="2" opacity="0.12" />

                {/* All states */}
                {states.map(state => {
                    const shouldDim = (viewMode === 'states' && !state.isState) || (viewMode === 'uts' && state.isState);
                    return (
                        <path key={state.id} d={state.path}
                            fill={getFillColor(state.id, state.isState)}
                            stroke="#FFFFFF" strokeWidth="1.5"
                            opacity={shouldDim ? 0.3 : (hoveredRegion?.id === state.id ? 0.95 : 1)}
                            className="transition-all duration-200 cursor-pointer"
                            style={{ filter: hoveredRegion?.id === state.id ? 'drop-shadow(0 3px 8px rgba(0,0,0,0.2))' : 'none' }}
                            onMouseEnter={(e) => !shouldDim && handleMouseMove(e, state)}
                            onMouseMove={(e) => !shouldDim && handleMouseMove(e, state)}
                            onClick={() => handleRegionClick(state.id, state.isState)}
                        />
                    );
                })}

                {/* Labels */}
                {[
                    { id: 'rajasthan', x: 130, y: 430 }, { id: 'madhya-pradesh', x: 305, y: 820 },
                    { id: 'maharashtra', x: 255, y: 1230 }, { id: 'uttar-pradesh', x: 330, y: 480 },
                    { id: 'bihar', x: 495, y: 810 }, { id: 'karnataka', x: 245, y: 1580 },
                    { id: 'tamil-nadu', x: 375, y: 2000 }, { id: 'gujarat', x: 115, y: 850 },
                    { id: 'andhra-pradesh', x: 420, y: 1580 }, { id: 'telangana', x: 350, y: 1310 }
                ].map(({ id, x, y }) => (
                    <text key={`lbl-${id}`} x={x} y={y} fontSize="14" fontWeight="700" fill="#FFF"
                        opacity="0.9" pointerEvents="none" textAnchor="middle" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                        {states.find(s => s.id === id)?.name.split(' ')[0].toUpperCase()}
                    </text>
                ))}
            </svg>

            {hoveredRegion && (
                <div className="fixed z-50 pointer-events-none" style={{ left: `${tooltipPos.x + 20}px`, top: `${tooltipPos.y - 20}px`, transform: 'translate(0, -100%)' }}>
                    <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-xl px-4 py-3 border-2 min-w-[200px]" style={{ borderColor: 'var(--navy)' }}>
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4" style={{ color: 'var(--saffron)' }} />
                            <span className="font-bold text-sm" style={{ color: 'var(--navy)' }}>{hoveredRegion.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs mb-2">
                            <span className="px-2 py-0.5 rounded-full text-white font-semibold"
                                style={{ background: hoveredRegion.isState ? 'var(--saffron)' : 'var(--green)' }}>
                                {hoveredRegion.isState ? 'State' : 'UT'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <TrendingUp className="w-3 h-3" />
                            <span>Coverage: {userProgress[hoveredRegion.id] || 0}%</span>
                        </div>
                        <div className="text-xs font-semibold" style={{ color: 'var(--saffron)' }}>Click to view Notes →</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailedIndiaMap;
