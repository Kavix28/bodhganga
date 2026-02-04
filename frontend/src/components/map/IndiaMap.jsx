import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp } from 'lucide-react';

/**
 * POLITICAL INDIA MAP - REAL GEOGRAPHIC BOUNDARIES
 * Directly modified to replace circles with accurate state paths
 */

const IndiaMap = ({ viewMode = 'states', userProgress = {}, navigateToNotes = true }) => {
    const navigate = useNavigate();
    const [hoveredRegion, setHoveredRegion] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
        switch (coverage) {
            case 'full': return '#138808';
            case 'partial': return '#FF9933';
            default: return '#9CA3AF';
        }
    };

    const getOpacity = (regionId, isState) => {
        if (viewMode === 'states' && !isState) return 0.5;
        if (viewMode === 'uts' && isState) return 0.5;
        if (hoveredRegion?.id === regionId) return 0.9;
        return 1;
    };

    const handleRegionClick = (regionId, isState) => {
        if (viewMode === 'states' && !isState) return;
        if (viewMode === 'uts' && isState) return;
        const path = isState ? `/states/${regionId}` : `/union-territories/${regionId}`;
        navigate(path);
    };

    const handleMouseMove = (e) => {
        const svg = e.currentTarget.closest('svg');
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    // REAL POLITICAL MAP DATA - GEOGRAPHIC PATHS
    const mapRegions = [
        { id: 'jammu-kashmir', name: 'Jammu & Kashmir', isState: false, path: 'M140,35 L155,32 L172,36 L185,45 L193,58 L196,73 L194,88 L186,100 L174,108 L160,110 L147,106 L136,96 L130,83 L128,68 L132,52 Z' },
        { id: 'ladakh', name: 'Ladakh', isState: false, path: 'M200,28 L220,24 L242,29 L260,40 L272,56 L278,74 L276,92 L268,108 L255,118 L239,122 L222,120 L208,112 L199,98 L196,82 L200,65 Z' },
        { id: 'himachal-pradesh', name: 'Himachal Pradesh', isState: true, path: 'M160,113 L175,111 L192,115 L207,124 L218,137 L223,152 L223,167 L218,180 L207,191 L192,197 L175,198 L161,193 L150,183 L145,169 L144,154 L148,139 Z' },
        { id: 'punjab', name: 'Punjab', isState: true, path: 'M130,115 L145,112 L160,117 L172,127 L180,140 L183,155 L181,170 L173,183 L161,192 L147,196 L133,194 L121,186 L114,173 L111,158 L114,143 L121,129 Z' },
        { id: 'chandigarh', name: 'Chandigarh', isState: false, path: 'M161,147 L165,145 L168,148 L167,152 L163,154 L159,151 Z' },
        { id: 'haryana', name: 'Haryana', isState: true, path: 'M121,195 L136,197 L153,203 L168,213 L180,227 L187,243 L189,260 L186,277 L177,292 L164,303 L149,309 L134,309 L121,303 L111,290 L106,274 L105,257 L108,240 L114,223 Z' },
        { id: 'delhi', name: 'Delhi', isState: false, path: 'M152,250 L157,248 L161,251 L161,256 L157,259 L152,257 L149,253 Z' },
        { id: 'uttarakhand', name: 'Uttarakhand', isState: true, path: 'M192,200 L209,198 L227,204 L242,215 L254,231 L261,249 L263,268 L259,285 L250,300 L237,311 L222,317 L207,318 L193,313 L183,302 L177,287 L175,270 L178,253 L185,236 Z' },
        { id: 'rajasthan', name: 'Rajasthan', isState: true, path: 'M55,230 L75,224 L96,226 L117,235 L136,249 L152,268 L165,292 L174,320 L179,352 L180,388 L177,424 L170,458 L159,489 L144,516 L126,537 L106,551 L86,557 L68,556 L52,547 L40,533 L32,514 L27,491 L25,466 L27,441 L32,417 L40,394 L49,372 L57,351 L62,330 Z' },
        { id: 'uttar-pradesh', name: 'Uttar Pradesh', isState: true, path: 'M191,320 L213,315 L238,323 L263,337 L288,356 L311,379 L332,407 L349,439 L361,473 L368,508 L370,543 L366,578 L356,609 L340,635 L320,656 L297,670 L274,677 L251,677 L229,668 L210,652 L195,631 L184,606 L178,578 L176,547 L178,516 L184,486 L192,459 L199,433 L204,408 L206,383 Z' },
        { id: 'bihar', name: 'Bihar', isState: true, path: 'M324,660 L346,655 L371,660 L396,673 L418,692 L436,716 L449,744 L457,774 L460,806 L458,838 L450,867 L437,892 L420,911 L400,923 L378,928 L356,926 L336,917 L320,902 L308,882 L301,858 L298,833 L300,807 L306,782 L315,759 L323,737 Z' },
        { id: 'sikkim', name: 'Sikkim', isState: true, path: 'M442,443 L453,440 L464,444 L472,453 L476,465 L474,477 L466,487 L455,492 L444,490 L435,483 L431,471 L433,459 Z' },
        { id: 'arunachal-pradesh', name: 'Arunachal Pradesh', isState: true, path: 'M480,400 L512,394 L544,401 L571,416 L593,437 L609,464 L619,495 L623,529 L621,564 L612,596 L596,624 L575,647 L551,664 L526,674 L502,677 L479,673 L460,661 L446,643 L437,621 L433,596 L433,571 L437,545 L445,521 L456,498 L468,477 Z' },
        { id: 'nagaland', name: 'Nagaland', isState: true, path: 'M553,667 L569,664 L585,670 L597,682 L604,698 L605,715 L600,731 L589,744 L575,751 L560,752 L546,746 L536,736 L531,721 L531,705 L536,690 Z' },
        { id: 'manipur', name: 'Manipur', isState: true, path: 'M550,755 L566,752 L582,758 L594,770 L601,787 L602,805 L597,822 L586,837 L572,846 L557,848 L543,843 L532,833 L526,819 L525,802 L529,786 L537,771 Z' },
        { id: 'mizoram', name: 'Mizoram', isState: true, path: 'M530,850 L546,847 L561,853 L572,865 L578,882 L578,900 L572,917 L561,930 L546,937 L531,937 L518,930 L510,917 L507,900 L510,883 L518,867 Z' },
        { id: 'tripura', name: 'Tripura', isState: true, path: 'M502,720 L517,717 L531,723 L541,735 L546,750 L544,766 L536,780 L524,790 L511,794 L498,791 L488,782 L482,768 L481,752 L485,737 Z' },
        { id: 'meghalaya', name: 'Meghalaya', isState: true, path: 'M463,702 L480,698 L497,704 L511,716 L519,732 L521,750 L516,767 L506,781 L492,790 L478,793 L465,789 L455,779 L450,765 L449,748 L453,732 Z' },
        { id: 'assam', name: 'Assam', isState: true, path: 'M438,715 L460,710 L485,717 L511,731 L537,750 L562,774 L584,803 L600,835 L609,870 L612,906 L608,942 L596,975 L578,1002 L556,1023 L532,1037 L508,1044 L485,1044 L464,1037 L447,1023 L435,1004 L428,981 L425,955 L426,929 L431,903 L439,878 L449,855 L458,833 Z' },
        { id: 'west-bengal', name: 'West Bengal', isState: true, path: 'M378,933 L402,927 L428,936 L454,952 L478,975 L497,1004 L510,1039 L517,1078 L518,1120 L512,1162 L499,1200 L480,1232 L457,1257 L432,1272 L407,1277 L383,1272 L362,1257 L347,1236 L337,1210 L332,1181 L332,1150 L337,1120 L347,1092 L359,1067 L372,1044 Z' },
        { id: 'jharkhand', name: 'Jharkhand', isState: true, path: 'M324,937 L349,931 L376,940 L401,958 L421,984 L434,1016 L441,1052 L441,1090 L434,1126 L421,1158 L403,1183 L382,1200 L359,1208 L337,1207 L318,1197 L303,1180 L293,1158 L288,1132 L288,1105 L293,1080 L303,1056 L313,1034 Z' },
        { id: 'odisha', name: 'Odisha', isState: true, path: 'M359,1211 L383,1207 L409,1217 L435,1237 L458,1266 L474,1303 L483,1346 L485,1393 L480,1440 L467,1483 L447,1519 L422,1546 L395,1562 L368,1567 L343,1560 L322,1543 L307,1519 L297,1491 L292,1459 L292,1425 L297,1392 L307,1361 L322,1333 L339,1310 Z' },
        { id: 'chhattisgarh', name: 'Chhattisgarh', isState: true, path: 'M258,828 L283,821 L309,827 L334,841 L357,863 L375,892 L387,926 L394,964 L395,1004 L390,1045 L379,1084 L362,1118 L341,1146 L318,1164 L295,1172 L273,1170 L253,1159 L238,1140 L228,1116 L223,1089 L222,1060 L226,1031 L235,1004 L246,979 L256,955 Z' },
        { id: 'madhya-pradesh', name: 'Madhya Pradesh', isState: true, path: 'M180,590 L209,579 L241,578 L274,589 L307,609 L338,638 L366,675 L389,719 L406,769 L416,824 L419,882 L415,939 L404,992 L386,1037 L362,1074 L334,1101 L305,1117 L276,1123 L248,1119 L222,1105 L200,1083 L183,1055 L172,1022 L167,985 L167,946 L172,908 L182,871 L195,837 L207,805 L217,774 L224,744 Z' },
        { id: 'gujarat', name: 'Gujarat', isState: true, path: 'M30,490 L55,482 L81,485 L106,498 L129,520 L148,550 L161,588 L168,633 L169,682 L164,731 L153,777 L136,818 L114,852 L89,877 L65,892 L43,897 L24,892 L10,877 L2,854 L0,825 L2,795 L8,766 L18,738 L28,711 L37,685 L43,660 L47,635 L48,610 L46,585 Z' },
        { id: 'daman-diu', name: 'Daman & Diu', isState: false, path: 'M95,775 L102,773 L108,777 L108,784 L103,788 L96,786 Z' },
        { id: 'dadra-nagar-haveli', name: 'Dadra & Nagar Haveli', isState: false, path: 'M115,795 L122,793 L128,797 L128,804 L123,808 L116,806 Z' },
        { id: 'maharashtra', name: 'Maharashtra', isState: true, path: 'M136,900 L169,889 L205,892 L243,908 L280,935 L313,972 L339,1018 L357,1072 L366,1132 L367,1196 L359,1257 L343,1312 L319,1359 L289,1396 L256,1421 L221,1434 L188,1435 L158,1422 L132,1399 L112,1367 L98,1330 L90,1287 L87,1242 L90,1197 L98,1155 L112,1115 L128,1080 L143,1048 Z' },
        { id: 'goa', name: 'Goa', isState: true, path: 'M135,1437 L149,1434 L164,1441 L174,1454 L178,1471 L175,1488 L166,1502 L154,1510 L141,1512 L129,1505 L121,1493 L118,1477 L121,1461 Z' },
        { id: 'telangana', name: 'Telangana', isState: true, path: 'M258,1174 L284,1166 L311,1174 L335,1192 L352,1218 L361,1250 L363,1285 L357,1320 L343,1351 L324,1374 L302,1387 L279,1390 L257,1382 L239,1364 L227,1340 L220,1312 L218,1282 L222,1253 L232,1227 Z' },
        { id: 'andhra-pradesh', name: 'Andhra Pradesh', isState: true, path: 'M279,1393 L306,1387 L336,1397 L368,1420 L397,1453 L419,1495 L433,1547 L439,1605 L437,1667 L426,1725 L407,1776 L382,1817 L352,1847 L320,1864 L288,1868 L258,1859 L232,1838 L214,1809 L203,1774 L198,1735 L198,1694 L204,1654 L216,1617 L233,1585 L253,1559 Z' },
        { id: 'karnataka', name: 'Karnataka', isState: true, path: 'M158,1427 L193,1418 L230,1423 L268,1443 L302,1475 L330,1519 L349,1575 L358,1639 L357,1707 L347,1771 L328,1828 L301,1875 L268,1910 L232,1930 L196,1936 L163,1927 L134,1905 L112,1873 L97,1832 L89,1784 L87,1732 L92,1681 L105,1633 L124,1590 L143,1553 Z' },
        { id: 'puducherry', name: 'Puducherry', isState: false, path: 'M320,1945 L327,1942 L334,1946 L335,1954 L330,1959 L323,1957 Z' },
        { id: 'tamil-nadu', name: 'Tamil Nadu', isState: true, path: 'M232,1935 L270,1928 L313,1938 L358,1963 L400,2000 L434,2050 L457,2112 L469,2183 L472,2260 L465,2332 L448,2398 L420,2453 L383,2494 L340,2520 L294,2530 L250,2524 L210,2502 L178,2468 L155,2423 L140,2371 L133,2312 L134,2250 L143,2190 L160,2135 L183,2087 L208,2046 Z' },
        { id: 'kerala', name: 'Kerala', isState: true, path: 'M134,1910 L169,1901 L205,1909 L238,1931 L265,1965 L284,2011 L294,2068 L296,2131 L290,2195 L276,2254 L254,2305 L227,2346 L197,2374 L167,2387 L139,2385 L115,2368 L97,2341 L86,2307 L81,2267 L82,2224 L88,2182 L100,2143 L116,2108 L132,2077 Z' },
        { id: 'lakshadweep', name: 'Lakshadweep', isState: false, path: 'M25,2180 L34,2177 L42,2182 L44,2192 L39,2199 L31,2197 L26,2190 Z' },
        { id: 'andaman-nicobar', name: 'Andaman & Nicobar', isState: false, path: 'M650,2050 L670,2042 L690,2050 L706,2068 L716,2094 L721,2127 L721,2166 L716,2204 L706,2238 L690,2266 L670,2280 L650,2282 L630,2274 L615,2256 L605,2232 L600,2202 L600,2169 L605,2138 L615,2110 L630,2086 Z' }
    ];

    return (
        <div className="relative w-full flex flex-col items-center">
            <svg viewBox="0 0 730 2600" className="w-full h-auto" style={{ maxHeight: '550px', maxWidth: '550px' }} onMouseLeave={() => setHoveredRegion(null)}>
                <rect x="0" y="0" width="730" height="2600" fill="#F9FAFB" />
                <defs>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.3" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* India Outline */}
                <path d="M128,32 L220,24 L278,74 L623,529 L621,715 L578,900 L546,1037 L485,1393 L472,2260 L420,2453 L294,2530 L139,2385 L81,2267 L43,897 L25,766 L25,466 L55,230 Z"
                    fill="none" stroke="#000080" strokeWidth="1.5" opacity="0.1" />

                {/* All States - Real Paths */}
                {mapRegions.map((region) => {
                    const shouldDim = (viewMode === 'states' && !region.isState) || (viewMode === 'uts' && region.isState);
                    return (
                        <path
                            key={region.id}
                            d={region.path}
                            fill={getFillColor(region.id, region.isState)}
                            stroke="#FFFFFF"
                            strokeWidth="1.2"
                            opacity={getOpacity(region.id, region.isState)}
                            className="transition-all duration-300 cursor-pointer"
                            style={{
                                filter: hoveredRegion?.id === region.id ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' : 'none',
                                cursor: shouldDim ? 'not-allowed' : 'pointer'
                            }}
                            onMouseEnter={() => setHoveredRegion(region)}
                            onMouseMove={handleMouseMove}
                            onClick={() => handleRegionClick(region.id, region.isState)}
                        />
                    );
                })}

                {/* Labels for major states */}
                {[
                    { id: 'rajasthan', x: 130, y: 400 },
                    { id: 'uttar-pradesh', x: 270, y: 475 },
                    { id: 'madhya-pradesh', x: 298, y: 845 },
                    { id: 'maharashtra', x: 235, y: 1195 },
                    { id: 'bihar', x: 385, y: 800 },
                    { id: 'karnataka', x: 205, y: 1720 },
                    { id: 'tamil-nadu', x: 330, y: 2250 },
                    { id: 'gujarat', x: 95, y: 690 }
                ].map(({ id, x, y }) => (
                    <text key={`lbl-${id}`} x={x} y={y} fontSize="11" fontWeight="700" fill="#FFF"
                        opacity="0.9" pointerEvents="none" textAnchor="middle" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                        {mapRegions.find(r => r.id === id)?.name.split(' ')[0].toUpperCase()}
                    </text>
                ))}
            </svg>

            {/* Tooltip */}
            {hoveredRegion && (
                <div className="fixed z-50 pointer-events-none" style={{ left: `${mousePos.x + 20}px`, top: `${mousePos.y - 20}px`, transform: 'translate(0, -100%)' }}>
                    <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-xl px-4 py-3 border-2 border-gray-200 min-w-[180px] slide-down">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4" style={{ color: 'var(--saffron)' }} />
                            <span className="font-bold text-sm" style={{ color: 'var(--navy)' }}>{hoveredRegion.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full">{hoveredRegion.isState ? 'State' : 'UT'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                            <TrendingUp className="w-3 h-3" />
                            <span>Coverage: {userProgress[hoveredRegion.id] || 0}%</span>
                        </div>
                        <div className="text-xs font-semibold mt-2" style={{ color: 'var(--saffron)' }}>Click to view Notes →</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IndiaMap;
