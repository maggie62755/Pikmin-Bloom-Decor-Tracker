import React, { useState } from 'react';
import { LayoutGrid, List, Search, ArrowUpDown, Filter, X, ChevronsDown, ChevronsUp } from 'lucide-react';
import { usePikmin } from '../context/PikminContext';
import { DECOR_CATEGORIES, isStandardCategory } from '../constants';
import DecorGridCategory from '../components/DecorGridCategory';
import DecorGrid from '../components/DecorGrid';
import DecorList from '../components/DecorList';
import './Tracker.css';

const Tracker = () => {
    const { collection, toggleStatus, calculateProgress } = usePikmin();
    const [viewMode, setViewMode] = useState('grid');
    const [openCategories, setOpenCategories] = useState({});
    
    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('default'); // default, asc (low->high), desc (high->low)
    const [filterType, setFilterType] = useState('all'); // all, standard, event

    const toggleCategory = (id) => {
        setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const expandAll = () => {
        const allOpen = {};
        filteredCategories.forEach(c => { allOpen[c.id] = true; });
        setOpenCategories(allOpen);
    };

    const collapseAll = () => {
        setOpenCategories({});
    };

    // Filter Logic
    const filteredCategories = React.useMemo(() => {
        let result = [...DECOR_CATEGORIES];

        // 1. Filter by Type
        if (filterType === 'standard') {
            result = result.filter(c => isStandardCategory(c.id));
        } else if (filterType === 'event') {
            result = result.filter(c => !isStandardCategory(c.id));
        }

        // 2. Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c => 
                c.name.toLowerCase().includes(query) || 
                c.name_ch.includes(query) ||
                c.variants.some(v => 
                    v.name.toLowerCase().includes(query) || 
                    v.name_ch.includes(query)
                )
            );
        }

        // 3. Sort
        if (sortOrder !== 'default') {
            result.sort((a, b) => {
                const progA = calculateProgress(a);
                const rateA = progA.total > 0 ? progA.collected / progA.total : 0;
                
                const progB = calculateProgress(b);
                const rateB = progB.total > 0 ? progB.collected / progB.total : 0;

                if (sortOrder === 'desc') {
                    return rateB - rateA;
                } else {
                    return rateA - rateB;
                }
            });
        }

        return result;
    }, [filterType, searchQuery, sortOrder, calculateProgress]);

    return (
        <div className="page-container">
                <div className="section-header">
                    <h2 className="section-title">裝飾品追蹤</h2>
                    <p className="section-desc">點擊卡片即可切換收藏狀態</p>
                </div>
            <div className="tracker-controls">
                
                {/* Search */}
                <div className="search-container">
                    <Search className="search-icon" size={18} />
                    <input 
                        type="text"
                        placeholder="搜尋類別、飾品 (例如: 餐廳, 廚師帽)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="search-clear-btn"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="actions-group">
                    {/* Type Filter */}
                    <div className="filter-group">
                        {[
                            { id: 'all', label: '全部' },
                            { id: 'standard', label: '一般' },
                            { id: 'event', label: '活動' },
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setFilterType(type.id)}
                                className={`filter-btn ${filterType === type.id ? 'active' : ''}`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <button 
                        onClick={() => {
                            const next = {
                                'default': 'desc',
                                'desc': 'asc',
                                'asc': 'default'
                            };
                            setSortOrder(next[sortOrder]);
                        }}
                        className={`sort-btn ${sortOrder !== 'default' ? 'active' : ''}`}
                    >
                        <ArrowUpDown size={16} />
                        <span className="sort-text">
                            {sortOrder === 'default' ? '預設排序' : sortOrder === 'desc' ? '完成度: 高 → 低' : '完成度: 低 → 高'}
                        </span>
                    </button>

                    {/* Expand/Collapse Controls */}
                    <div className="view-mode-group">
                        <button 
                            onClick={expandAll}
                            className="view-mode-btn"
                            title="展開全部"
                        >
                            <ChevronsDown size={18} />
                        </button>
                        <button 
                            onClick={collapseAll}
                            className="view-mode-btn"
                            title="收合全部"
                        >
                            <ChevronsUp size={18} />
                        </button>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="view-mode-group">
                       <button 
                            onClick={() => setViewMode('grid')}
                            className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            title="網格檢視"
                        >
                            <LayoutGrid size={18} /> 
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                            title="列表檢視"
                        >
                            <List size={18} /> 
                        </button>
                    </div>
                </div>
            </div>



            {viewMode === 'grid' ? (
                filteredCategories.length > 0 ? (
                    filteredCategories.map(category => {
                    const { collected, total } = calculateProgress(category);
                    return (
                        <DecorGridCategory
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

                        </DecorGridCategory>
                    );
                })
                ) : (
                    <div className="empty-state">
                        <p className="empty-state-text">找不到符合的飾品</p>
                        <button onClick={() => {setSearchQuery(''); setFilterType('all');}} className="btn-link">
                            清除搜尋條件
                        </button>
                    </div>
                )
            ) : (
                <DecorList
                    categories={filteredCategories}
                    collection={collection}
                    onCardClick={toggleStatus}
                />
            )}
        </div>
    );
};

export default Tracker;
