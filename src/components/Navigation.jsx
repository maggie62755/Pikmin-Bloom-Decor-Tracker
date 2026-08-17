import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogIn, Home, List as ListIcon, BarChart2, Globe } from 'lucide-react';
import { usePikmin } from '../context/PikminContext';
import { useTranslation } from '../i18n';

import logo from '../assets/logo.svg';
import UserProfile from './UserProfile';

const NAV_ITEMS = [
    { to: "/", icon: Home, labelKey: "nav.home" },
    { to: "/tracker", icon: ListIcon, labelKey: "nav.tracker" },
    { to: "/dashboard", icon: BarChart2, labelKey: "nav.dashboard" },
];

const Navigation = () => {
    const { t, language, setLanguage, languages } = useTranslation();
    const {
        user, login, logout,
        saveToSheet, loadFromSheet, syncStatus, hasUnsavedChanges,
        calculateTotalProgress, lastSyncAt
    } = usePikmin();
    const location = useLocation();
    const [showLangMenu, setShowLangMenu] = useState(false);

    const { collected: totalCollected, total: grandTotal } = calculateTotalProgress();

    const toggleLanguage = () => {
        const nextLang = language === 'zh-TW' ? 'en' : 'zh-TW';
        setLanguage(nextLang);
    };

    return (
        <>
            {/* ====== Desktop Top Navigation (md+) ====== */}
            <header className="hidden md:block fixed top-6 left-4 right-4 z-50 pointer-events-none">
                <div className="max-w-7xl mx-auto glass-panel rounded-[2rem] pointer-events-auto relative">
                    {/* Main Header Bar */}
                    <div className="px-6 h-20 flex items-center justify-between relative z-20">

                        {/* Left: Logo */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <img src={logo} alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
                            <div className="flex flex-col leading-none">
                                <h1 className="text-lg font-display font-bold bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent truncate tracking-tight">
                                    Pikmin Bloom
                                </h1>
                                <span className="text-[10px] font-bold text-journal-muted tracking-[0.2em] uppercase">
                                    Decor Tracker
                                </span>
                            </div>
                        </div>

                        {/* Center: Desktop Nav */}
                        <nav className="flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            {NAV_ITEMS.map((item) => (
                                <DesktopNavTab key={item.to} {...item} label={t(item.labelKey)} />
                            ))}
                        </nav>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                            {/* Language Toggle */}
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-journal-muted hover:bg-white/50 hover:text-journal-ink transition-all"
                                aria-label={t('common.language')}
                                title={t('common.language')}
                            >
                                <Globe size={14} />
                                <span>{language === 'zh-TW' ? '中' : 'EN'}</span>
                            </button>

                            {!user ? (
                                <button
                                    onClick={() => login()}
                                    className="flex items-center gap-1 px-4 py-2 bg-brand-primary text-white rounded-full text-sm font-bold hover:brightness-110 transition-all shadow-md shadow-brand-primary/20 active:scale-95"
                                    aria-label={t('sync.login_aria')}
                                >
                                    <span>{t('sync.login')}</span> <LogIn size={16} />
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className={`flex items-center gap-2 text-[11px] font-extrabold px-3 py-1.5 rounded-full border ${hasUnsavedChanges ? 'bg-amber-50 text-amber-700 border-amber-200' : syncStatus === 'syncing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                        <span className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-amber-500' : syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                                        {hasUnsavedChanges ? t('sync.unsaved') : syncStatus === 'syncing' ? t('sync.syncing') : t('sync.synced')}
                                        {lastSyncAt ? <span className="text-journal-muted font-bold">| {new Date(lastSyncAt).toLocaleDateString()}</span> : null}
                                    </div>
                                    <UserProfile
                                        user={user}
                                        syncStatus={syncStatus}
                                        hasUnsavedChanges={hasUnsavedChanges}
                                        lastSyncAt={lastSyncAt}
                                        onSave={() => saveToSheet()}
                                        onLoad={loadFromSheet}
                                        onLogout={logout}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-journal-line/30 overflow-hidden border-t border-white/10 rounded-b-[2rem]">
                        <div
                            className="h-full bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary transition-all duration-1000 ease-out"
                            style={{ width: `${grandTotal > 0 ? (totalCollected / grandTotal) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            </header>

            {/* ====== Mobile Top Bar (< md) ====== */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50">
                <div className="flex items-center justify-between px-4 py-3 bg-journal-paper/90 backdrop-blur-xl border-b border-journal-line/50">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                        <span className="text-sm font-display font-bold text-journal-ink">Pikmin Bloom</span>
                    </div>

                    {/* Right: Language + User */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-bold text-journal-muted hover:bg-white/50 transition-all"
                            aria-label={t('common.language')}
                        >
                            <Globe size={14} />
                            <span>{language === 'zh-TW' ? '中' : 'EN'}</span>
                        </button>

                        {!user ? (
                            <button
                                onClick={() => login()}
                                className="flex items-center gap-1 px-3 py-1.5 bg-brand-primary text-white rounded-full text-xs font-bold active:scale-95 transition-all"
                                aria-label={t('sync.login_aria')}
                            >
                                <LogIn size={14} />
                            </button>
                        ) : (
                            <UserProfile
                                user={user}
                                syncStatus={syncStatus}
                                hasUnsavedChanges={hasUnsavedChanges}
                                lastSyncAt={lastSyncAt}
                                onSave={() => saveToSheet()}
                                onLoad={loadFromSheet}
                                onLogout={logout}
                            />
                        )}
                    </div>
                </div>

                {/* Mobile Progress Bar */}
                <div className="h-0.5 bg-journal-line/20">
                    <div
                        className="h-full bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary transition-all duration-1000 ease-out"
                        style={{ width: `${grandTotal > 0 ? (totalCollected / grandTotal) * 100 : 0}%` }}
                    />
                </div>
            </header>

            {/* ====== Mobile Bottom Tab Bar (< md) ====== */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-journal-paper/95 backdrop-blur-xl border-t border-journal-line/50 safe-bottom">
                <div className="flex items-center justify-around px-2 py-0.5">
                    {NAV_ITEMS.map((item) => (
                        <MobileTabItem key={item.to} {...item} label={t(item.labelKey)} />
                    ))}
                </div>
            </nav>
        </>
    );
};

// Desktop nav tab with shimmer effect
const DesktopNavTab = ({ to, icon, label }) => (
    <NavLink
        to={to}
        aria-label={label}
        end={to === '/'}
        className={({ isActive }) => `
            relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-display font-bold transition-all duration-300 overflow-hidden group
            ${isActive
                ? 'bg-white text-brand-primary shadow-sm scale-110 ring-2 ring-white/50'
                : 'text-journal-muted hover:text-journal-ink hover:bg-white/40'}
        `}
    >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        {React.createElement(icon, { size: 18, className: 'relative z-10' })}
        <span className="hidden lg:inline relative z-10">{label}</span>
    </NavLink>
);

// Mobile bottom tab item
const MobileTabItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) => `
            flex flex-col items-center gap-0 px-2.5 py-1 rounded-2xl transition-all min-w-[3.5rem]
            ${isActive
                ? 'text-brand-primary'
                : 'text-journal-muted'}
        `}
    >
        {({ isActive }) => (
            <>
                <div className={`p-1 rounded-full transition-all ${isActive ? 'bg-brand-primary/10' : ''}`}>
                    {React.createElement(icon, { size: 18, strokeWidth: isActive ? 2.5 : 2 })}
                </div>
                <span className="text-[9px] font-bold leading-none">{label}</span>
            </>
        )}
    </NavLink>
);

export default Navigation;
