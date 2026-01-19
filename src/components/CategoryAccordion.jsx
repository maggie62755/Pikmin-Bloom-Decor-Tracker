import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CategoryAccordion = ({ category, isOpen, onToggle, progress, total, children }) => {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 bg-white shadow-sm transition-all hover:shadow-md">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isOpen ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
          <h3 className="font-bold text-slate-700 text-lg">{category.name}</h3>
        </div>
        <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
          {progress} / {total}
        </div>
      </button>
      
      {/* Animated Height Wrapper could be added here for smooth transition */}
      {isOpen && (
        <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default CategoryAccordion;
