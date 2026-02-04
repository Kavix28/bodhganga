import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const InteractiveIndiaMap = ({ userProgress = {}, viewMode = 'states' }) => {
    const navigate = useNavigate();
    const [hoveredRegion, setHoveredRegion] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    // State/UT regions with coordinates for clickable areas
    const regions = [
        // Format: [id, name, isState, x%, y%, width%, height%]
        { id: 'jammu-kashmir', name: 'Jammu & Kashmir', isState: false, x: 18, y: 5, w: 8, h: 8 },
        { id: 'ladakh', name: 'Ladakh', isState: false, x: 28, y: 3, w: 10, h: 7 },
        { id: 'punjab', name: 'Punjab', isState: true, x: 16, y: 12, w: 6, h: 6 },
        { id: 'himachal-pradesh', name: 'Himachal Pradesh', isState: true, x: 20, y: 10, w: 7, h: 7 },
        { id: 'uttarakhand', name: 'Uttarakhand', isState: true, x: 25, y: 14, w: 6, h: 6 },
        { id: 'haryana', name: 'Haryana', isState: true, x: 17, y: 18, w: 6, h: 6 },
        { id: 'delhi', name: 'Delhi', isState: false, x: 19, y: 20, w: 2, h: 2 },
        { id: 'rajasthan', name: 'Rajasthan', isState: true, x: 8, y: 22, w: 15, h: 20 },
        { id: 'uttar-pradesh', name: 'Uttar Pradesh', isState: true, x: 23, y: 22, w: 16, h: 14 },
        { id: 'bihar', name: 'Bihar', isState: true, x: 39, y: 28, w: 10, h: 8 },
        { id: 'gujarat', name: 'Gujarat', isState: true, x: 4, y: 35, w: 12, h: 18 },
        { id: 'madhya-pradesh', name: 'Madhya Pradesh', isState: true, x: 18, y: 38, w: 16, h: 14 },
        { id: 'chhattisgarh', name: 'Chhattisgarh', isState: true, x: 32, y: 42, w: 10, h: 12 },
        { id: 'jharkhand', name: 'Jharkhand', isState: true, x: 38, y: 38, w: 8, h: 10 },
        { id: 'west-bengal', name: 'West Bengal', isState: true, x: 42, y: 42, w: 8, h: 16 },
        { id: 'sikkim', name: 'Sikkim', isState: true, x: 46, y: 30, w: 3, h: 3 },
        { id: 'assam', name: 'Assam', isState: true, x: 50, y: 32, w: 12, h: 10 },
        { id: 'arunachal-pradesh', name: 'Arunachal Pradesh', isState: true, x: 54, y: 22, w: 14, h: 12 },
        { id: 'nagaland', name: 'Nagaland', isState: true, x: 62, y: 34, w: 5, h: 5 },
        { id: 'manipur', name: 'Manipur', isState: true, x: 62, y: 40, w: 4, h: 4 },
        { id: 'mizoram', name: 'Mizoram', isState: true, x: 60, y: 45, w: 4, h: 5 },
        { id: 'tripura', name: 'Tripura', isState: true, x: 56, y: 44, w: 4, h: 4 },
        { id: 'meghalaya', name: 'Meghalaya', isState: true, x: 52, y: 38, w: 5, h: 4 },
        { id: 'odisha', name: 'Odisha', isState: true, x: 38, y: 48, w: 10, h: 14 },
        { id: 'maharashtra', name: 'Maharashtra', isState: true, x: 16, y: 52, w: 16, h: 16 },
        { id: 'telangana', name: 'Telangana', isState: true, x: 30, y: 56, w: 8, h: 8 },
        { id: 'andhra-pradesh', name: 'Andhra Pradesh', isState: true, x: 32, y: 64, w: 12, h: 14 },
        { id: 'karnataka', name: 'Karnataka', isState: true, x: 20, y: 68, w: 14, h: 16 },
        { id: 'goa', name: 'Goa', isState: true, x: 18, y: 74, w: 3, h: 3 },
        { id: 'tamil-nadu', name: 'Tamil Nadu', isState: true, x: 28, y: 78, w: 12, h: 14 },
        { id: 'kerala', name: 'Kerala', isState: true, x: 20, y: 84, w: 8, h: 12 },
        { id: 'puducherry', name: 'Puducherry', isState: false, x: 32, y: 86, w: 2, h: 2 },
        { id: 'lakshadweep', name: 'Lakshadweep', isState: false, x: 8, y: 88, w: 3, h: 3 },
        { id: 'andaman-nicobar', name: 'Andaman & Nicobar', isState: false, x: 68, y: 80, w: 6, h: 16 }
    ];

    const getProgress = (regionId) => userProgress[regionId] || { overall: 0, notes: 0, questions: 0, solutions: 0 };

    const getCoverageColor = (progress) => {
        if (progress >= 70) return '#138808';
        if (progress >= 25) return '#FF9933';
        return '#9CA3AF';
    };

    const handleRegionClick = (region) => {
        if ((viewMode === 'states' && !region.isState) || (viewMode === 'uts' && region.isState)) return;
        navigate(region.isState ? `/states/${region.id}` : `/union-territories/${region.id}`);
    };

    const handleMouseMove = (e, region) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setHoveredRegion(region);
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-auto" style={{ maxHeight: '600px' }}>
                {/* Base map - using inline India outline */}
                <path d="M18,8 L38,3 L52,8 L68,22 L72,38 L68,52 L60,68 L48,82 L32,92 L20,92 L12,88 L8,78 L4,62 L6,42 L10,28 Z"
                    fill="#F3F4F6" stroke="#CBD5E1" strokeWidth="0.3" />

                {/* Interactive regions */}
                {regions.map(region => {
                    const progress = getProgress(region.id);
                    const shouldDim = (viewMode === 'states' && !region.isState) || (viewMode === 'uts' && region.isState);

                    return (
                        <rect
                            key={region.id}
                            x={region.x}
                            y={region.y}
                            width={region.w}
                            height={region.h}
                            fill={shouldDim ? '#E5E7EB' : getCoverageColor(progress.overall)}
                            fillOpacity={shouldDim ? 0.3 : (hoveredRegion?.id === region.id ? 0.9 : 0.7)}
                            stroke="#FFFFFF"
                            strokeWidth="0.3"
                            className="cursor-pointer transition-all duration-200"
                            onMouseEnter={(e) => handleMouseMove(e, region)}
                            onMouseMove={(e) => handleMouseMove(e, region)}
                            onMouseLeave={() => setHoveredRegion(null)}
                            onClick={() => handleRegionClick(region)}
                        />
                    );
                })}
            </svg>

            {/* Tooltip */}
            {hoveredRegion && (
                <div className="fixed z-50 pointer-events-none" style={{ left: `${tooltipPos.x + 20}px`, top: `${tooltipPos.y}px` }}>
                    <div className="bg-white rounded-lg shadow-2xl p-4 border-2" style={{ borderColor: '#000080', minWidth: '220px' }}>
                        <h4 className="font-bold text-sm mb-2" style={{ color: '#000080' }}>{hoveredRegion.name}</h4>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span>Notes:</span>
                                <span className="font-semibold">{getProgress(hoveredRegion.id).notes}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Questions:</span>
                                <span className="font-semibold">{getProgress(hoveredRegion.id).questions}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Solutions:</span>
                                <span className="font-semibold">{getProgress(hoveredRegion.id).solutions}%</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                                <span className="font-bold">Overall:</span>
                                <span className="font-bold" style={{ color: '#FF9933' }}>{getProgress(hoveredRegion.id).overall}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InteractiveIndiaMap;
