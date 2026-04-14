import React from 'react';
import PikminCard from './PikminCard';
import { PIKMIN_COLORS, DECOR_STATUS } from '../constants';
import './DecorGrid.css';

const VariantRow = React.memo(({ variant, category, onCardClick, variantState }) => {
  const getBaseColorId = (id) => {
    const base = PIKMIN_COLORS.find(pc =>
      id === pc.id || id.startsWith(pc.id) && /^\d+$/.test(id.replace(pc.id, ''))
    );
    return base ? base.id : id;
  };

  const baseColorIds = variant.colors.map(getBaseColorId);
  const isSequential = new Set(baseColorIds).size !== baseColorIds.length;

  return (
    <div className="variant-row-container">
      <div className="variant-header">
        <div className="variant-line" />
        <h4 className="variant-title">{variant.name_ch || variant.name}</h4>
      </div>
      <div className="pikmin-grid">
        {PIKMIN_COLORS.map((colorDef, index) => {
          let itemToRender = null;

          if (isSequential) {
            const colorId = variant.colors[index];
            if (colorId) {
              const itemBaseId = getBaseColorId(colorId);
              const itemBaseDef = PIKMIN_COLORS.find(c => c.id === itemBaseId) || colorDef;
              itemToRender = { colorId, baseDef: itemBaseDef };
            }
          } else {
            const colorId = variant.colors.find(id => getBaseColorId(id) === colorDef.id);
            if (colorId) {
              itemToRender = { colorId, baseDef: colorDef };
            }
          }

          if (!itemToRender) {
            return (
              <div
                key={colorDef.id}
                className="empty-pikmin-slot"
              />
            );
          }

          return (
            <PikminCard
              key={itemToRender.colorId}
              color={{ ...itemToRender.baseDef, id: itemToRender.colorId }}
              status={variantState?.[itemToRender.colorId] || DECOR_STATUS.NOT_COLLECTED}
              variant={variant}
              category={category}
              onClick={(newStatus) => onCardClick(variant.id, itemToRender.colorId, newStatus)}
            />
          );
        })}
      </div>
    </div>
  );
});

const DecorGrid = React.memo(({ variants, onCardClick, collectionState, category }) => {
  return (
    <div className="decor-grid-container">
      {variants.map((variant) => (
        <VariantRow
          key={variant.id}
          variant={variant}
          category={category}
          onCardClick={onCardClick}
          variantState={collectionState?.[variant.id]}
        />
      ))}
    </div>
  );
});

export default DecorGrid;
