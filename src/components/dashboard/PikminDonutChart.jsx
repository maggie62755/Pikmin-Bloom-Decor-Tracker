import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

/**
 * @param {Array} data - 格式: [{ name: '已收藏', value: 10, color: '#15803d' }, ...]
 * @param {string} title - 圖表標題
 * @param {string} centerLabel - 中心數字下方的文字 (預設為 Progress)
 */

const PikminDonutChart = ({ data, title, centerLabel = "Progress", transparent = false }) => {
    // 計算總數與已收藏百分比
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const collectedItem = data.find(d => d.name === '飾品獲得' || d.name === '已收藏' || d.name === 'Collected');
    const percentage = total > 0 ? Math.round(((collectedItem?.value || 0) / total) * 100) : 0;

    // Inject totalValue into data for tooltip
    const chartData = data.map(item => ({ ...item, totalValue: total }));

    return (
        <div className={`flex flex-col h-full min-h-[350px] ${transparent ? '' : 'chart-panel bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 shadow-sm border border-stone-100'}`}>
            {title && (
                <h3 className="text-lg font-bold text-stone-700 px-2 flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-6 bg-pink-400 rounded-full" /> {title}
                </h3>
            )}

            <div className="flex-1 relative">
                {/* 中心文字標籤 */}
                <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="flex flex-col items-center">
                        <span className="text-4xl font-black text-stone-700 tabular-nums">
                            {percentage}%
                        </span>
                        <span className="text-[10px] font-bold text-stone-400 tracking-[0.2em] uppercase mt-1">
                            {centerLabel}
                        </span>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius="70%"
                            outerRadius="90%"
                            paddingAngle={1}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={10}
                            animationDuration={1000}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    className="hover:opacity-80 transition-all cursor-pointer"
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PikminDonutChart;