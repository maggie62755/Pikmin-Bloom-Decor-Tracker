import React from 'react';
import PikminCard from './PikminCard';
import { PIKMIN_COLORS, DECOR_STATUS } from '../constants';
import './DecorGrid.css';

const VariantRow = React.memo(({ variant, category, onCardClick, collectionState }) => (
  <div className="variant-row-container">
    <div className="variant-header">
      <div className="variant-line" />
      <h4 className="variant-title">{variant.name_ch || variant.name}</h4>
    </div>
    <div className="pikmin-grid">
      {PIKMIN_COLORS.map((colorDef) => {
        const isAvailable = variant.colors.includes(colorDef.id);
        const status = collectionState?.[variant.id]?.[colorDef.id] || DECOR_STATUS.NOT_COLLECTED;

        if (!isAvailable) {
          return (
            <div
              key={colorDef.id}
              className="empty-pikmin-slot"
            />
          );
        }

        return (
          <PikminCard
            key={colorDef.id}
            color={colorDef}
            status={status}
            variant={variant}
            category={category}
            onClick={(newStatus) => onCardClick(variant.id, colorDef.id, newStatus)}
          />
        );

      })}
    </div>
  </div>
));

const DecorGrid = React.memo(({ variants, onCardClick, collectionState, category }) => {
  return (
    <div className="decor-grid-container">
      {variants.map((variant) => (
        <VariantRow
          key={variant.id}
          variant={variant}
          category={category}
          onCardClick={onCardClick}
          collectionState={collectionState}
        />
      ))}
    </div>
  );
});

export default DecorGrid;
