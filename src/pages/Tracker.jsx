import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutGrid, List, Search, ArrowUpDown, X, ChevronsDown, ChevronsUp } from 'lucide-react';
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
    // Search & Filter State (Initialize from navigation state if available)
    const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || '');
    const [sortOrder, setSortOrder] = useState('default'); // default, asc (low->high), desc (high->low)
    const [filterType, setFilterType] = useState(location.state?.filterType || 'all'); // all, standard, event
    const [isCompactSticky, setIsCompactSticky] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('tracker-onboarded'));
    const [onboardingStep, setOnboardingStep] = useState(0);

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

    React.useEffect(() => {
        const onScroll = () => setIsCompactSticky(window.scrollY > 180);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const finishOnboarding = () => {
        localStorage.setItem('tracker-onboarded', '1');
        setShowOnboarding(false);
    };

    const onboardingTips = [
        '點擊卡片可快速在「未取得 / 已獲得」間切換。',
        '長按（手機）或右鍵（電腦）可以選擇細分狀態。',
        '先用搜尋與篩選縮小範圍，再用展開按鈕加速標記。'
    ];

    // Filter Logic
    let filteredCategories = [...DECOR_CATEGORIES];

        // 1. Filter by Type
        if (filterType === 'standard') {
            filteredCategories = filteredCategories.filter(c => isStandardCategory(c.id));
        } else if (filterType === 'event') {
            filteredCategories = filteredCategories.filter(c => !isStandardCategory(c.id));
        }

        // 2. Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredCategories = filteredCategories.filter(c =>
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
            filteredCategories.sort((a, b) => {
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
            <div className={`tracker-sticky-header ${isCompactSticky ? 'compact' : ''}`}>

                {/* Row 1: Search */}
                <div className="tracker-search-bar">
                    <Search className="search-icon" size={20} aria-hidden="true" />
                    <input
                        type="text"
                        placeholder="搜尋飾品..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input-minimal"
                        aria-label="搜尋裝飾品"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="search-clear-btn"
                            aria-label="清除搜尋內容"
                        >
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
                                type="button"
                                key={type.id}
                                onClick={() => setFilterType(type.id)}
                                className={`chip-btn ${filterType === type.id ? 'active' : ''}`}
                                aria-pressed={filterType === type.id}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-stone-300 mx-1 flex-shrink-0" />

                    {/* Sort Chip */}
                    <button
                        type="button"
                        onClick={() => {
                            const next = { 'default': 'desc', 'desc': 'asc', 'asc': 'default' };
                            setSortOrder(next[sortOrder]);
                        }}
                        className={`chip-btn ${sortOrder !== 'default' ? 'active-secondary' : ''}`}
                        aria-label={`排序模式：${sortOrder === 'default' ? '預設排序' : sortOrder === 'desc' ? '完成度高到低' : '完成度低到高'}`}
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
                            <button type="button" onClick={expandAll} className="icon-btn-small" title="展開" aria-label="展開所有分類">
                                <ChevronsDown size={16} />
                            </button>
                            <button type="button" onClick={collapseAll} className="icon-btn-small" title="收合" aria-label="收合所有分類">
                                <ChevronsUp size={16} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-1 bg-white/40 p-1 rounded-full border border-white/20">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`icon-btn-small ${viewMode === 'grid' ? 'active' : ''}`}
                            aria-pressed={viewMode === 'grid'}
                            aria-label="切換為網格視圖"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`icon-btn-small ${viewMode === 'list' ? 'active' : ''}`}
                            aria-pressed={viewMode === 'list'}
                            aria-label="切換為列表視圖"
                        >
                            <List size={16} />
                        </button>
                    </div>

                </div>
            </div>

            {showOnboarding && (
                <div className="onboarding-hint nature-lab-panel">
                    <p className="text-xs uppercase tracking-[0.18em] font-black text-brand-primary/70 mb-2">First-time Guide</p>
                    <p className="text-sm md:text-base font-bold text-stone-700">{onboardingTips[onboardingStep]}</p>
                    <div className="empty-state-actions mt-3">
                        <button type="button" onClick={() => setOnboardingStep((prev) => (prev + 1) % onboardingTips.length)} className="chip-btn active-secondary">
                            下一則提示
                        </button>
                        <button type="button" onClick={finishOnboarding} className="chip-btn active">
                            我知道了
                        </button>
                    </div>
                </div>
            )}

            <p className="px-2 mb-3 text-xs md:text-sm font-semibold text-stone-500">
                目前顯示 <span className="text-stone-700 font-black">{filteredCategories.length}</span> 個分類
                （篩選：{filterType === 'all' ? '全部' : filterType === 'standard' ? '一般' : '活動'}）
            </p>



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
                    <div className="empty-state nature-lab-panel">
                        <p className="empty-state-text">找不到符合的飾品</p>
                        <div className="empty-state-actions mt-3">
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setFilterType('all'); }}
                                className="chip-btn active"
                            >
                                清除全部條件
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setFilterType('standard'); setSortOrder('asc'); }}
                                className="chip-btn"
                            >
                                顯示一般類別（低完成度優先）
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setFilterType('event'); setSortOrder('asc'); }}
                                className="chip-btn"
                            >
                                顯示活動類別（低完成度優先）
                            </button>
                        </div>
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
