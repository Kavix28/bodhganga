import React from 'react';

/**
 * Indian Flag Component
 * Displays the Indian tricolor flag with Ashoka Chakra
 * Sizes: sm, md, lg, xl
 */

const IndianFlag = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: { width: 40, height: 30, chakra: 8, spokes: 12 },
        md: { width: 60, height: 45, chakra: 12, spokes: 16 },
        lg: { width: 80, height: 60, chakra: 16, spokes: 20 },
        xl: { width: 120, height: 90, chakra: 24, spokes: 24 }
    };

    const { width, height, chakra, spokes } = sizes[size] || sizes.md;
    const chakraRadius = chakra;
    const innerRadius = chakra * 0.6;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className={`inline-block ${className}`}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        >
            {/* Saffron Band */}
            <rect x="0" y="0" width={width} height={height / 3} fill="#FF9933" />

            {/* White Band */}
            <rect x="0" y={height / 3} width={width} height={height / 3} fill="#FFFFFF" />

            {/* Green Band */}
            <rect x="0" y={(height / 3) * 2} width={width} height={height / 3} fill="#138808" />

            {/* Ashoka Chakra */}
            <g transform={`translate(${width / 2}, ${height / 2})`}>
                {/* Outer circle */}
                <circle
                    cx="0"
                    cy="0"
                    r={chakraRadius}
                    fill="none"
                    stroke="#000080"
                    strokeWidth="1"
                />

                {/* Inner circle */}
                <circle
                    cx="0"
                    cy="0"
                    r={innerRadius}
                    fill="none"
                    stroke="#000080"
                    strokeWidth="0.5"
                />

                {/* 24 Spokes */}
                {[...Array(spokes)].map((_, i) => {
                    const angle = (i * 360) / spokes;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = Math.cos(rad) * innerRadius;
                    const y1 = Math.sin(rad) * innerRadius;
                    const x2 = Math.cos(rad) * chakraRadius;
                    const y2 = Math.sin(rad) * chakraRadius;

                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#000080"
                            strokeWidth="0.8"
                        />
                    );
                })}

                {/* Center dot */}
                <circle
                    cx="0"
                    cy="0"
                    r="1.5"
                    fill="#000080"
                />
            </g>

            {/* Border */}
            <rect
                x="0"
                y="0"
                width={width}
                height={height}
                fill="none"
                stroke="#000000"
                strokeWidth="0.5"
                opacity="0.2"
            />
        </svg>
    );
};

export default IndianFlag;
