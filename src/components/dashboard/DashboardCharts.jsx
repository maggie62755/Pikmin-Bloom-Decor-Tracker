import PikminStatChart from './PikminStatChart';

const DashboardCharts = ({ colorData, missingByColor, transparent = false }) => {
    return (
        <div className="charts-grid">

            {/* 1. 已收藏分佈 */}
            <PikminStatChart
                data={colorData}
                title="皮克敏色系分佈 (已收藏)"
                transparent={transparent}
            />

            <PikminStatChart
                data={missingByColor}
                title="缺少的皮克敏 (按顏色)"
                transparent={transparent}
            />

        </div>
    );
};

export default DashboardCharts;
