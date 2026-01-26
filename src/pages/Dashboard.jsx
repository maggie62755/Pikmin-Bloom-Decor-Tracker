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
        statusData,
        colorData
    } = useDashboardStats();

    return (
        <div className="page-container">
            <div className="section-header">
                <span className="section-label">
                    Overview
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

            {/* Top Row: Overview (Donut + Stats) */}
            <div className="dashboard-section-glass animate-[float_0.5s_ease-out]">
                <div className="mb-6 border-b border-stone-100 pb-4 flex items-end justify-between px-2">
                    <div>
                        <span className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Progress</span>
                        <h3 className="text-2xl font-black text-stone-800 tracking-tight">總體進度</h3>
                    </div>
                </div>

                <DashboardStats stats={stats} />
            </div>

            {/* Bottom Row: Detailed Analysis (Bar Charts) */}
            <div className="dashboard-section-glass animate-[float_0.6s_ease-out_0.2s_both]">
                <div className="mb-8 border-b border-stone-100 pb-4 flex items-end justify-between px-2">
                    <div>
                        <span className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Color Analytics</span>
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

            <div className="text-center text-sm text-lime-900/40 font-bold pb-10 mt-12">
                總計裝飾品項: {stats.total}
            </div>
        </div>
    );
};

export default Dashboard;
