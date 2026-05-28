import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const DashboardControls = ({
    filterType,
    setFilterType,
    selectedCategories,
    setSelectedCategories,
    availableCategories
}) => {
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [dropdownSearch, setDropdownSearch] = useState('');
    const [isCompact, setIsCompact] = useState(false);
    const dropdownInputRef = useRef(null);

    const toggleCategorySelect = (id) => {
        setSelectedCategories(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            return [...prev, id];
        });
    };

    const selectAll = () => setSelectedCategories(availableCategories.map(c => c.id));
    const clearSelection = () => setSelectedCategories([]);

    useEffect(() => {
        if (!isCategoryDropdownOpen) return;

        dropdownInputRef.current?.focus();
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsCategoryDropdownOpen(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isCategoryDropdownOpen]);

    useEffect(() => {
        const onScroll = () => setIsCompact(window.scrollY > 180);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className={`dashboard-sticky-header ${isCompact ? 'compact' : ''}`}>
            {/* Row 1: Category Multi-Select (Styled as Search Bar) */}
            <div
                className="dashboard-search-bar w-full text-left"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    }
                    if (e.key === 'Escape') {
                        setIsCategoryDropdownOpen(false);
                    }
                }}
                aria-haspopup="listbox"
                aria-expanded={isCategoryDropdownOpen}
                aria-controls="dashboard-category-dropdown"
                aria-label="選擇統計類別"
                role="button"
                tabIndex={0}
            >
                <span className={`text-base md:text-lg font-extrabold ${selectedCategories.length === 0 ? 'text-stone-400' : 'text-stone-800'}`}>
                    {selectedCategories.length === 0
                        ? '選擇特定類別...'
                        : `已選擇 ${selectedCategories.length} 個類別`}
                </span>
                <div className="flex-1" />
                <ChevronDown size={20} className="text-stone-400" />

                {isCategoryDropdownOpen && (
                    <div
                        id="dashboard-category-dropdown"
                        className="multi-select-dropdown z-50"
                        onClick={(e) => e.stopPropagation()}
                        role="listbox"
                        aria-multiselectable="true"
                    >
                        <input
                            type="text"
                            placeholder="搜尋類別..."
                            className="multi-select-search"
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            ref={dropdownInputRef}
                            aria-label="搜尋類別"
                        />

                        <div className="multi-select-list custom-scrollbar">
                            {availableCategories
                                .filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase()) || c.name_ch.includes(dropdownSearch))
                                .map(category => (
                                    <button
                                        type="button"
                                        key={category.id}
                                        className={`multi-select-item ${selectedCategories.includes(category.id) ? 'selected' : ''}`}
                                        onClick={() => toggleCategorySelect(category.id)}
                                        role="option"
                                        aria-selected={selectedCategories.includes(category.id)}
                                    >
                                        <div className="checkbox-custom">
                                            {selectedCategories.includes(category.id) && <Check size={12} strokeWidth={4} />}
                                        </div>
                                        <span className="text-sm font-medium text-stone-700">{category.name_ch}</span>
                                    </button>
                                ))}
                            {availableCategories.length === 0 && (
                                <div className="p-4 text-center text-sm text-stone-400">無可用類別</div>
                            )}
                        </div>

                        <div className="multi-select-actions">
                            <button type="button" onClick={selectAll} className="text-btn-small">全選</button>
                            <button type="button" onClick={clearSelection} className="text-btn-small">清空</button>
                        </div>
                    </div>
                )}
                {isCategoryDropdownOpen && (
                    <div
                        className="fixed inset-0 z-40 cursor-default"
                        aria-hidden="true"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsCategoryDropdownOpen(false);
                        }}
                    />
                )}
            </div>

            {/* Row 2: Filter Chips */}
            <div className="dashboard-filter-row no-scrollbar">
                <div className="flex items-center gap-2 mx-auto">
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
            </div>
        </div>
    );
};

export default DashboardControls;
