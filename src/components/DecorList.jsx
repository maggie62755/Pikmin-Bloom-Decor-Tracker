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
        <div className="mini-card-img-container">
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
        </div>

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

const DecorRow = React.memo(({ variant, category, collection, onCardClick }) => {
  const getBaseColorId = (id) => {
    const base = PIKMIN_COLORS.find(pc =>
      id === pc.id || id.startsWith(pc.id) && /^\d+$/.test(id.replace(pc.id, ''))
    );
    return base ? base.id : id;
  };

  // Determine if we need sequential layout (any duplicate base colors or numeric suffixes)
  const baseColorIds = variant.colors.map(getBaseColorId);
  const isSequential = new Set(baseColorIds).size !== baseColorIds.length;

  return (
    <tr className="group">
      <td className="decor-list-td-main" title={variant.name_ch || variant.name}>
        <div className="flex items-center justify-center sm:justify-start gap-0 sm:gap-3">
          {category.icon && (
            <div
              className="category-icon w-6 h-6 flex-shrink-0 opacity-80"
              style={{
                WebkitMaskImage: `url(/src/data/images/icons/${category.icon})`,
                maskImage: `url(/src/data/images/icons/${category.icon})`
              }}
            />
          )}
          <div className="flex flex-col hidden sm:flex">
            <div className="decor-list-variant-name leading-tight">{variant.name_ch || variant.name}</div>
            <div className="decor-list-category-name hidden sm:block text-xs opacity-50">{category.name_ch || category.name}</div>
          </div>
        </div>
      </td>
      {PIKMIN_COLORS.map((colorDef, index) => {
        let itemToRender = null;

        if (isSequential) {
          // Sequential mode: fill columns by index
          const colorId = variant.colors[index];
          if (colorId) {
            const itemBaseId = getBaseColorId(colorId);
            const itemBaseDef = PIKMIN_COLORS.find(c => c.id === itemBaseId) || colorDef;
            itemToRender = { colorId, baseDef: itemBaseDef };
          }
        } else {
          // Strict mode: align by base color
          const colorId = variant.colors.find(id => getBaseColorId(id) === colorDef.id);
          if (colorId) {
            itemToRender = { colorId, baseDef: colorDef };
          }
        }

        return (
          <td key={colorDef.id} className="decor-list-td-card">
            {itemToRender ? (
              <MiniCard
                status={collection[variant.id]?.[itemToRender.colorId] || DECOR_STATUS.NOT_COLLECTED}
                imagePath={`/src/data/images/decors_images/${category.image_path}/${variant.image_name}_${itemToRender.colorId.charAt(0).toUpperCase() + itemToRender.colorId.slice(1)}.png`}
                color={{ ...itemToRender.baseDef, id: itemToRender.colorId }}
                onClick={(newStatus) => onCardClick(variant.id, itemToRender.colorId, newStatus)}
              />
            ) : (
              <div className="decor-list-unavailable-dot" />
            )}
          </td>
        );
      })}
    </tr>
  );
});

const DecorList = ({ categories, collection, onCardClick }) => {
  return (
    <div className="decor-list-container">
      <div className="decor-list-scroll custom-scrollbar">
        <table className="decor-list-table">
          <thead className="decor-list-thead">
            <tr>
              <th className="decor-list-th-main">
                <span className="hidden sm:inline">裝飾種類</span>
                <span className="sm:hidden">飾品</span>
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
