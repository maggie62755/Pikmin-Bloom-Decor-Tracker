import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Check } from 'lucide-react';
import { DECOR_STATUS, DECOR_STATUS_KEYS } from '../../constants';
import { useTranslation } from '../../i18n';
import StatusIcon from './StatusIcon';

const ContextMenu = ({ onClose, onSelect, currentStatus }) => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    // Trigger animation on mount
    useEffect(() => {
        setIsVisible(true);
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200);
    };

    const handleSelect = (status) => {
        setIsVisible(false);
        setTimeout(() => onSelect(status), 200);
    };

    const menuItems = [
        DECOR_STATUS.NOT_COLLECTED,
        DECOR_STATUS.SEEDLING,
        DECOR_STATUS.GROWING,
        DECOR_STATUS.COLLECTED,
    ];

    const content = (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center isolate">
            {/* Backdrop with Blur */}
            <div
                className={`absolute inset-0 bg-journal-ink/20 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
            />

            {/* Menu Card */}
            <div
                className={`
                    relative w-full max-w-xs mb-4 sm:mb-0
                    bg-journal-paper/90 backdrop-blur-2xl 
                    rounded-3xl shadow-[0_8px_32px_rgba(45,58,40,0.12)] 
                    border border-white/60 
                    p-3 
                    transform transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                    ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8 sm:translate-y-4'}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 mb-2">
                    <span className="text-xs font-display font-bold text-journal-muted uppercase tracking-widest pl-1">
                        {t('context_menu.title')}
                    </span>
                    <button
                        onClick={handleClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-journal-surface hover:bg-journal-line/50 text-journal-muted transition-colors"
                    >
                        <X size={14} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex flex-col gap-1.5">
                    {menuItems.map(status => {
                        const isActive = currentStatus === status;
                        return (
                            <button
                                key={status}
                                onClick={() => handleSelect(status)}
                                className={`
                                    group relative flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200
                                    ${isActive
                                        ? 'bg-white shadow-[0_2px_8px_rgba(45,58,40,0.08)] ring-1 ring-journal-ink/5'
                                        : 'hover:bg-white/50 hover:shadow-sm border border-transparent hover:border-white/40'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-8 h-8 flex items-center justify-center rounded-full transition-transform duration-300
                                        ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                                    `}>
                                        <StatusIcon status={status} size={20} variant="minimal" />
                                    </div>
                                    <span className={`
                                        text-sm font-bold tracking-wide
                                        ${isActive ? 'text-journal-ink' : 'text-journal-muted group-hover:text-journal-ink'}
                                    `}>
                                        {t(`status.${DECOR_STATUS_KEYS[status]}`)}
                                    </span>
                                </div>

                                {isActive && (
                                    <div className="text-brand-primary animate-[scale-in_0.2s_ease-out]">
                                        <Check size={18} strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(content, document.body);
};

export default ContextMenu;
