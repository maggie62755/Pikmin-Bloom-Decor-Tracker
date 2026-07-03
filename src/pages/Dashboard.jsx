import React from 'react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useTranslation } from '../i18n';
import './Dashboard.css';

// Sub-components
import DashboardControls from '../components/dashboard/DashboardControls';
import DashboardStats from '../components/dashboard/DashboardStats';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import IncompleteList from '../components/dashboard/IncompleteList';

const Dashboard = () => {
    const { t } = useTranslation();
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
                    {t('dashboard.label')}
                </span>
                <h2 className="section-title">{t('dashboard.title')}
                    <p className="section-desc">/ {t('dashboard.subtitle')}</p>
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
                <div className="dashboard-section-flat dashboard-priority-panel animate-[fade-in-up]">
                    <div className="mb-6 border-b border-journal-line/70 pb-4 flex items-end justify-between px-2">
                        <div>
                            <span className="block text-xs font-display font-bold text-brand-primary/80 uppercase tracking-widest mb-1">{t('dashboard.primary_signal')}</span>
                            <h3 className="text-2xl font-display font-bold text-journal-ink tracking-tight">{t('dashboard.overall_progress')}</h3>
                            <p className="text-sm text-journal-muted font-semibold mt-1">{t('dashboard.overall_desc')}</p>
                        </div>
                    </div>

                    <DashboardStats stats={stats} />
                </div>

                <div className="dashboard-section-flat dashboard-secondary-panel animate-[fade-in-up]">
                    <div className="mb-8 border-b border-journal-line/70 pb-4 flex items-end justify-between px-2">
                        <div>
                            <span className="block text-xs font-display font-bold text-journal-muted uppercase tracking-widest mb-1">{t('dashboard.distribution')}</span>
                            <h3 className="text-2xl font-display font-bold text-journal-ink tracking-tight">{t('dashboard.color_analysis')}</h3>
                        </div>
                    </div>
                    <DashboardCharts
                        colorData={colorData}
                        missingByColor={missingByColor}
                        transparent={true}
                    />
                </div>
                

                <IncompleteList incompleteCategories={incompleteCategories} />
                <div className="text-center text-sm text-journal-muted/40 font-display font-bold pb-10 mt-2">
                    {t('dashboard.total_items')}: {stats.total}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
