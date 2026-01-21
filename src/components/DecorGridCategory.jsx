import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './DecorGridCategory.css';

const DecorGridCategory = React.memo(({ category, isOpen, onToggle, progress, total, children }) => {
  return (
    <div className={`grid-category-container soft-card ${isOpen ? 'is-open' : ''}`}>
      <button 
        onClick={onToggle}
        className={`grid-category-header ${isOpen ? 'is-open' : ''}`}
      >
        <div className="grid-category-title-area">
          <div className={`grid-category-chevron-wrapper ${isOpen ? 'is-open' : ''}`}>
            {isOpen ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
          </div>
          {category.icon && (
            <img 
              src={`/src/data/images/icons/${category.icon}`} 
              alt="" 
              className="grid-category-icon"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <h3 className="grid-category-title">{category.name_ch || category.name}</h3>
        </div>

        <div className="grid-category-progress-area">
            <div className="grid-category-progress-bar-bg">
                <div 
                    className="grid-category-progress-bar-fill" 
                    style={{ width: `${(progress / total) * 100}%` }}
                />
            </div>
            <div className="grid-category-progress-badge">
                <span className="current">{progress}</span>
                <span className="separator">/</span> 
                <span className="total">{total}</span>
            </div>
        </div>
      </button>
      
      {isOpen && (
        <div className="grid-category-content">
          {children}
        </div>
      )}
    </div>
  );
});

export default DecorGridCategory;
