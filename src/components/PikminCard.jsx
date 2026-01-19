import React from 'react';
import { Sprout, Heart, Check, RefreshCw } from 'lucide-react';
import { DECOR_STATUS } from '../constants';
import { COLORS } from '../theme/colors';

const StatusIcon = ({ status, size }) => {
    switch (status) {
        case DECOR_STATUS.SEEDLING: return <Sprout size={size} className="text-amber-600" />;
        case DECOR_STATUS.GROWING: return <Heart size={size} className="text-pink-500 animate-pulse" />;
        case DECOR_STATUS.COLLECTED: return <Check size={size} className="text-brand-primary font-black" />;
        default: return null;
    }
};

const statusLabels = {
    [DECOR_STATUS.NOT_COLLECTED]: '未收藏',
    [DECOR_STATUS.SEEDLING]: '大苗',
    [DECOR_STATUS.GROWING]: '成長中',
    [DECOR_STATUS.COLLECTED]: '已獲得',
};

const PikminCard = React.memo(({ color, status, onClick, name, type, categoryId, decorName }) => {
    // statusColors for the glow effect (Subtle & Balanced)
    const statusGlow = {
        [DECOR_STATUS.NOT_COLLECTED]: 'transparent',
        [DECOR_STATUS.SEEDLING]: '#fef3c7',     // Amber-100 (Warm seedling)
        [DECOR_STATUS.GROWING]: '#fdf2f8',      // Pink-50
        [DECOR_STATUS.COLLECTED]: '#f0fdf4',    // Green-50
    };

    // Construct image path logic
    const imagePath = categoryId 
        ? `/images/decors_images/${categoryId}/${color.id}.png`
        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";

    const pikminType = color.id; // e.g., 'red', 'yellow'

    return (
        <div 
            onClick={onClick}
            className={`
                soft-card relative p-2 sm:p-3 flex flex-col items-center gap-2 group cursor-pointer
                ${status === DECOR_STATUS.NOT_COLLECTED ? 'opacity-30 grayscale hover:opacity-100' : 'opacity-100'}
                hover:shadow-lg hover:shadow-stone-200/50 hover:translate-y-[-2px]
            `}
            style={{ backgroundColor: statusGlow[status] }}
        >
            {/* Decor Icon Container */}
            <div className="relative w-full aspect-square bg-white/40 rounded-2xl flex items-center justify-center p-1 sm:p-2 mb-1 group-hover:scale-105 transition-transform duration-500">
                 <img
                    src={imagePath}
                    alt={`${pikminType} ${name}`}
                    className="w-full h-full object-contain drop-shadow-md"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E";
                        e.target.style.opacity = '0.1';
                    }}
                />
                
                {/* Secondary Indicator Icon */}
                <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm border border-stone-100">
                    <StatusIcon status={status} size={11} />
                </div>
            </div>

            {/* Type Indicator */}
            <div className="flex items-center gap-1.5 min-w-0">
                <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] border border-black/5" 
                    style={{ backgroundColor: COLORS.pikmin[pikminType] || '#ccc' }} 
                />
                <span className="text-[10px] font-black text-stone-900/40 uppercase tracking-tighter truncate">
                    {pikminType}
                </span>
            </div>


            {/* Status Tooltip/Label */}
            <div className="absolute -bottom-2 px-2.5 py-1 bg-stone-800 text-white text-[9px] font-black rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 pointer-events-none shadow-md">
                {statusLabels[status] || 'Unknown'}
            </div>
        </div>
    );
});

export default PikminCard;
