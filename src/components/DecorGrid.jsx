import React from 'react';
import PikminCard from './PikminCard';
import { PIKMIN_COLORS, DECOR_STATUS } from '../constants';

const VariantRow = React.memo(({ variant, categoryId, onCardClick, collectionState }) => (
    <div className="flex flex-col gap-4">
       <div className="flex items-center gap-3 ml-1">
            <div className="h-6 w-1 bg-brand-primary/40 rounded-full" />
            <h4 className="text-sm font-black text-stone-900/40 uppercase tracking-widest">{variant.name}</h4>
       </div>
       <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-4">
         {PIKMIN_COLORS.map((colorDef) => {
           const isAvailable = variant.colors.includes(colorDef.id);
           const status = collectionState?.[variant.id]?.[colorDef.id] || DECOR_STATUS.NOT_COLLECTED;
           
           if (!isAvailable) {
             return (
               <div 
                 key={colorDef.id} 
                 className="w-full aspect-square rounded-2xl border-2 border-dashed border-stone-100 bg-stone-50/50 opacity-30"
               />
             );
           }

           return (
             <PikminCard 
               key={colorDef.id}
               color={colorDef}
               status={status}
               name={variant.name}
               categoryId={categoryId}
               onClick={() => onCardClick(variant.id, colorDef.id)}
             />
           );
         })}
       </div>
    </div>
));

const DecorGrid = React.memo(({ variants, onCardClick, collectionState, category }) => {
  return (
    <div className="flex flex-col gap-10">
      {variants.map((variant) => (
        <VariantRow 
          key={variant.id}
          variant={variant}
          categoryId={category.id}
          onCardClick={onCardClick}
          collectionState={collectionState}
        />
      ))}
    </div>
  );
});


export default DecorGrid;
