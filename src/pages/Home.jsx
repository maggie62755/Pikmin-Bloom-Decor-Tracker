import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sprout, LayoutGrid, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import { DECOR_CATEGORIES, DECOR_STATUS } from '../constants';
import { usePikmin } from '../context/PikminContext';
import { useTranslation, getLocalizedName } from '../i18n';
import StatusIcon from '../components/shared/StatusIcon';

const Home = () => {
    const { t, language } = useTranslation();
    const { calculateTotalProgress, calculateProgress, collection } = usePikmin();
    const navigate = useNavigate();
    const [showGuide, setShowGuide] = useState(() => !localStorage.getItem('home-guide-seen'));

    const { collected: totalCollected, total: grandTotal } = calculateTotalProgress();
    const progressPercent = grandTotal > 0 ? Math.round((totalCollected / grandTotal) * 100) : 0;

    // 取得前 8 個分類的快速進度
    const topCategories = DECOR_CATEGORIES.slice(0, 8).map(cat => {
        const { collected, total } = calculateProgress(cat);
        return { ...cat, collected, total };
    });

    const handleCategoryClick = (categoryId) => {
        navigate('/tracker', { state: { openCategoryId: categoryId } });
    };

    const dismissGuide = () => {
        localStorage.setItem('home-guide-seen', '1');
        setShowGuide(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 md:space-y-16">
            {/* ===== Hero Section ===== */}
            <section className="text-center space-y-6 py-8 md:py-16 relative">
                {/* 背景光暈 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-primary/5 blur-3xl -z-10 rounded-full" />

                {/* 標題 */}
                <h1 className="text-5xl md:text-6xl font-display font-bold text-journal-ink tracking-tight leading-tight">
                    Pikmin <span className="text-brand-primary">Bloom</span>
                    <br />
                    <span className="text-3xl md:text-4xl text-journal-muted font-display font-medium">
                        {t('home.hero_title_2')}
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-journal-muted max-w-xl mx-auto font-semibold whitespace-pre-line">
                    {t('home.hero_desc')}
                </p>

                {/* ===== 進度概覽卡片 ===== */}
                <div className="max-w-sm mx-auto glass-panel rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-journal-muted uppercase tracking-widest">
                            {t('home.progress_title')}
                        </span>
                        <span className="text-xs font-mono font-bold text-brand-primary">
                            {progressPercent}%
                        </span>
                    </div>

                    {/* 進度環 */}
                    <div className="flex items-center justify-center">
                        <div className="relative w-32 h-32">
                            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                                {/* 背景圓 */}
                                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--journal-line, #E8E3D8)" strokeWidth="8" />
                                {/* 進度圓 */}
                                <circle
                                    cx="60" cy="60" r="52" fill="none"
                                    stroke="var(--brand-primary, #4A8C3F)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 52}`}
                                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - progressPercent / 100)}`}
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-mono font-bold text-journal-ink">{totalCollected}</span>
                                <span className="text-xs text-journal-muted font-semibold">/ {grandTotal}</span>
                            </div>
                        </div>
                    </div>

                    {/* CTA 按鈕 */}
                    <div className="flex gap-3">
                        <NavLink to="/tracker" className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                            <LayoutGrid size={18} /> {t('home.cta_tracker')}
                        </NavLink>
                        <NavLink to="/dashboard" className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                            <BarChart2 size={18} /> {t('home.cta_dashboard')}
                        </NavLink>
                    </div>
                </div>
            </section>

            {/* ===== 快速分類入口 ===== */}
            <section>
                <h2 className="text-sm font-display font-bold text-journal-muted uppercase tracking-widest mb-4 px-1">
                    {t('home.quick_categories')}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {topCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            className="soft-card p-4 text-left group cursor-pointer"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                {cat.icon && (
                                    <div
                                        className="category-icon w-5 h-5 flex-shrink-0"
                                        style={{
                                            WebkitMaskImage: `url(${import.meta.env.BASE_URL}images/icons/${cat.icon})`,
                                            maskImage: `url(${import.meta.env.BASE_URL}images/icons/${cat.icon})`
                                        }}
                                    />
                                )}
                                <span className="text-sm font-bold text-journal-ink truncate">
                                    {getLocalizedName(cat, language)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-journal-line rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-primary rounded-full transition-all duration-500"
                                        style={{ width: `${cat.total > 0 ? (cat.collected / cat.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <span className="text-xs font-mono font-bold text-journal-muted">
                                    {cat.collected}/{cat.total}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* ===== 收藏狀態指南（可折疊） ===== */}
            <section>
                <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="w-full flex items-center justify-between px-1 mb-4 group"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-grow bg-journal-line w-8" />
                        <h2 className="text-sm font-display font-bold text-journal-muted uppercase tracking-widest">
                            {t('home.status_guide')}
                        </h2>
                    </div>
                    {showGuide ?
                        <ChevronUp size={18} className="text-journal-muted" /> :
                        <ChevronDown size={18} className="text-journal-muted" />
                    }
                </button>

                <div className={`overflow-hidden transition-all duration-400 ${showGuide ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="glass-panel rounded-3xl p-6 md:p-10 space-y-8">
                        {/* 狀態指南 */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatusItem label={t('status.not_collected')} status={DECOR_STATUS.NOT_COLLECTED} />
                            <StatusItem label={t('status.seedling')} status={DECOR_STATUS.SEEDLING} />
                            <StatusItem label={t('status.growing')} status={DECOR_STATUS.GROWING} />
                            <StatusItem label={t('status.collected')} status={DECOR_STATUS.COLLECTED} />
                        </div>

                        {/* 操作說明 */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-journal-surface/80 p-5 rounded-2xl space-y-3">
                                <div className="flex items-center gap-3 border-b border-journal-line/50 pb-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <Sprout size={20} />
                                    </div>
                                    <h3 className="font-display font-bold text-journal-ink">{t('home.card_interaction')}</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex gap-3 items-start">
                                        <span className="bg-journal-line/50 px-2 py-0.5 rounded text-xs font-bold text-journal-muted whitespace-nowrap">{t('home.click_action')}</span>
                                        <p className="text-journal-muted font-medium">{t('home.click_desc')}</p>
                                    </div>
                                    <div className="flex gap-3 items-start">
                                        <span className="bg-journal-line/50 px-2 py-0.5 rounded text-xs font-bold text-journal-muted whitespace-nowrap">{t('home.longpress_action')}</span>
                                        <p className="text-journal-muted font-medium">{t('home.longpress_desc')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-journal-surface/80 p-5 rounded-2xl space-y-3">
                                <div className="flex items-center gap-3 border-b border-journal-line/50 pb-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                                        <BarChart2 size={20} />
                                    </div>
                                    <h3 className="font-display font-bold text-journal-ink">{t('home.sync_title')}</h3>
                                </div>
                                <p className="text-sm text-journal-muted font-medium">{t('home.sync_desc')}</p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-journal-muted bg-journal-line/20 p-3 rounded-xl font-medium">
                                    <li>{t('home.sync_tip_1')}</li>
                                    <li>{t('home.sync_tip_2')}</li>
                                    <li>{t('home.sync_tip_3')}</li>
                                </ul>
                            </div>
                        </div>

                        {/* 隱藏指南按鈕 */}
                        <div className="text-center">
                            <button
                                onClick={dismissGuide}
                                className="text-xs font-bold text-journal-muted hover:text-brand-primary transition-colors"
                            >
                                {t('home.got_it_hide')}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const StatusItem = ({ label, status }) => (
    <div className="flex flex-col items-center gap-3 group cursor-default">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 bg-journal-surface">
            <StatusIcon status={status} size={32} />
        </div>
        <span className="text-sm font-bold text-journal-ink/85 text-center">{label}</span>
    </div>
);

export default Home;
