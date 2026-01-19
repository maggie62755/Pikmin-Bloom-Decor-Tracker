import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogIn, LogOut, Download, Save, Home, List as ListIcon, BarChart2 } from 'lucide-react';
import { usePikmin } from '../context/PikminContext';
import { DECOR_CATEGORIES } from '../constants';

const Navigation = () => {
    const {
        user, login, logout,
        collection, saveToSheet, loadFromSheet, syncStatus, syncMessage,
        calculateTotalProgress
    } = usePikmin();

    const { collected: totalCollected, total: grandTotal } = calculateTotalProgress();

    return (
        <header className="fixed top-4 left-4 right-4 z-50">
            <div className="max-w-4xl mx-auto glass-panel rounded-full px-6 h-16 flex items-center justify-between relative">
                
                {/* Left: Logo */}
                <div className="w-32 flex-shrink-0">
                    <h1 className="text-xl font-black bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent hidden sm:block">
                        Pikmin Bloom
                    </h1>
                     <h1 className="text-xl font-black bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent sm:hidden">
                        PB
                    </h1>
                </div>

                {/* Center: Tabs Navigation */}
                <nav className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="flex bg-stone-100/50 p-1.5 rounded-full border border-stone-200/50 shadow-inner">
                        <NavTab to="/" icon={Home} label="Home" />
                        <NavTab to="/tracker" icon={ListIcon} label="Tracker" />
                        <NavTab to="/dashboard" icon={BarChart2} label="Stats" />
                    </div>
                </nav>

                {/* Right: Actions */}
                <div className="w-32 flex-shrink-0 flex justify-end items-center gap-2">
                    {!user ? (
                        <button onClick={() => login()} className="flex items-center gap-1 px-4 py-2 bg-brand-primary text-white rounded-full text-sm font-bold hover:brightness-110 transition-all shadow-md shadow-stone-200 active:scale-95">
                            <span className="hidden sm:inline">Login</span> <LogIn size={16} />
                        </button>
                    ) : (
                        <div className="flex items-center gap-1">
                             <SyncControls />
                        </div>
                    )}
                </div>

                {/* Progress Bar (Integrated Bottom) */}
                <div className="absolute -bottom-2 left-10 right-10 h-1.5 bg-stone-200/50 backdrop-blur-sm rounded-full overflow-hidden border border-white/20">
                    <div
                        className="h-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-1000 ease-out"
                        style={{ width: `${(totalCollected / grandTotal) * 100}%` }}
                    />
                </div>

            </div>
        </header>
    );
};

const NavTab = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black transition-all duration-300
            ${isActive 
                ? 'bg-white text-stone-800 shadow-sm scale-105' 
                : 'text-stone-500 hover:text-stone-800 hover:bg-white/40'}
        `}
    >
        <Icon size={16} />
        <span className="hidden sm:inline">{label}</span>
    </NavLink>
);

const SyncControls = () => {
    const { loadFromSheet, setCollection, saveToSheet, collection, syncStatus, logout } = usePikmin();

    const handleLoad = async () => {
        if (confirm("Overwrite local data with Cloud data?")) {
            const data = await loadFromSheet();
            if (data) setCollection(data);
        }
    };

    const handleSave = () => saveToSheet(collection, DECOR_CATEGORIES);

    return (
        <>
            <button onClick={handleLoad} disabled={syncStatus === 'syncing'} className="p-2 text-stone-500 hover:bg-white/60 hover:text-brand-primary rounded-full transition-colors" title="Load from Cloud">
                <Download size={20} className={syncStatus === 'syncing' ? 'animate-bounce' : ''} />
            </button>
            <button onClick={handleSave} disabled={syncStatus === 'syncing'} className="p-2 text-stone-500 hover:bg-white/60 hover:text-brand-primary rounded-full transition-colors" title="Save to Cloud">
                <Save size={20} className={syncStatus === 'syncing' ? 'animate-pulse' : ''} />
            </button>
            <button onClick={logout} className="p-2 text-stone-400 hover:bg-white/60 hover:text-red-500 rounded-full transition-colors" title="Logout">
                <LogOut size={20} />
            </button>
        </>
    );
}

export default Navigation;

