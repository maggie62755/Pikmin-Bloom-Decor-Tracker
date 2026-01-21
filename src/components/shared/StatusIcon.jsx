import React from 'react';
import { Sprout, Heart, Check } from 'lucide-react';
import { DECOR_STATUS } from '../../constants';

const StatusIcon = ({ status, size = 16, variant = 'full' }) => {
    // Minimal variant (used in lists)
    if (variant === 'minimal') {
        switch (status) {
            case DECOR_STATUS.SEEDLING:
                return <Sprout size={size} className="text-amber-500" />;
            case DECOR_STATUS.GROWING:
                return <Heart size={size} className="text-pink-500 fill-pink-500/20" />;
            case DECOR_STATUS.COLLECTED:
                return <Check size={size} className="text-brand-primary" strokeWidth={3} />;
            default: return null;
        }
    }

    // Full variant (used in cards/grid)
    switch (status) {
        case DECOR_STATUS.SEEDLING:
            return (
                <div className="flex items-center justify-center w-full h-full bg-amber-100 rounded-full text-amber-600 shadow-sm border border-amber-200">
                    <Sprout size={size * 1.2} strokeWidth={2.5} />
                </div>
            );
        case DECOR_STATUS.GROWING:
            return (
                <div className="flex items-center justify-center w-full h-full bg-pink-100 rounded-full text-pink-500 shadow-sm border border-pink-200 animate-[pulse_2s_infinite]">
                    <Heart size={size * 1.2} fill="currentColor" className="opacity-80" />
                </div>
            );
        case DECOR_STATUS.COLLECTED:
            return (
                <div className="flex items-center justify-center w-full h-full bg-brand-primary rounded-full text-white shadow-sm ring-2 ring-white">
                    <Check size={size * 1.4} strokeWidth={4} />
                </div>
            );
        default: return null;
    }
};

export default StatusIcon;
