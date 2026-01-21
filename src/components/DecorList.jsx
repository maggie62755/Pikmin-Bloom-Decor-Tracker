import React, { useState, useRef } from 'react';
import { PIKMIN_COLORS, DECOR_STATUS } from '../constants';
import { COLORS } from '../theme/colors';

import './DecorList.css';
import MissingImageFallback from './shared/MissingImageFallback';
import StatusIcon from './shared/StatusIcon';
import ContextMenu from './shared/ContextMenu';

const MiniCard = React.memo(({ status, imagePath, color, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Long Press Refs
  const timerRef = useRef(null);
  const isLongPress = useRef(false);

  // Reset error if image path changes
  React.useEffect(() => {
    setImgError(false);
  }, [imagePath]);

  // -- Interaction Handlers --

  // 1. Toggle Logic (Left Click / Tap)
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
    <>
      <button
        onClick={handleToggle}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`mini-card ${status === DECOR_STATUS.NOT_COLLECTED ? 'not-collected' : 'collected'}`}
      >
        {!imgError && imagePath ? (
          <img
            src={imagePath}
            alt={color.name_ch || color.name}
            className="mini-card-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <MissingImageFallback color={color} compact />
        )}

        <div className="mini-card-status-indicator">
          <StatusIcon status={status} size={10} variant="minimal" />
        </div>
      </button>

      {/* Context Menu Overlay */}
      {showMenu && (
        <ContextMenu
          onClose={() => setShowMenu(false)}
          onSelect={handleMenuSelect}
          currentStatus={status}
        />
      )}
    </>
  );
});

const DecorRow = React.memo(({ variant, category, collection, onCardClick }) => (
  <tr className="group">
    <td className="decor-list-td-main">
      <div className="decor-list-variant-name">{variant.name_ch || variant.name}</div>
      <div className="decor-list-category-name hidden sm:block">{category.name_ch || category.name}</div>
    </td>
    {PIKMIN_COLORS.map(colorDef => {
      const isAvailable = variant.colors.includes(colorDef.id);
      const status = collection[variant.id]?.[colorDef.id] || DECOR_STATUS.NOT_COLLECTED;
      const imagePath = `/src/data/images/decors_images/${category.image_path}/${variant.image_name}_${colorDef.name}.png`;

      return (
        <td key={colorDef.id} className="decor-list-td-card">
          {isAvailable ? (
            <MiniCard
              status={status}
              imagePath={imagePath}
              color={colorDef}
              onClick={(newStatus) => onCardClick(variant.id, colorDef.id, newStatus)}
            />
          ) : (
            <div className="decor-list-unavailable-dot" />
          )}
        </td>
      );
    })}
  </tr>
));

const DecorList = ({ categories, collection, onCardClick }) => {
  return (
    <div className="decor-list-container">
      <div className="decor-list-scroll custom-scrollbar">
        <table className="decor-list-table">
          <thead className="decor-list-thead">
            <tr>
              <th className="decor-list-th-main">
                裝飾種類
              </th>
              {PIKMIN_COLORS.map(color => (
                <th key={color.id} className="decor-list-th-color">
                  <div
                    className="decor-list-color-indicator"
                    style={{ backgroundColor: color.hex }}
                    title={color.name_ch || color.name}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="decor-list-tbody">
            {categories.map(category => (
              <React.Fragment key={category.id}>
                {category.variants.map(variant => (
                  <DecorRow
                    key={variant.id}
                    variant={variant}
                    category={category}
                    collection={collection}
                    onCardClick={onCardClick}
                  />
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DecorList;
