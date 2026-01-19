import React from 'react';
import PikminCard from './PikminCard';

const DecorGrid = ({ variants, onCardClick, collectionState }) => {
  return (
    <div className="flex flex-col gap-6">
      {variants.map((variant) => (
        <div key={variant.id} className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{variant.name}</h4>
          <div className="grid grid-cols-7 gap-3 sm:gap-4 place-items-center">
            {variant.colors.map((colorKey) => {
              // Find color definition (assuming passed or imported, but here passed via props likely won't work well without import)
              // Better to import PIKMIN_COLORS in parent and pass the actual color object, OR import here.
              // Let's import here for simplicity or assume parent passes enriched data.
              // Re-importing constants here to map color key to object 
              // But 'variant.colors' is just an array of strings ['red', 'blue'...]
              
              // We need the color definition.
              // Let's pass the helper function or color map from parent.
              // For now, I will assume the parent passes a look-up function or I import constants.
              return null; // Placeholder, will fix in next thought or component
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
// Re-writing to be self-sufficient
import { PIKMIN_COLORS } from '../constants';

const DecorGridSelf = ({ variants, onCardClick, collectionState }) => {
  const getColor = (key) => PIKMIN_COLORS.find(c => c.id === key) || { id: key, name: key, bg: 'bg-gray-400' };

  return (
    <div className="flex flex-col gap-6">
      {variants.map((variant) => (
        <div key={variant.id} className="flex flex-col gap-2">
           <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">{variant.name}</h4>
           <div className="grid grid-cols-7 gap-2 sm:gap-3">
             {variant.colors.map((colorKey) => {
               const colorDef = getColor(colorKey);
               // collectionState structure: { [variantId]: { [colorId]: status } }
               const status = collectionState?.[variant.id]?.[colorKey] || 0;
               
               return (
                 <PikminCard 
                   key={colorKey}
                   color={colorDef}
                   status={status}
                   name={variant.name}
                   onClick={() => onCardClick(variant.id, colorKey)}
                 />
               );
             })}
           </div>
        </div>
      ))}
    </div>
  );
};

export default DecorGridSelf;
