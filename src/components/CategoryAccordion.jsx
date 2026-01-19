import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CategoryAccordion = React.memo(({ category, isOpen, onToggle, progress, total, children }) => {
  return (
    <div className={`soft-card overflow-hidden mb-6 transition-all ${isOpen ? 'ring-1 ring-stone-200 shadow-xl' : 'hover:shadow-md'}`}>
      <button 
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-6 transition-colors ${isOpen ? 'bg-stone-50/50' : 'bg-white hover:bg-stone-50/30'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl transition-colors ${isOpen ? 'bg-white text-brand-primary shadow-sm' : 'text-stone-300'}`}>
            {isOpen ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
          </div>
          <h3 className="font-black text-stone-800 text-xl tracking-tight">{category.name}</h3>
        </div>
        <div className="flex items-center gap-4">
            <div className="h-2.5 w-24 bg-stone-100 rounded-full overflow-hidden hidden sm:block border border-stone-200/50">
                <div 
                    className="h-full bg-brand-primary transition-all duration-700 ease-out" 
                    style={{ width: `${(progress / total) * 100}%` }}
                />
            </div>
            <div className="text-xs font-black text-stone-600 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm leading-none flex items-center gap-1.5">
                <span className="text-brand-primary">{progress}</span>
                <span className="text-stone-300 font-medium">/</span> 
                <span className="text-stone-400">{total}</span>
            </div>
        </div>
      </button>
      
      {isOpen && (
        <div className="p-6 bg-white/40 border-t border-stone-100 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
});



export default CategoryAccordion;
