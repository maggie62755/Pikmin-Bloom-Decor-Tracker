import React, { useState, useRef, useCallback } from 'react';
import { DECOR_STATUS, DECOR_STATUS_LABELS, DECOR_STATUS_KEYS } from '../constants';
import { COLORS } from '../theme/colors';
import { useTranslation, getLocalizedName } from '../i18n';
import './PikminCard.css';
import MissingImageFallback from './shared/MissingImageFallback';
import StatusIcon from './shared/StatusIcon';
import ContextMenu from './shared/ContextMenu';
import SmartImage from './shared/SmartImage';

const PikminCard = React.memo(({ color, status, onClick, variant, category }) => {
    const { t, language } = useTranslation();
    const [imgError, setImgError] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [animClass, setAnimClass] = useState('');

    // Long Press Refs
    const timerRef = useRef(null);
    const isLongPress = useRef(false);

    // Determines CSS class (handled entirely by PikminCard.css in Sticker theme)
    const statusClass = {
        [DECOR_STATUS.NOT_COLLECTED]: '',
        [DECOR_STATUS.SEEDLING]: '',
        [DECOR_STATUS.GROWING]: '',
        [DECOR_STATUS.COLLECTED]: '',
    };

    const imagePath = (category && variant)
        ? `${import.meta.env.BASE_URL}images/decors_images/${category.image_path}/${variant.image_name}_${color.id.charAt(0).toUpperCase() + color.id.slice(1)}.png`
        : null;

    const pikminType = color.id;

    // Reset error on image change
    React.useEffect(() => {
        setImgError(false);
    }, [imagePath]);

    // -- Signature Animation Trigger --
    const triggerAnimation = useCallback((newStatus) => {
        if (newStatus === DECOR_STATUS.COLLECTED) {
            setAnimClass('just-collected');
        } else if (newStatus === DECOR_STATUS.NOT_COLLECTED) {
            setAnimClass('just-uncollected');
        } else {
            setAnimClass('just-changed');
        }
        // Clear after animation
        const timer = setTimeout(() => setAnimClass(''), 400);
        return () => clearTimeout(timer);
    }, []);

    // -- Interaction Handlers --

    // 1. Toggle Logic (Left Click / Tap)
    // Only toggles between NOT_COLLECTED (0) and COLLECTED (3)
    // Or if currently 1 or 2, finishes to COLLECTED (3)
    const handleToggle = () => {
        if (showMenu) return; // Don't toggle if menu is open

        let newStatus = DECOR_STATUS.COLLECTED;
        if (status === DECOR_STATUS.COLLECTED) {
            newStatus = DECOR_STATUS.NOT_COLLECTED;
        }
        triggerAnimation(newStatus);
        onClick(newStatus);
    };

    // 2. Right Click (Desktop)
    const handleContextMenu = (e) => {
        e.preventDefault();
        setShowMenu(true);
    };

    // 3. Long Press (Mobile)
    const handleTouchStart = () => {
        isLongPress.current = false;
        timerRef.current = setTimeout(() => {
            isLongPress.current = true;
            setShowMenu(true);
            // Optional: Vibrate if supported
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500); // 500ms long press
    };

    const handleTouchEnd = (e) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        // If it was a long press, prevent the default click
        if (isLongPress.current && e.cancelable) {
            e.preventDefault();
        }
    };

    const handleMenuSelect = (selectedStatus) => {
        triggerAnimation(selectedStatus);
        onClick(selectedStatus);
        setShowMenu(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
        }
        if (e.key === 'ContextMenu') {
            e.preventDefault();
            setShowMenu(true);
        }
    };

    const statusKey = DECOR_STATUS_KEYS[status] || 'not_collected';
    const statusLabel = t(`status.${statusKey}`);
    const colorName = t(`colors.${pikminType}`) || getLocalizedName(color, language) || pikminType;
    const variantName = variant ? getLocalizedName(variant, language) : '';

    return (
        <div
            className={`pikmin-card status-${Object.keys(DECOR_STATUS).find(key => DECOR_STATUS[key] === status).toLowerCase().replace('_', '-')} ${status === DECOR_STATUS.NOT_COLLECTED ? 'not-collected' : ''} ${statusClass[status] || ''} ${animClass}`}
            onClick={handleToggle}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={showMenu}
            aria-label={`${variantName} ${colorName}，${statusLabel}`}
        >
            <div className="pikmin-card-image-container">
                {!imgError && imagePath ? (
                    <SmartImage
                        src={imagePath}
                        alt={`${colorName} ${variantName}`}
                        className="pikmin-card-image"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <MissingImageFallback color={color} />
                )}

                <div className="pikmin-card-status-indicator">
                    <StatusIcon status={status} size={12} />
                </div>
            </div>

            <div className="pikmin-card-label-row">
                <div
                    className="pikmin-card-color-dot"
                    style={{ backgroundColor: COLORS.pikmin[pikminType] || '#ccc' }}
                />
                <span className="pikmin-card-type-text">
                    {colorName}
                </span>
            </div>

            {/* Tooltip (Only show if menu is NOT open) */}
            {!showMenu && (
                <div className="pikmin-card-tooltip">
                    {statusLabel}
                </div>
            )}

            {/* Context Menu Overlay */}
            {showMenu && (
                <ContextMenu
                    onClose={() => setShowMenu(false)}
                    onSelect={handleMenuSelect}
                    currentStatus={status}
                />
            )}
        </div>
    );
});

export default PikminCard;
