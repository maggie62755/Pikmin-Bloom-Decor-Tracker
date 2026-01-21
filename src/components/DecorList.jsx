import React from 'react';
import { PIKMIN_COLORS, DECOR_STATUS } from '../constants';
import { Sprout, Heart, Check } from 'lucide-react';

import './DecorList.css';

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
        className={`mini-card ${status === DECOR_STATUS.NOT_COLLECTED ? 'not-collected' : 'collected'}`}
    >
        <img
            src={imagePath}
            alt={colorName}
            className="mini-card-img"
            onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E"; }}
        />
        <div className="mini-card-status-indicator">
            <MiniStatusIcon status={status} size={10} />
        </div>
    </button>
));

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
                            colorName={colorDef.name_ch || colorDef.name} 
                            onClick={() => onCardClick(variant.id, colorDef.id)} 
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

