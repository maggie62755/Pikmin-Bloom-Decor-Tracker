import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutGrid, List, Search, ArrowUpDown, X } from 'lucide-react';
import { usePikmin } from '../context/PikminContext';
import { DECOR_CATEGORIES, isStandardCategory } from '../constants';
import { useTranslation } from '../i18n';
import DecorGridCategory from '../components/DecorGridCategory';
import DecorGrid from '../components/DecorGrid';
import DecorList from '../components/DecorList';
import { warmImages } from '../utils/imagePrefetch';
import './Tracker.css';

// Keep collection updates inside the category that owns the changed variant.
const TrackerCategory = React.memo(({ category, isOpen, onToggle, onCardClick, collection, progress, total }) => (
    <DecorGridCategory
        category={category}
        isOpen={isOpen}
        onToggle={() => onToggle(category.id)}
        progress={progress}
        total={total}
    >
        <DecorGrid
            category={category}
            variants={category.variants}
            onCardClick={onCardClick}
            collectionState={collection}
        />
    </DecorGridCategory>
), (previous, next) => (
    previous.category === next.category &&
    previous.isOpen === next.isOpen &&
    previous.onToggle === next.onToggle &&
    previous.onCardClick === next.onCardClick &&
    previous.progress === next.progress &&
    previous.total === next.total &&
    next.category.variants.every(variant => previous.collection[variant.id] === next.collection[variant.id])
));

const Tracker = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { collection, toggleStatus, calculateProgress } = usePikmin();
    const [viewMode, setViewMode] = useState('grid');
    const [openCategoryId, setOpenCategoryId] = useState(location.state?.openCategoryId || null);
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

    const toggleCategory = React.useCallback((id) => {
        setOpenCategoryId(previous => previous === id ? null : id);
    }, []);

    React.useEffect(() => {
        const onScroll = () => setIsCompactSticky(window.scrollY > 180);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    React.useEffect(() => {
        if (!openCategoryId || viewMode !== 'grid') return;
        const category = DECOR_CATEGORIES.find(candidate => candidate.id === openCategoryId);
        if (category) prefetchCategoryImages(category, 20);
    }, [openCategoryId, viewMode, prefetchCategoryImages]);

    const finishOnboarding = () => {
        localStorage.setItem('tracker-onboarded', '1');
        setShowOnboarding(false);
    };

    const onboardingTips = [
        t('tracker.onboarding_tip_1'),
        t('tracker.onboarding_tip_2'),
        t('tracker.onboarding_tip_3')
    ];

    const matchingCategories = React.useMemo(() => {
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

    return filteredCategories;
    }, [filterType, searchQuery]);

    const categoryProgress = React.useMemo(() => new Map(
        DECOR_CATEGORIES.map(category => [category.id, calculateProgress(category)])
    ), [calculateProgress]);

    const filteredCategories = React.useMemo(() => {
        if (sortOrder === 'default') return matchingCategories;
        const filteredCategories = [...matchingCategories];
    // 3. Sort
    if (sortOrder !== 'default') {
        filteredCategories.sort((a, b) => {
            const progA = categoryProgress.get(a.id);
            const rateA = progA.total > 0 ? progA.collected / progA.total : 0;

            const progB = categoryProgress.get(b.id);
            const rateB = progB.total > 0 ? progB.collected / progB.total : 0;

            if (Math.abs(rateA - rateB) < 0.0001) {
                return DECOR_CATEGORIES.indexOf(a) - DECOR_CATEGORIES.indexOf(b);
            }

            return sortOrder === 'desc' ? rateB - rateA : rateA - rateB;
        });
    }

        return filteredCategories;
    }, [matchingCategories, sortOrder, categoryProgress]);

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
                        const { collected, total } = categoryProgress.get(category.id);
                        return (
                            <TrackerCategory
                                key={category.id}
                                category={category}
                                isOpen={openCategoryId === category.id}
                                onToggle={toggleCategory}
                                onCardClick={toggleStatus}
                                collection={collection}
                                progress={collected}
                                total={total}
                            />
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
