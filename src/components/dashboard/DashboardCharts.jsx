import PikminStatChart from './PikminStatChart';

const DashboardCharts = ({ colorData, missingByColor, transparent = false }) => {
    return (
        <div className="charts-grid">

            {/* 1. 已收藏分佈 */}
            <PikminStatChart
                data={colorData}
                title="已收藏分佈"
                subtitle="COLLECTED BY COLOR"
                transparent={transparent}
            />

            <PikminStatChart
                data={missingByColor}
                title="缺漏分佈"
                subtitle="MISSING BY COLOR"
                transparent={transparent}
            />

        </div>
    );
};

export default DashboardCharts;
