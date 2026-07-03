import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation, getLocalizedName } from '../i18n';
import './DecorGridCategory.css';

const DecorGridCategory = React.memo(({ category, isOpen, onToggle, progress, total, children }) => {
  const { language } = useTranslation();
  const categoryName = getLocalizedName(category, language);

  return (
    <div className={`grid-category-container ${isOpen ? 'is-open' : ''}`}>
      <button
        onClick={onToggle}
        className={`grid-category-header ${isOpen ? 'is-open' : ''}`}
      >
        <div className="grid-category-title-area min-w-0">
          <div className={`grid-category-chevron-wrapper ${isOpen ? 'is-open' : ''}`}>
            {isOpen ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
          </div>
          {category.icon && (
            <div
              className="category-icon grid-category-icon"
              style={{
                WebkitMaskImage: `url(${import.meta.env.BASE_URL}images/icons/${category.icon})`,
                maskImage: `url(${import.meta.env.BASE_URL}images/icons/${category.icon})`
              }}
            />
          )}
          <h3 className="grid-category-title truncate" title={categoryName}>
            {categoryName}
          </h3>
        </div>

        <div className="grid-category-progress-area">
          <div className="grid-category-progress-bar-bg">
            <div
              className={`grid-category-progress-bar-fill ${progress === total && total > 0 ? 'is-complete' : ''}`}
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
          <div className="grid-category-progress-badge">
            <span className={`current ${progress === total && total > 0 ? 'is-complete' : ''}`}>{progress}</span>
            <span className="separator">/</span>
            <span className="total">{total}</span>
          </div>
        </div>
      </button>

      <div
        className={`grid-category-content-wrapper ${isOpen ? 'is-open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="grid-category-content">
          {children}
        </div>
      </div>
    </div>
  );
});

export default DecorGridCategory;
