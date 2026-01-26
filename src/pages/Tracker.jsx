import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutGrid, List, Search, ArrowUpDown, Filter, X, ChevronsDown, ChevronsUp } from 'lucide-react';
import { usePikmin } from '../context/PikminContext';
import { DECOR_CATEGORIES, isStandardCategory } from '../constants';
import DecorGridCategory from '../components/DecorGridCategory';
import DecorGrid from '../components/DecorGrid';
import DecorList from '../components/DecorList';
import './Tracker.css';

const Tracker = () => {
    const location = useLocation();
    const { collection, toggleStatus, calculateProgress } = usePikmin();
    const [viewMode, setViewMode] = useState('grid');
    const [openCategories, setOpenCategories] = useState(
        location.state?.openCategoryId ? { [location.state.openCategoryId]: true } : {}
    );

    // Sync state if navigation happens while already on the page
    useEffect(() => {
        if (location.state?.openCategoryId) {
            setOpenCategories(prev => ({
                ...prev,
                [location.state.openCategoryId]: true
            }));
        }
        if (location.state?.searchQuery !== undefined) {
            setSearchQuery(location.state.searchQuery);
        }
        if (location.state?.filterType !== undefined) {
            setFilterType(location.state.filterType);
        }
    }, [location.state]);

    // Search & Filter State (Initialize from navigation state if available)
    const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || '');
    const [sortOrder, setSortOrder] = useState('default'); // default, asc (low->high), desc (high->low)
    const [filterType, setFilterType] = useState(location.state?.filterType || 'all'); // all, standard, event

    // Clear state on unmount or new navigation to prevent persistent params? 
    // Actually standard behavior is fine, user can clear it manually.

    // If coming from dashboard with a search, maybe expand the relevant category automatically?
    // That would be a nice touch, but requires finding which category matches.
    // For now simple search filter is enough.

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

                if (Math.abs(rateA - rateB) < 0.0001) {
                    // Secondary sort: Keep original order for stability
                    return DECOR_CATEGORIES.indexOf(a) - DECOR_CATEGORIES.indexOf(b);
                }

                return sortOrder === 'desc' ? rateB - rateA : rateA - rateB;
            });
        }

        return result;
    }, [filterType, searchQuery, sortOrder, calculateProgress]);

    return (
        <div className="page-container">
            <div className="section-header">
                <span className="section-label">
                    Tracker
                </span>
                <h1 className="section-title">
                    裝飾品追蹤
                    <span className="section-desc">
                        / 點擊卡片切換狀態 / 右鍵(長按)卡片可選不同狀態
                    </span>
                </h1>
            </div>
            {/* Sticky Minimialist Toolbar */}
            <div className="tracker-sticky-header">

                {/* Row 1: Search */}
                <div className="tracker-search-bar">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="搜尋飾品..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input-minimal"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="search-clear-btn">
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Row 2: Filter Chips & Actions (Horizontal Scroll) */}
                <div className="tracker-filter-row no-scrollbar">

                    {/* Filter Chips */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {[
                            { id: 'all', label: '全部' },
                            { id: 'standard', label: '一般' },
                            { id: 'event', label: '活動' },
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setFilterType(type.id)}
                                className={`chip-btn ${filterType === type.id ? 'active' : ''}`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-stone-300 mx-1 flex-shrink-0" />

                    {/* Sort Chip */}
                    <button
                        onClick={() => {
                            const next = { 'default': 'desc', 'desc': 'asc', 'asc': 'default' };
                            setSortOrder(next[sortOrder]);
                        }}
                        className={`chip-btn ${sortOrder !== 'default' ? 'active-secondary' : ''}`}
                    >
                        <ArrowUpDown size={14} />
                        <span>
                            {sortOrder === 'default' ? '預設排序' :
                                sortOrder === 'desc' ? '完成度 高→低' : '完成度 低→高'}
                        </span>
                    </button>

                    <div className="flex-1" /> {/* Spacer */}

                    {/* View Toggles */}
                    {viewMode === 'grid' && (
                        <div className="flex items-center gap-1 bg-white/40 p-1 rounded-full border border-white/20">
                            <button onClick={expandAll} className="icon-btn-small" title="展開">
                                <ChevronsDown size={16} />
                            </button>
                            <button onClick={collapseAll} className="icon-btn-small" title="收合">
                                <ChevronsUp size={16} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-1 bg-white/40 p-1 rounded-full border border-white/20">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`icon-btn-small ${viewMode === 'grid' ? 'active' : ''}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`icon-btn-small ${viewMode === 'list' ? 'active' : ''}`}
                        >
                            <List size={16} />
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
                        <button onClick={() => { setSearchQuery(''); setFilterType('all'); }} className="btn-link">
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
