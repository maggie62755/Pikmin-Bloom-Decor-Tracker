import React from 'react';

const ChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const color = data.fill || data.color || '#666';

        return (
            <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-3 rounded-xl shadow-xl animate-[scale-in_0.1s_ease-out]">
                <div className="flex items-center gap-2 mb-1">
                    <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: color }}
                    />
                    <p className="text-sm font-black text-stone-700">{data.name}</p>
                </div>
                <div className="flex items-baseline gap-1 pl-5">
                    <span className="text-xl font-bold text-stone-800 tabular-nums">
                        {data.value}
                    </span>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                        Items
                    </span>
                </div>
                {/* Optional Percentage if available */}
                {data.totalValue && (
                    <div className="pl-5 text-xs font-bold text-stone-400 mt-0.5">
                        {Math.round((data.value / data.totalValue) * 100)}%
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export default ChartTooltip;
