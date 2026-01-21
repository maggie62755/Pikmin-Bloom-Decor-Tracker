import React from 'react';
import { Sprout } from 'lucide-react';
import { COLORS } from '../../theme/colors';

const MissingImageFallback = ({ color, compact = false }) => {
    const rawColor = COLORS.pikmin[color.id] || '#A8A29E'; // Default to stone-400

    // Visibility adjustment for light colors
    const contentColorMap = {
        white: '#64748b',  // Slate-500
        yellow: '#ca8a04', // Amber-600
        ice: '#0891b2',    // Cyan-600
        winged: '#db2777', // Pink-600
    };

    const contentColor = contentColorMap[color.id] || rawColor;

    if (compact) {
        return (
            <div
                className="w-full h-full flex flex-col items-center justify-center p-0.5 text-center relative overflow-hidden"
                style={{
                    backgroundColor: `${rawColor}20`,
                    background: `linear-gradient(135deg, ${rawColor}10 0%, ${rawColor}30 100%)`
                }}
            >
                <Sprout
                    size={14}
                    strokeWidth={2.5}
                    className="mb-0.5 z-10 opacity-90"
                    style={{ color: contentColor }}
                />

                <span
                    className="text-[0.55rem] font-bold leading-none z-10 truncate w-full px-0.5 scale-90 origin-center"
                    style={{ color: contentColor }}
                >
                    {color.name_ch || color.name}
                </span>
            </div>
        );
    }

    return (
        <div
            className="w-full h-full flex flex-col items-center justify-center p-1 sm:p-2 text-center relative overflow-hidden group"
            style={{
                backgroundColor: `${rawColor}20`,
                background: `linear-gradient(135deg, ${rawColor}10 0%, ${rawColor}30 100%)`
            }}
        >
            {/* 
               Responsive Icon Size:
               Mobile (small card): 24px
               Desktop (larger card): 32px
            */}
            <Sprout
                className="mb-1 z-10 w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={2}
                style={{ color: contentColor }}
            />

            <span
                className="text-[0.65rem] sm:text-xs font-black tracking-tight z-10 drop-shadow-sm leading-tight"
                style={{ color: contentColor, textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}
            >
                {color.name_ch || color.name}
            </span>

            <span
                className="text-[0.55rem] sm:text-[0.65rem] font-bold uppercase tracking-wider mt-0.5 z-10 opacity-75 hidden sm:block"
                style={{ color: contentColor }}
            >
                No Image
            </span>
        </div>
    );
};

export default MissingImageFallback;
