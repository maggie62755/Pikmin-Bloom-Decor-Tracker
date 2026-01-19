import React from 'react';
import { PIKMIN_COLORS, DECOR_STATUS } from '../constants';
import { Sprout, Heart, Check } from 'lucide-react';

const MiniStatusIcon = ({ status, size = 10 }) => {
    switch (status) {
        case DECOR_STATUS.SEEDLING: return <Sprout size={size} className="text-amber-500" />;
        case DECOR_STATUS.GROWING: return <Heart size={size} className="text-pink-500 fill-pink-500/20" />;
        case DECOR_STATUS.COLLECTED: return <Check size={size} className="text-brand-primary" strokeWidth={3} />;
        default: return null;
    }
};

const MiniCard = React.memo(({ status, imagePath, colorName, onClick }) => (
    <button 
        onClick={onClick}
        className={`
            relative w-12 h-12 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300
            ${status === DECOR_STATUS.NOT_COLLECTED 
                ? 'bg-stone-100/50 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:scale-110' 
                : 'bg-white shadow-sm ring-1 ring-stone-100 hover:shadow-md hover:scale-110'}
        `}
    >
        <img
            src={imagePath}
            alt={colorName}
            className="w-8 h-8 object-contain"
            onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E"; }}
        />
        <div className="absolute -bottom-1.5 -right-1.5 p-1 bg-white rounded-full shadow-sm border border-stone-100">
            <MiniStatusIcon status={status} size={10} />
        </div>
    </button>
));

const DecorRow = React.memo(({ variant, categoryId, categoryName, collection, onCardClick }) => (
    <tr className="hover:bg-white transition-colors group">
        <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-stone-50 transition-colors z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
            <div className="font-black text-stone-800 leading-tight">{variant.name}</div>
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{categoryName}</div>
        </td>
        {PIKMIN_COLORS.map(colorDef => {
            const isAvailable = variant.colors.includes(colorDef.id);
            const status = collection[variant.id]?.[colorDef.id] || DECOR_STATUS.NOT_COLLECTED;
            const imagePath = `/images/decors_images/${categoryId}/${colorDef.id}.png`;
            
            return (
                <td key={colorDef.id} className="px-1 py-1 text-center">
                    {isAvailable ? (
                        <MiniCard 
                            status={status} 
                            imagePath={imagePath} 
                            colorName={colorDef.name} 
                            onClick={() => onCardClick(variant.id, colorDef.id)} 
                        />
                    ) : (
                        <div className="w-1.5 h-1.5 mx-auto rounded-full bg-stone-200 opacity-30" />
                    )}
                </td>
            );
        })}
    </tr>
));

const DecorList = ({ categories, collection, onCardClick }) => {
  return (
    <div className="glass-panel rounded-4xl overflow-hidden border-stone-200/50 shadow-xl bg-white/50">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-stone-200">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-6 py-5 font-black text-stone-900 min-w-[220px] sticky left-0 bg-stone-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                裝飾種類
              </th>
              {PIKMIN_COLORS.map(color => (
                <th key={color.id} className="px-3 py-5 text-center min-w-[70px]">
                  <div 
                    className="w-5 h-5 rounded-full mx-auto border-2 border-white shadow-sm ring-1 ring-stone-200" 
                    style={{ backgroundColor: color.hex }} 
                    title={color.name}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {categories.map(category => (
              <React.Fragment key={category.id}>
                {category.variants.map(variant => (
                  <DecorRow 
                    key={variant.id}
                    variant={variant}
                    categoryId={category.id}
                    categoryName={category.name}
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
