import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sprout, Heart, LayoutGrid, List, BarChart2 } from 'lucide-react';
import { DECOR_STATUS, DECOR_STATUS_LABELS } from '../constants';
import { COLORS } from '../theme/colors';
import StatusIcon from '../components/shared/StatusIcon';

const Home = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-16">
            {/* Hero Section */}
            <section className="text-center space-y-8 py-16 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-stone-200/20 blur-3xl -z-10 rounded-full" />
                <h1 className="text-6xl font-black text-stone-900 tracking-tight leading-tight">
                    Pikmin <span className="text-brand-primary">Bloom</span> <br />
                    <span className="text-4xl text-stone-400 font-bold">Decor Tracker</span>
                </h1>
                <p className="text-xl text-stone-600/80 max-w-xl mx-auto font-bold">
                    輕鬆追蹤你的皮克敏裝飾收藏，<br />紀錄每一步與花開的時刻。
                </p>
                <div className="flex justify-center gap-6">
                    <NavLink to="/tracker" className="btn-primary flex items-center gap-2">
                        <LayoutGrid size={20} /> 開始追蹤
                    </NavLink>
                    <NavLink to="/dashboard" className="btn-secondary flex items-center gap-2">
                        <BarChart2 size={20} /> 查看數據
                    </NavLink>
                </div>
            </section>


            {/* Status Guide */}
            <section className="glass-panel rounded-5xl p-10 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-accent/5 rounded-full blur-2xl" />
                <h2 className="text-2xl font-black text-stone-800 text-center mb-10">收藏狀態指南</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Not Collected */}
                    <StatusItem
                        color="bg-stone-100"
                        label={DECOR_STATUS_LABELS[DECOR_STATUS.NOT_COLLECTED]}
                        // icon={<div className="w-10 h-10 rounded-full border-4 border-dashed border-stone-200" />}
                        icon={<StatusIcon status={DECOR_STATUS.NOT_COLLECTED} size={40} />}
                    />
                    {/* Seedling */}
                    <StatusItem
                        // color="bg-amber-50 border-2 border-amber-100"
                        label={DECOR_STATUS_LABELS[DECOR_STATUS.SEEDLING]}
                        // icon={<Sprout className="w-8 h-8 text-amber-600" />}
                        icon={<StatusIcon status={DECOR_STATUS.SEEDLING} size={40} />}
                    />
                    {/* Growing */}
                    <StatusItem
                        // color="bg-pink-50 border-2 border-pink-100"
                        label={DECOR_STATUS_LABELS[DECOR_STATUS.GROWING]}
                        // icon={<Heart className="w-8 h-8 text-pink-500 animate-pulse" />}
                        icon={<StatusIcon status={DECOR_STATUS.GROWING} size={40} />}
                    />
                    {/* Collected */}
                    <StatusItem
                        // color="bg-brand-primary shadow-lg shadow-brand-primary/10"
                        label={DECOR_STATUS_LABELS[DECOR_STATUS.COLLECTED]}
                        // icon={<div className="w-6 h-6 bg-white rounded-full shadow-inner" />}
                        icon={<StatusIcon status={DECOR_STATUS.COLLECTED} size={40} />}
                    />
                </div>
            </section>


            {/* Features */}
            <section className="grid md:grid-cols-3 gap-8 pb-10">
                <FeatureCard
                    icon={<LayoutGrid className="text-brand-secondary" />}
                    title="多樣化視圖"
                    desc="在網格與列表視圖間輕鬆切換，管理你的裝飾皮克敏。"
                    bg="bg-stone-50/50"
                />
                <FeatureCard
                    icon={<Sprout className="text-brand-primary" />}
                    title="成長管理"
                    desc="追蹤從大苗到成長完畢的完整過程，保持收藏井然有序。"
                    bg="bg-stone-50/50"
                />
                <FeatureCard
                    icon={<List className="text-brand-accent" />}
                    title="雲端同步"
                    desc="同步至私人的 Google 試算表，不再擔心數據丟失。"
                    bg="bg-stone-50/50"
                />
            </section>

        </div>
    );
};

const StatusItem = ({ color, label, icon }) => (
    <div className="flex flex-col items-center gap-4 group cursor-default">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
            {icon}
        </div>
        <span className="font-bold text-lime-900/70">{label}</span>
    </div>
);

const FeatureCard = ({ icon, title, desc, bg }) => (
    <div className={`soft-card p-8 group ${bg}`}>
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
            {React.cloneElement(icon, { size: 28 })}
        </div>
        <h3 className="text-xl font-black text-lime-950 mb-3">{title}</h3>
        <p className="text-lime-900/60 leading-relaxed font-medium">
            {desc}
        </p>
    </div>
);


export default Home;
