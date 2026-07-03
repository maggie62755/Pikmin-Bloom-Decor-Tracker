import { useState, useMemo, useEffect } from 'react';
import { DECOR_CATEGORIES, DECOR_STATUS, DECOR_STATUS_LABELS, PIKMIN_COLORS, isStandardCategory } from '../constants';
import { COLORS } from '../theme/colors';
import { usePikmin } from '../context/PikminContext';
import { useTranslation, getLocalizedName } from '../i18n';

export const useDashboardStats = () => {
    const { collection, calculateProgress } = usePikmin();
    const { language } = useTranslation();

    // -- State --
    const [filterType, setFilterType] = useState('all'); // 'all', 'standard', 'event'
    // Default to ALL categories selected
    const [selectedCategories, setSelectedCategories] = useState(() => DECOR_CATEGORIES.map(c => c.id));

    // -- Derived Data --

    // 1. Filtered Categories List (for dropdown & calculation)
    const availableCategories = useMemo(() => {
        return DECOR_CATEGORIES.filter(c => {
            if (filterType === 'standard') return isStandardCategory(c.id);
            if (filterType === 'event') return !isStandardCategory(c.id);
            return true;
        });
    }, [filterType]);

    // Auto-select all when available categories change (e.g. switching types)
    useEffect(() => {
        setSelectedCategories(availableCategories.map(c => c.id));
    }, [availableCategories]);

    // 2. Active Categories (for stats)
    const activeCategories = useMemo(() => {
        return availableCategories.filter(c => selectedCategories.includes(c.id));
    }, [selectedCategories, availableCategories]);

    // 3. Calculate Stats based on activeCategories
    const stats = useMemo(() => {
        let s = {
            [DECOR_STATUS.NOT_COLLECTED]: 0,
            [DECOR_STATUS.SEEDLING]: 0,
            [DECOR_STATUS.GROWING]: 0,
            [DECOR_STATUS.COLLECTED]: 0,
            total: 0
        };

        activeCategories.forEach(cat => {
            cat.variants.forEach(variant => {
                variant.colors.forEach(colorId => {
                    const status = collection[variant.id]?.[colorId] || DECOR_STATUS.NOT_COLLECTED;
                    s[status]++;
                    s.total++;
                });
            });
        });
        return s;
    }, [activeCategories, collection]);

    // 4. Missing by Color (Filtered)
    const missingByColor = useMemo(() => {
        const missingCounts = PIKMIN_COLORS.reduce((acc, c) => ({ ...acc, [c.id]: 0 }), {});

        activeCategories.forEach(cat => {
            cat.variants.forEach(v => {
                v.colors.forEach(cId => {
                    const status = collection[v.id]?.[cId] || DECOR_STATUS.NOT_COLLECTED;
                    if (status !== DECOR_STATUS.COLLECTED) {
                        // Map specific ID (e.g. 'blue1') to base ID (e.g. 'blue')
                        const baseColorId = PIKMIN_COLORS.find(pc => 
                            cId === pc.id || cId.startsWith(pc.id) && /^\d+$/.test(cId.replace(pc.id, ''))
                        )?.id;

                        if (baseColorId && missingCounts[baseColorId] !== undefined) {
                            missingCounts[baseColorId]++;
                        }
                    }
                });
            });
        });

        return PIKMIN_COLORS.map(c => ({
            name: getLocalizedName(c, language),
            value: missingCounts[c.id],
            fill: COLORS.pikmin[c.id],
            type: c.id
        })).filter(item => item.value > 0);
    }, [activeCategories, collection, language]);

    // 5. Incomplete Categories List
    const incompleteCategories = useMemo(() => {
        const list = [];
        activeCategories.forEach(cat => {
            const { collected, total } = calculateProgress(cat);
            if (collected < total) {
                const missingItems = [];
                cat.variants.forEach(v => {
                    v.colors.forEach(c => {
                        const status = collection[v.id]?.[c] || DECOR_STATUS.NOT_COLLECTED;
                        if (status !== DECOR_STATUS.COLLECTED) {
                            const baseColor = PIKMIN_COLORS.find(col => 
                                c === col.id || c.startsWith(col.id) && /^\d+$/.test(c.replace(col.id, ''))
                            );
                            const colorLabel = baseColor ? getLocalizedName(baseColor, language) : c;
                            missingItems.push({
                                label: `${getLocalizedName(v, language)} (${colorLabel})`,
                                // Store enough info to navigate/search
                                searchTerm: getLocalizedName(v, language),
                                filterType: isStandardCategory(cat.id) ? 'standard' : 'event',
                                categoryId: cat.id
                            });
                        }
                    });
                });
                list.push({
                    ...cat,
                    progress: collected,
                    total: total,
                    percent: Math.round((collected / total) * 100),
                    missingItems: missingItems
                });
            }
        });
        return list.sort((a, b) => a.percent - b.percent);
    }, [activeCategories, calculateProgress, collection, language]);

    const statusData = [
        { name: DECOR_STATUS_LABELS[DECOR_STATUS.COLLECTED], value: stats[DECOR_STATUS.COLLECTED], color: COLORS.status.collected },
        { name: DECOR_STATUS_LABELS[DECOR_STATUS.GROWING], value: stats[DECOR_STATUS.GROWING], color: COLORS.status.growing },
        { name: DECOR_STATUS_LABELS[DECOR_STATUS.SEEDLING], value: stats[DECOR_STATUS.SEEDLING], color: COLORS.status.seedling },
        { name: DECOR_STATUS_LABELS[DECOR_STATUS.NOT_COLLECTED], value: stats[DECOR_STATUS.NOT_COLLECTED], color: COLORS.status.missing },
    ];

    const colorData = useMemo(() => PIKMIN_COLORS.map(c => {
        let count = 0;
        activeCategories.forEach(cat => {
            cat.variants.forEach(v => {
                v.colors.forEach(cId => {
                    // Check if this cId belongs to the base color c.id
                    const isMatch = cId === c.id || (cId.startsWith(c.id) && /^\d+$/.test(cId.replace(c.id, '')));
                    if (isMatch) {
                        if ((collection[v.id]?.[cId] || 0) === DECOR_STATUS.COLLECTED) {
                            count++;
                        }
                    }
                });
            });
        });
        return { name: getLocalizedName(c, language), type: c.id || c.name, value: count, fill: COLORS.pikmin[c.id] };
    }), [activeCategories, collection, language]);

    return {
        filterType, setFilterType,
        selectedCategories, setSelectedCategories,
        availableCategories,
        stats,
        missingByColor,
        incompleteCategories,
        statusData,
        colorData
    };
};
