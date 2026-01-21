import React from 'react';
import { DECOR_STATUS } from '../../constants';

const StatCard = ({ value, label, color }) => (
    <div className="soft-card p-6 text-center group flex flex-col items-center justify-center">
        <div className={`stat-card-value ${color}`}>
            {value}
        </div>
        <div className="stat-card-label">{label}</div>
    </div>
);

const DashboardStats = ({ stats, className = "stats-grid" }) => {
    return (
        <div className={className}>
            <StatCard
                value={stats[DECOR_STATUS.COLLECTED]}
                label="已收藏"
                color="text-brand-primary"
            />
            <StatCard
                value={stats[DECOR_STATUS.GROWING]}
                label="成長中"
                color="text-brand-secondary"
            />
            <StatCard
                value={stats[DECOR_STATUS.SEEDLING]}
                label="大苗"
                color="text-brand-accent"
            />
            <StatCard
                value={stats[DECOR_STATUS.NOT_COLLECTED]}
                label="未獲得"
                color="text-stone-300"
            />
        </div>
    );
};

export default DashboardStats;
