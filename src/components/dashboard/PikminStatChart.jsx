import React from 'react';
import { BarChart, Bar, Tooltip, ResponsiveContainer, LabelList, XAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';

// Custom hook or helper for consistent randomness based on a string/index
const usePseudoRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

// Organic Flower Bar Shape
const FlowerBar = (props) => {
    const { x, y, width, height, payload, index } = props;

    // Safety check
    if (height === 0) return null;

    // const flowerImage = FLOWER_IMAGES[payload.type] || '/assets/flowers/flower.png';
    const flowerImage = `/assets/flowers/${payload.type}.png`;
    const stemColor = '#8fa876'; // More natural moss green
    const flowerSize = 48; // Slightly larger flowers

    // Deterministic random values for organic variation
    const curveIntensity = 6;
    // Alternate curve direction based on index, with some random variation
    const curveDir = index % 2 === 0 ? 1 : -1;
    const randomOffset = (usePseudoRandom(index) - 0.5) * 6;

    // Coordinates
    const startX = x + width / 2;
    const startY = y + height; // Bottom
    const endX = startX + (curveIntensity * curveDir) + randomOffset;
    const endY = y + 15; // Top (slightly below actual value to leave room for flower center)

    // Control point for the curve (Quadratic Bezier)
    const ctrlX = startX + (curveIntensity * -curveDir); // Curve opposite to the top displacement
    const ctrlY = startY - (height * 0.5);

    const stemPath = `M${startX},${startY} Q${ctrlX},${ctrlY} ${endX},${endY}`;

    // Leaf Logic
    const hasRightLeaf = index % 3 !== 0; // Skip some leaves
    const hasLeftLeaf = index % 3 !== 1;

    // Leaf Path Helper (simple teardrop shape rooted at tx, ty)
    const drawLeaf = (tx, ty, scale, rotation) => {
        return (
            <path
                d={`M0,0 Q15,-10 30,0 Q15,10 0,0`}
                transform={`translate(${tx}, ${ty}) scale(${scale}) rotate(${rotation})`}
                fill={stemColor}
                opacity={0.8}
            />
        );
    };

    // Calculate leaf positions along the curve
    // Approximate midpoint of curve for leaf attachment matches t=0.5 in bezier
    const midT = 0.6; // Slightly lower than middle height
    const leafX = (1 - midT) * (1 - midT) * startX + 2 * (1 - midT) * midT * ctrlX + midT * midT * endX;
    const leafY = (1 - midT) * (1 - midT) * startY + 2 * (1 - midT) * midT * ctrlY + midT * midT * endY;

    return (
        <g>
            <defs>
                <filter id="flower-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1" />
                </filter>
            </defs>

            {/* Stem */}
            <path
                d={stemPath}
                stroke={stemColor}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
            />

            {/* Leaves */}
            {hasRightLeaf && drawLeaf(leafX, leafY, 0.4, -45 + (curveDir * 10))}
            {hasLeftLeaf && drawLeaf(leafX, leafY + 15, 0.3, 135 + (curveDir * 10))}

            {/* Flower Head */}
            <image
                href={flowerImage}
                x={endX - flowerSize / 2}
                y={endY - flowerSize / 2 - 10} // Adjust to sit on top of stem tip
                height={flowerSize}
                width={flowerSize}
                preserveAspectRatio="xMidYMid slice"
                style={{ filter: 'url(#flower-glow)' }}
            />
        </g>
    );
};

const PikminStatChart = ({ data, title, subtitle, height = 250, barSize = 36, transparent = false }) => {
    const hasData = data && data.length > 0 && data.some(item => item.value > 0);

    return (
        <div className={`flex flex-col gap-4 h-full ${transparent ? '' : 'p-6 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-sm border border-stone-100'}`}>
            {title && (
                <div className="mb-2 pl-2">
                    {subtitle && (
                        <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                            {subtitle}
                        </span>
                    )}
                    <h3 className="text-lg font-black text-stone-700 leading-none">
                        {title}
                    </h3>
                </div>
            )}

            <div style={{ width: '100%', height: height }}>
                {hasData ? (
                    <ResponsiveContainer>
                        <BarChart data={data} margin={{ top: 30, right: 0, left: 0, bottom: 20 }}>
                            <Tooltip
                                content={<ChartTooltip />}
                                cursor={{ fill: 'rgba(255,255,255,0.2)' }}
                                wrapperStyle={{ outline: 'none' }}
                            />

                            {/* Hidden XAxis because we use custom labels, but sometimes useful for alignment */}
                            <XAxis dataKey="name" hide />

                            <Bar
                                dataKey="value"
                                barSize={barSize}
                                shape={<FlowerBar />}
                                animationDuration={1500}
                                animationBegin={200}
                            >
                                {/* 數值標籤 (Bar 上方 - 調整位置，避開花朵) */}
                                <LabelList
                                    dataKey="value"
                                    position="top"
                                    offset={25}
                                    style={{
                                        fill: '#78716c',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        fontFamily: 'monospace'
                                    }}
                                />

                                {/* 類別標籤 (Bar 下方) */}
                                <LabelList
                                    dataKey="name"
                                    position="bottom"
                                    offset={10}
                                    style={{
                                        fill: '#a8a29e',
                                        fontSize: '10px',
                                        fontWeight: '600'
                                    }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 gap-2">
                        <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center">
                            <span className="text-2xl">🍃</span>
                        </div>
                        <span className="font-medium text-sm">目前沒有相關統計資料</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PikminStatChart;