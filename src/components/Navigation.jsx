import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogIn, Home, List as ListIcon, BarChart2, Menu, X, Leaf } from 'lucide-react';
import { usePikmin } from '../context/PikminContext';

import logo from '../assets/logo.png';

import UserProfile from './UserProfile';

const NAV_ITEMS = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/tracker", icon: ListIcon, label: "Tracker" },
    { to: "/decision-helper", icon: Leaf, label: "Advisor" },
    { to: "/dashboard", icon: BarChart2, label: "Stats" },
];

const Navigation = () => {
    const {
        user, login, logout,
        saveToSheet, loadFromSheet, syncStatus, hasUnsavedChanges,
        calculateTotalProgress, lastSyncAt
    } = usePikmin();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    // Close menu when route changes
    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    const { collected: totalCollected, total: grandTotal } = calculateTotalProgress();

    return (
        <header className="fixed top-6 left-4 right-4 z-50 pointer-events-none">
            <div className={`max-w-7xl mx-auto glass-panel rounded-[2rem] transition-all duration-300 pointer-events-auto relative ${isMenuOpen ? 'bg-white/90 backdrop-blur-xl' : ''}`}>

                {/* Main Header Bar */}
                <div className="px-2 sm:px-6 h-18 sm:h-20 flex items-center justify-between relative z-20">

                    {/* Left: Logo */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <img src={logo} alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
                        <div className="flex flex-col leading-none">
                            <h1 className="text-lg font-black bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent truncate hidden md:block tracking-tight">
                                Pikmin Bloom
                            </h1>
                            <span className="text-[10px] font-bold text-stone-400 tracking-[0.2em] uppercase hidden md:block">
                                Decor Tracker
                            </span>
                        </div>
                    </div>

                    {/* Center: Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        {NAV_ITEMS.map((item) => (
                            <NavTab key={item.to} {...item} />
                        ))}
                    </nav>

                    {/* Right: Actions & Mobile Toggle */}
                    <div className="flex items-center justify-end gap-2">
                        {/* Desktop/Tablet Actions */}
                        <div className="flex items-center gap-2">
                            {!user ? (
                                <button
                                    onClick={() => login()}
                                    className="flex items-center gap-1 px-4 py-2 bg-brand-primary text-white rounded-full text-sm font-bold hover:brightness-110 transition-all shadow-md shadow-stone-200 active:scale-95"
                                    aria-label="使用 Google 帳號登入"
                                >
                                    <span className="hidden sm:inline">Login</span> <LogIn size={16} />
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className={`hidden lg:flex items-center gap-2 text-[11px] font-extrabold px-3 py-1.5 rounded-full border ${hasUnsavedChanges ? 'bg-amber-50 text-amber-700 border-amber-200' : syncStatus === 'syncing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                        <span className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-amber-500' : syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                                        {hasUnsavedChanges ? '未同步' : syncStatus === 'syncing' ? '同步中' : '已同步'}
                                        {lastSyncAt ? <span className="text-stone-500 font-bold">| {new Date(lastSyncAt).toLocaleDateString()}</span> : null}
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

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                            aria-label={isMenuOpen ? '關閉導覽選單' : '開啟導覽選單'}
                            aria-expanded={isMenuOpen}
                            aria-controls="mobile-nav-menu"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <div
                    id="mobile-nav-menu"
                    className={`
                    md:hidden overflow-hidden transition-all duration-300 ease-in-out
                    ${isMenuOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'}
                `}
                >
                    <div className="px-4 flex flex-col gap-2">
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold
                                    ${isActive
                                        ? 'bg-brand-primary/10 text-brand-primary'
                                        : 'text-stone-500 hover:bg-stone-100'}
                                `}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-200/30 backdrop-blur-sm overflow-hidden border-t border-white/10 rounded-b-[2rem]">
                    <div
                        className="h-full bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary transition-all duration-1000 ease-out"
                        style={{ width: `${(totalCollected / grandTotal) * 100}%` }}
                    />
                </div>

            </div>
        </header>
    );
};

const NavTab = ({ to, icon, label }) => (
    <NavLink
        to={to}
        aria-label={label}
        className={({ isActive }) => `
            relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-black transition-all duration-300 overflow-hidden group
            ${isActive
                ? 'bg-white text-brand-primary shadow-sm scale-110 ring-2 ring-white/50'
                : 'text-stone-500 hover:text-stone-700 hover:bg-white/40'}
        `}
    >
        <div className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700`} />

        {React.createElement(icon, { size: 18, className: 'relative z-10' })}
        <span className="hidden lg:inline relative z-10">{label}</span>
    </NavLink>
);

export default Navigation;

