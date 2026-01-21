import React from 'react';
import { Sprout, Heart, Check, RefreshCw } from 'lucide-react';
import { DECOR_STATUS } from '../constants';
import { COLORS } from '../theme/colors';

import './PikminCard.css';

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

const PikminCard = React.memo(({ color, status, onClick, variant, category }) => {
    // statusColors for the glow effect
    const statusGlow = {
        [DECOR_STATUS.NOT_COLLECTED]: 'transparent',
        [DECOR_STATUS.SEEDLING]: '#fef3c7',     // Amber-100
        [DECOR_STATUS.GROWING]: '#fdf2f8',      // Pink-50
        [DECOR_STATUS.COLLECTED]: '#f0fdf4',    // Green-50
    };

    const imagePath = (category && variant) 
        ? `/src/data/images/decors_images/${category.image_path}/${variant.image_name}_${color.name}.png`
        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";

    const pikminType = color.id;

    return (
        <div 
            onClick={onClick}
            className={`pikmin-card soft-card ${status === DECOR_STATUS.NOT_COLLECTED ? 'not-collected' : ''}`}
            style={{ backgroundColor: statusGlow[status] }}
        >
            <div className="pikmin-card-image-container">
                 <img
                    src={imagePath}
                    alt={`${color.name_ch || pikminType} ${variant.name}`}
                    className="pikmin-card-image"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E";
                        e.target.style.opacity = '0.1';
                    }}
                />
                
                <div className="pikmin-card-status-indicator">
                    <StatusIcon status={status} size={11} />
                </div>
            </div>

            <div className="pikmin-card-label-row">
                <div 
                    className="pikmin-card-color-dot" 
                    style={{ backgroundColor: COLORS.pikmin[pikminType] || '#ccc' }} 
                />
                <span className="pikmin-card-type-text">
                    {color.name_ch || pikminType}
                </span>
            </div>

            <div className="pikmin-card-tooltip">
                {statusLabels[status] || 'Unknown'}
            </div>
        </div>
    );
});


export default PikminCard;
