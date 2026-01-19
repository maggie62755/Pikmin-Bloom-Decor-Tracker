import React, { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { usePikmin } from '../context/PikminContext';
import { DECOR_CATEGORIES } from '../constants';
import CategoryAccordion from '../components/CategoryAccordion';
import DecorGrid from '../components/DecorGrid';
import DecorList from '../components/DecorList';

const Tracker = () => {
    const { collection, toggleStatus, calculateProgress } = usePikmin();
    const [viewMode, setViewMode] = useState('grid');
    const [openCategories, setOpenCategories] = useState({});

    const toggleCategory = (id) => {
        setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-black text-stone-900">裝飾品追蹤</h2>
                    <p className="text-stone-500 font-bold">點擊卡片即可切換收藏狀態</p>
                </div>
                
                {/* View Container Toggle */}
                <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200 shadow-inner">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all
                            ${viewMode === 'grid' 
                                ? 'bg-white text-brand-primary shadow-sm scale-105' 
                                : 'text-stone-400 hover:text-stone-600'}
                        `}
                    >
                        <LayoutGrid size={18} /> 網格
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all
                            ${viewMode === 'list' 
                                ? 'bg-white text-brand-primary shadow-sm scale-105' 
                                : 'text-stone-400 hover:text-stone-600'}
                        `}
                    >
                        <List size={18} /> 列表
                    </button>
                </div>
            </div>


            {viewMode === 'grid' ? (
                DECOR_CATEGORIES.map(category => {
                    const { collected, total } = calculateProgress(category);
                    return (
                        <CategoryAccordion
                            key={category.id}
                            category={category}
                            isOpen={openCategories[category.id]}
                            onToggle={() => toggleCategory(category.id)}
                            progress={collected}
                            total={total}
                        >
                            <DecorGrid
                                category={category} // Added this
                                variants={category.variants}
                                onCardClick={toggleStatus}
                                collectionState={collection}
                            />

                        </CategoryAccordion>
                    );
                })
            ) : (
                <DecorList
                    categories={DECOR_CATEGORIES}
                    collection={collection}
                    onCardClick={toggleStatus}
                />
            )}
        </div>
    );
};

export default Tracker;
