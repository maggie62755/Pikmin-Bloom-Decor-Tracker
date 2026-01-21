import React from 'react';
import { BarChart, Bar, Cell, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

/**
 * @param {Array} data - 資料陣列，例如 [{ name: '紅', value: 10, fill: '#FF0000' }]
 * @param {string} title - 圖表標題
 * @param {number} height - 圖表高度
 * @param {string} barSize - 柱狀條寬度
 */

const PikminStatChart = ({ data, title, height = 250, barSize = 36 }) => {
    const hasData = data && data.length > 0 && data.some(item => item.value > 0);

    return (
        <div className="flex flex-col gap-4 p-6 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-sm border border-stone-100 h-full">
            {title && (
                <h3 className="text-lg font-bold text-stone-700 px-2 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-400 rounded-full" /> {title}
                </h3>
            )}

            <div style={{ width: '100%', height: height }}>
                {hasData ? (
                    <ResponsiveContainer>
                        <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 20 }}>
                            <defs>
                                <filter id="shadow" height="130%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.05)" />
                                </filter>
                            </defs>

                            <Bar
                                dataKey="value"
                                radius={[12, 12, 12, 12]}
                                barSize={barSize}
                                animationDuration={1000}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.fill}
                                        style={{ filter: 'url(#shadow)' }}
                                    />
                                ))}

                                {/* 數值標籤 (Bar 上方) */}
                                <LabelList
                                    dataKey="value"
                                    position="top"
                                    offset={10}
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