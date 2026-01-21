import React, { useState, useRef } from 'react';
import { DECOR_STATUS, DECOR_STATUS_LABELS } from '../constants';
import { COLORS } from '../theme/colors';
import './PikminCard.css';
import MissingImageFallback from './shared/MissingImageFallback';
import StatusIcon from './shared/StatusIcon';
import ContextMenu from './shared/ContextMenu';

const PikminCard = React.memo(({ color, status, onClick, variant, category }) => {
    const [imgError, setImgError] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Long Press Refs
    const timerRef = useRef(null);
    const isLongPress = useRef(false);

    // Determines CSS class
    const statusClass = {
        [DECOR_STATUS.NOT_COLLECTED]: '',
        [DECOR_STATUS.SEEDLING]: 'ring-1 ring-amber-200 bg-amber-50/30',
        [DECOR_STATUS.GROWING]: 'ring-1 ring-pink-200 bg-pink-50/30',
        [DECOR_STATUS.COLLECTED]: 'ring-1 ring-brand-primary/20 bg-brand-primary/5',
    };

    const imagePath = (category && variant)
        ? `/src/data/images/decors_images/${category.image_path}/${variant.image_name}_${color.name}.png`
        : null;

    const pikminType = color.id;

    // Reset error on image change
    React.useEffect(() => {
        setImgError(false);
    }, [imagePath]);

    // -- Interaction Handlers --

    // 1. Toggle Logic (Left Click / Tap)
    // Only toggles between NOT_COLLECTED (0) and COLLECTED (3)
    // Or if currently 1 or 2, finishes to COLLECTED (3)
    const handleToggle = (e) => {
        if (showMenu) return; // Don't toggle if menu is open

        let newStatus = DECOR_STATUS.COLLECTED;
        if (status === DECOR_STATUS.COLLECTED) {
            newStatus = DECOR_STATUS.NOT_COLLECTED;
        }
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
        onClick(selectedStatus);
        setShowMenu(false);
    };

    return (
        <div
            className={`pikmin-card soft-card ${status === DECOR_STATUS.NOT_COLLECTED ? 'not-collected' : ''} ${statusClass[status] || ''}`}
            onClick={handleToggle}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="pikmin-card-image-container">
                {!imgError && imagePath ? (
                    <img
                        src={imagePath}
                        alt={`${color.name_ch || pikminType} ${variant.name}`}
                        className="pikmin-card-image"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <MissingImageFallback color={color} />
                )}

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

            {/* Tooltip (Only show if menu is NOT open) */}
            {!showMenu && (
                <div className="pikmin-card-tooltip">
                    {DECOR_STATUS_LABELS[status] || 'Unknown'}
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
