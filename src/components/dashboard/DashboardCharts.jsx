import PikminStatChart from './PikminStatChart';
import { useTranslation } from '../../i18n';

const DashboardCharts = ({ colorData, missingByColor, transparent = false }) => {
    const { t } = useTranslation();
    return (
        <div className="charts-grid">

            {/* 1. 已收藏分佈 */}
            <PikminStatChart
                data={colorData}
                title={t('dashboard.collected_distribution')}
                subtitle="COLLECTED BY COLOR"
                transparent={transparent}
            />

            <PikminStatChart
                data={missingByColor}
                title={t('dashboard.missing_distribution')}
                subtitle="MISSING BY COLOR"
                transparent={transparent}
            />

        </div>
    );
};

export default DashboardCharts;
