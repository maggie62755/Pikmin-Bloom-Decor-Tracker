import React, { useState, useMemo, useEffect } from 'react';
import { usePikmin } from '../context/PikminContext';
import { DECOR_CATEGORIES, DECOR_STATUS, PIKMIN_COLORS, isStandardCategory } from '../constants';
import { COLORS } from '../theme/colors';
import './Dashboard.css';

// Sub-components
import DashboardControls from '../components/dashboard/DashboardControls';
import DashboardStats from '../components/dashboard/DashboardStats';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import IncompleteList from '../components/dashboard/IncompleteList';
import PikminDonutChart from '../components/dashboard/PikminDonutChart';

const Dashboard = () => {
    const { collection, calculateProgress } = usePikmin();

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
                        if (missingCounts[cId] !== undefined) {
                            missingCounts[cId]++;
                        }
                    }
                });
            });
        });

        return PIKMIN_COLORS.map(c => ({
            name: c.name_ch || c.name,
            value: missingCounts[c.id],
            fill: COLORS.pikmin[c.id]
        })).filter(item => item.value > 0);
    }, [activeCategories, collection]);

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
                            const colorName = PIKMIN_COLORS.find(col => col.id === c)?.name_ch || c;
                            missingItems.push(`${v.name_ch || v.name} (${colorName})`);
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
    }, [activeCategories, calculateProgress, collection]);

    const statusData = [
        { name: '飾品獲得', value: stats[DECOR_STATUS.COLLECTED], color: COLORS.status.collected },
        { name: '培養感情中', value: stats[DECOR_STATUS.GROWING], color: COLORS.status.growing },
        { name: '花苗等待孵化', value: stats[DECOR_STATUS.SEEDLING], color: COLORS.status.seedling },
        { name: '未獲得花苗', value: stats[DECOR_STATUS.NOT_COLLECTED], color: COLORS.status.missing },
    ];

    const colorData = useMemo(() => PIKMIN_COLORS.map(c => {
        let count = 0;
        activeCategories.forEach(cat => {
            cat.variants.forEach(v => {
                if (v.colors.includes(c.id)) {
                    if ((collection[v.id]?.[c.id] || 0) === DECOR_STATUS.COLLECTED) {
                        count++;
                    }
                }
            });
        });
        return { name: c.name_ch || c.name, value: count, fill: COLORS.pikmin[c.id] };
    }), [activeCategories, collection]);


    return (
        <div className="page-container">
            <div className="section-header">
                <h2 className="section-title">數據儀表板</h2>
                <p className="section-desc">收藏進度與皮克敏分佈概覽</p>
            </div>

            <DashboardControls
                filterType={filterType}
                setFilterType={setFilterType}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                availableCategories={availableCategories}
            />

            {/* Top Row: Donut Chart + Stats Grid */}
            <div className="charts-grid mb-8">
                <PikminDonutChart data={statusData} title="收集進度" />
                <DashboardStats
                    stats={stats}
                    className="grid grid-cols-2 gap-6" // Force 2x2 grid
                />
            </div>

            {/* Bottom Row: Bar Charts */}
            <DashboardCharts
                colorData={colorData}
                missingByColor={missingByColor}
            />

            <IncompleteList incompleteCategories={incompleteCategories} />

            <div className="text-center text-sm text-lime-900/40 font-bold pb-10 mt-12">
                總計裝飾品項: {stats.total}
            </div>
        </div>
    );
};

export default Dashboard;
