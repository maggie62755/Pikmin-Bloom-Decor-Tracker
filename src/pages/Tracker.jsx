import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutGrid, List, Search, ArrowUpDown, X, ChevronsDown, ChevronsUp } from 'lucide-react';
import { usePikmin } from '../context/PikminContext';
import { DECOR_CATEGORIES, isStandardCategory } from '../constants';
import { useTranslation } from '../i18n';
import DecorGridCategory from '../components/DecorGridCategory';
import DecorGrid from '../components/DecorGrid';
import DecorList from '../components/DecorList';
import { warmImages } from '../utils/imagePrefetch';
import './Tracker.css';

const Tracker = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { collection, toggleStatus, calculateProgress } = usePikmin();
    const [viewMode, setViewMode] = useState('grid');
    const [openCategories, setOpenCategories] = useState(
        location.state?.openCategoryId ? { [location.state.openCategoryId]: true } : {}
    );
    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || '');
    const [sortOrder, setSortOrder] = useState('default'); // default, asc (low->high), desc (high->low)
    const [filterType, setFilterType] = useState(location.state?.filterType || 'all'); // all, standard, event
    const [isCompactSticky, setIsCompactSticky] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('tracker-onboarded'));
    const [onboardingStep, setOnboardingStep] = useState(0);

    const getCategoryImageUrls = React.useCallback((category) => {
        if (!category || !category.image_path || !category.variants) return [];

        const urls = [];
        category.variants.forEach((variant) => {
            if (!variant?.image_name || !Array.isArray(variant.colors)) return;

            variant.colors.forEach((colorId) => {
                if (!colorId) return;
                const fileColor = colorId.charAt(0).toUpperCase() + colorId.slice(1);
                urls.push(`${import.meta.env.BASE_URL}images/decors_images/${category.image_path}/${variant.image_name}_${fileColor}.png`);
            });
        });

        return urls;
    }, []);

    const prefetchCategoryImages = React.useCallback((category, limit = 18) => {
        warmImages(getCategoryImageUrls(category), limit);
    }, [getCategoryImageUrls]);

    const toggleCategory = (id) => {
        setOpenCategories((prev) => {
            const willOpen = !prev[id];
            if (willOpen) {
                const category = filteredCategories.find((c) => c.id === id);
                if (category) {
                    prefetchCategoryImages(category, 20);
                }
            }
            return { ...prev, [id]: willOpen };
        });
    };

    const expandAll = () => {
        const allOpen = {};
        filteredCategories.forEach(c => { allOpen[c.id] = true; });
        setOpenCategories(allOpen);

        filteredCategories.slice(0, 4).forEach((category) => {
            prefetchCategoryImages(category, 12);
        });
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

    React.useEffect(() => {
        const initiallyOpenIds = Object.keys(openCategories).filter((id) => openCategories[id]);
        if (initiallyOpenIds.length === 0) return;

        initiallyOpenIds.slice(0, 2).forEach((id) => {
            const category = DECOR_CATEGORIES.find((c) => c.id === id);
            if (category) {
                prefetchCategoryImages(category, 16);
            }
        });
    }, []);

    const finishOnboarding = () => {
        localStorage.setItem('tracker-onboarded', '1');
        setShowOnboarding(false);
    };

    const onboardingTips = [
        t('tracker.onboarding_tip_1'),
        t('tracker.onboarding_tip_2'),
        t('tracker.onboarding_tip_3')
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
            (c.name_ch && c.name_ch.includes(query)) ||
            c.variants.some(v =>
                v.name.toLowerCase().includes(query) ||
                (v.name_ch && v.name_ch.includes(query))
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
                return DECOR_CATEGORIES.indexOf(a) - DECOR_CATEGORIES.indexOf(b);
            }

            return sortOrder === 'desc' ? rateB - rateA : rateA - rateB;
        });
    }

    return (
        <div className="page-container">
            <div className="section-header">
                <span className="section-label">
                    {t('tracker.label')}
                </span>
                <h1 className="section-title">
                    {t('tracker.title')}
                    <span className="section-desc">
                        / {t('tracker.subtitle')}
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
                        placeholder={t('tracker.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input-minimal"
                        aria-label={t('tracker.search_placeholder')}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="search-clear-btn"
                            aria-label={t('tracker.clear_search')}
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
                            { id: 'all', labelKey: 'tracker.filter_all' },
                            { id: 'standard', labelKey: 'tracker.filter_standard' },
                            { id: 'event', labelKey: 'tracker.filter_event' },
                        ].map(type => (
                            <button
                                type="button"
                                key={type.id}
                                onClick={() => setFilterType(type.id)}
                                className={`chip-btn ${filterType === type.id ? 'active' : ''}`}
                                aria-pressed={filterType === type.id}
                            >
                                {t(type.labelKey)}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-journal-line/50 mx-1 flex-shrink-0" />

                    {/* Sort Chip */}
                    <button
                        type="button"
                        onClick={() => {
                            const next = { 'default': 'desc', 'desc': 'asc', 'asc': 'default' };
                            setSortOrder(next[sortOrder]);
                        }}
                        className={`chip-btn ${sortOrder !== 'default' ? 'active-secondary' : ''}`}
                        aria-label={t('tracker.sort_default')}
                    >
                        <ArrowUpDown size={14} />
                        <span>
                            {sortOrder === 'default' ? t('tracker.sort_default') :
                                sortOrder === 'desc' ? t('tracker.sort_desc') : t('tracker.sort_asc')}
                        </span>
                    </button>

                    <div className="flex-1" /> {/* Spacer */}

                    {/* View Toggles */}
                    {viewMode === 'grid' && (
                        <div className="flex items-center gap-1 bg-white/40 p-1 rounded-full border border-white/20">
                            <button type="button" onClick={expandAll} className="icon-btn-small" title={t('tracker.expand_all')} aria-label={t('tracker.expand_all')}>
                                <ChevronsDown size={16} />
                            </button>
                            <button type="button" onClick={collapseAll} className="icon-btn-small" title={t('tracker.collapse_all')} aria-label={t('tracker.collapse_all')}>
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
                            aria-label={t('tracker.grid_view')}
                            title={t('tracker.grid_view')}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`icon-btn-small ${viewMode === 'list' ? 'active' : ''}`}
                            aria-pressed={viewMode === 'list'}
                            aria-label={t('tracker.list_view')}
                            title={t('tracker.list_view')}
                        >
                            <List size={16} />
                        </button>
                    </div>

                </div>
            </div>

            {showOnboarding && (
                <div className="onboarding-hint nature-lab-panel">
                    <p className="text-xs uppercase tracking-[0.18em] font-display font-bold text-brand-primary/80 mb-2">{t('tracker.onboarding_label')}</p>
                    <p className="text-sm md:text-base font-bold text-journal-ink">{onboardingTips[onboardingStep]}</p>
                    <div className="empty-state-actions mt-3">
                        <button type="button" onClick={() => setOnboardingStep((prev) => (prev + 1) % onboardingTips.length)} className="chip-btn active-secondary">
                            {t('tracker.next_tip')}
                        </button>
                        <button type="button" onClick={finishOnboarding} className="chip-btn active">
                            {t('tracker.got_it')}
                        </button>
                    </div>
                </div>
            )}

            <p className="px-2 mb-3 text-xs md:text-sm font-semibold text-journal-muted">
                {t('tracker.showing_categories')} <span className="text-journal-ink font-display font-bold">{filteredCategories.length}</span> {t('tracker.categories_unit')}
                （{t('tracker.filter_label')}：{filterType === 'all' ? t('tracker.filter_all') : filterType === 'standard' ? t('tracker.filter_standard') : t('tracker.filter_event')}）
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
                                    category={category}
                                    variants={category.variants}
                                    onCardClick={toggleStatus}
                                    collectionState={collection}
                                />
                            </DecorGridCategory>
                        );
                    })
                ) : (
                    <div className="empty-state nature-lab-panel">
                        <p className="empty-state-text">{t('tracker.empty_title')}</p>
                        <div className="empty-state-actions mt-3">
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setFilterType('all'); }}
                                className="chip-btn active"
                            >
                                {t('tracker.clear_filters')}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setFilterType('standard'); setSortOrder('asc'); }}
                                className="chip-btn"
                            >
                                {t('tracker.show_standard_low')}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setFilterType('event'); setSortOrder('asc'); }}
                                className="chip-btn"
                            >
                                {t('tracker.show_event_low')}
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
