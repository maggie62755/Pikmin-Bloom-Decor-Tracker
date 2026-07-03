import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { DECOR_STATUS, DECOR_STATUS_KEYS } from '../../constants';
import { COLORS } from '../../theme/colors';
import { useTranslation } from '../../i18n';
import StatusIcon from '../shared/StatusIcon';
import ChartTooltip from './ChartTooltip';

// --- Sub-component: StatCard ---
const StatCard = ({ value, label, color, status, isActive, onHover, isDimmed }) => (
    <div
        className={`dashboard-stat-tile p-4 text-center group flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300
            ${isActive ? 'scale-[1.05] shadow-xl bg-white' : ''}
            ${isDimmed ? 'opacity-40 grayscale-[0.5] scale-95' : 'hover:scale-[1.02]'}
        `}
        onMouseEnter={() => onHover(status)}
        onMouseLeave={() => onHover(null)}
    >
        <div className="absolute top-2 right-2 p-2 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 group-hover:scale-125">
            <StatusIcon status={status} size={80} />
        </div>

        <div className={`stat-card-value font-mono ${color} relative z-10`}>
            {value}
        </div>
        <div className="text-sm font-semibold text-journal-muted uppercase tracking-wider relative z-10">{label}</div>
    </div>
);

// --- Sub-component: DonutChart (Internal) ---
const DonutChartSection = ({ stats, transparent = true, hoveredStatus, onHover }) => {
    const { t } = useTranslation();
    const chartWrapperRef = React.useRef(null);
    const [chartSize, setChartSize] = React.useState({ width: 0, height: 0 });
    
    // Construct data from stats for the chart
    const data = [
        { name: t(`status.${DECOR_STATUS_KEYS[DECOR_STATUS.COLLECTED]}`), value: stats[DECOR_STATUS.COLLECTED], color: COLORS.status.collected, status: DECOR_STATUS.COLLECTED },
        { name: t(`status.${DECOR_STATUS_KEYS[DECOR_STATUS.GROWING]}`), value: stats[DECOR_STATUS.GROWING], color: COLORS.status.growing, status: DECOR_STATUS.GROWING },
        { name: t(`status.${DECOR_STATUS_KEYS[DECOR_STATUS.SEEDLING]}`), value: stats[DECOR_STATUS.SEEDLING], color: COLORS.status.seedling, status: DECOR_STATUS.SEEDLING },
        { name: t(`status.${DECOR_STATUS_KEYS[DECOR_STATUS.NOT_COLLECTED]}`), value: stats[DECOR_STATUS.NOT_COLLECTED], color: COLORS.status.missing, status: DECOR_STATUS.NOT_COLLECTED },
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const collectedItem = data.find(d => d.status === DECOR_STATUS.COLLECTED);

    // Determine which item is highlighted (for center text)
    const activeItem = data.find(d => d.status === hoveredStatus);
    const displayPercentage = activeItem
        ? (total > 0 ? Math.round((activeItem.value / total) * 100) : 0)
        : (total > 0 ? Math.round(((collectedItem?.value || 0) / total) * 100) : 0);

    const displayLabel = activeItem ? activeItem.name : t('dashboard.overall_progress');

    // Inject totalValue into data for tooltip
    const chartData = data.map(item => ({ ...item, totalValue: total }));

    React.useEffect(() => {
        const node = chartWrapperRef.current;
        if (!node) return undefined;

        const updateSize = () => {
            const rect = node.getBoundingClientRect();
            setChartSize({
                width: Math.max(0, Math.floor(rect.width)),
                height: Math.max(0, Math.floor(rect.height)),
            });
        };

        updateSize();

        if (typeof ResizeObserver === 'undefined') {
            return undefined;
        }

        const observer = new ResizeObserver(updateSize);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const isChartReady = chartSize.width > 0 && chartSize.height > 0;

    return (
        <div className={`flex flex-col w-full aspect-square lg:aspect-auto lg:h-full lg:min-h-[400px] max-w-md mx-auto ${transparent ? '' : 'chart-panel bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 shadow-sm border border-journal-line'}`}>
            <div ref={chartWrapperRef} className="flex-1 relative min-h-[280px]">
                {/* Center Label */}
                <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-all duration-300">
                    <div className="flex flex-col items-center">
                        <span className={`text-4xl font-mono font-bold tabular-nums transition-colors duration-300 ${activeItem ? 'text-brand-primary scale-110' : 'text-journal-ink'}`}>
                            {displayPercentage}%
                        </span>
                        <span className="text-[10px] font-bold text-journal-muted tracking-[0.2em] uppercase mt-1">
                            {displayLabel}
                        </span>
                    </div>
                </div>

                {isChartReady ? (
                    <PieChart width={chartSize.width} height={chartSize.height}>
                        <Tooltip
                            content={<ChartTooltip />}
                            cursor={false}
                            wrapperStyle={{ outline: 'none' }}
                        />
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius="65%"
                            outerRadius="90%"
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={8}
                            animationDuration={400}
                        >
                            {chartData.map((entry, index) => {
                                const isHovered = hoveredStatus === entry.status;
                                const isDimmed = hoveredStatus !== null && !isHovered;

                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        className="transition-all duration-300 cursor-pointer"
                                        style={{
                                            opacity: isDimmed ? 0.3 : 1,
                                            filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : 'none',
                                            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                            transformOrigin: 'center center',
                                        }}
                                        onMouseEnter={() => onHover(entry.status)}
                                        onMouseLeave={() => onHover(null)}
                                    />
                                );
                            })}
                        </Pie>
                    </PieChart>
                ) : null}
            </div>
        </div>
    );
};

const DashboardStats = ({ stats, className }) => {
    const { t } = useTranslation();
    const [hoveredStatus, setHoveredStatus] = React.useState(null);

    // This component now manages the entire top row layout: [ DonutChart | StatsGrid ]
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-6 items-center h-full">
            {/* Left: Chart */}
            <DonutChartSection
                stats={stats}
                hoveredStatus={hoveredStatus}
                onHover={setHoveredStatus}
            />

            {/* Right: Stats Grid */}
            <div className="grid grid-cols-2 gap-3 h-full">
                <StatCard
                    value={stats[DECOR_STATUS.COLLECTED]}
                    label={t(`status.${DECOR_STATUS_KEYS[DECOR_STATUS.COLLECTED]}`)}
                    color="text-brand-primary"
                    status={DECOR_STATUS.COLLECTED}
                    isActive={hoveredStatus === DECOR_STATUS.COLLECTED}
                    isDimmed={hoveredStatus !== null && hoveredStatus !== DECOR_STATUS.COLLECTED}
                    onHover={setHoveredStatus}
                />
                <StatCard
                    value={stats[DECOR_STATUS.GROWING]}
                    label={t(`status.${DECOR_STATUS_KEYS[DECOR_STATUS.GROWING]}`)}
                    color="text-brand-secondary"
                    status={DECOR_STATUS.GROWING}
                    isActive={hoveredStatus === DECOR_STATUS.GROWING}
                    isDimmed={hoveredStatus !== null && hoveredStatus !== DECOR_STATUS.GROWING}
                    onHover={setHoveredStatus}
                />
                <StatCard
                    value={stats[DECOR_STATUS.SEEDLING]}
                    label={t(`status.${DECOR_STATUS_KEYS[DECOR_STATUS.SEEDLING]}`)}
                    color="text-brand-accent"
                    status={DECOR_STATUS.SEEDLING}
                    isActive={hoveredStatus === DECOR_STATUS.SEEDLING}
                    isDimmed={hoveredStatus !== null && hoveredStatus !== DECOR_STATUS.SEEDLING}
                    onHover={setHoveredStatus}
                />
                <StatCard
                    value={stats[DECOR_STATUS.NOT_COLLECTED]}
                    label={t(`status.${DECOR_STATUS_KEYS[DECOR_STATUS.NOT_COLLECTED]}`)}
                    color="text-journal-muted/60"
                    status={DECOR_STATUS.NOT_COLLECTED}
                    isActive={hoveredStatus === DECOR_STATUS.NOT_COLLECTED}
                    isDimmed={hoveredStatus !== null && hoveredStatus !== DECOR_STATUS.NOT_COLLECTED}
                    onHover={setHoveredStatus}
                />
            </div>
        </div>
    );
};

export default DashboardStats;
