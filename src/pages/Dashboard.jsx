import React from 'react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import './Dashboard.css';

// Sub-components
import DashboardControls from '../components/dashboard/DashboardControls';
import DashboardStats from '../components/dashboard/DashboardStats';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import IncompleteList from '../components/dashboard/IncompleteList';

const Dashboard = () => {
    const {
        filterType, setFilterType,
        selectedCategories, setSelectedCategories,
        availableCategories,
        stats,
        missingByColor,
        incompleteCategories,
        colorData
    } = useDashboardStats();

    return (
        <div className="page-container">
            <div className="section-header">
                <span className="section-label">
                    Field Analytics
                </span>
                <h2 className="section-title">數據儀表板
                    <p className="section-desc">/ 收藏進度總覽</p>
                </h2>

            </div>

            <DashboardControls
                filterType={filterType}
                setFilterType={setFilterType}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                availableCategories={availableCategories}
            />

            <div className="section-stack">
                <div className="dashboard-section-flat dashboard-priority-panel animate-[float_0.5s_ease-out]">
                    <div className="mb-6 border-b border-stone-100/70 pb-4 flex items-end justify-between px-2">
                        <div>
                            <span className="block text-xs font-black text-brand-primary/70 uppercase tracking-widest mb-1">Primary Signal</span>
                            <h3 className="text-2xl font-black text-stone-800 tracking-tight">總體進度</h3>
                            <p className="text-sm text-stone-500 font-semibold mt-1">先掌握整體，再決定下一步補齊策略</p>
                        </div>
                    </div>

                    <DashboardStats stats={stats} />
                </div>

                <div className="dashboard-section-flat dashboard-secondary-panel animate-[float_0.6s_ease-out_0.2s_both]">
                    <div className="mb-8 border-b border-stone-100/70 pb-4 flex items-end justify-between px-2">
                        <div>
                            <span className="block text-xs font-black text-stone-500 uppercase tracking-widest mb-1">Distribution</span>
                            <h3 className="text-2xl font-black text-stone-800 tracking-tight">皮克敏顏色分布分析</h3>
                        </div>
                    </div>
                    <DashboardCharts
                        colorData={colorData}
                        missingByColor={missingByColor}
                        transparent={true}
                    />
                </div>
                

                <IncompleteList incompleteCategories={incompleteCategories} />
                <div className="text-center text-sm text-lime-900/40 font-bold pb-10 mt-2">
                    總計裝飾品項: {stats.total}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
