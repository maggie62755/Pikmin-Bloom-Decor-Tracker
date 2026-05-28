import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Download, Save, User, Cloud, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const UserProfile = ({ user, syncStatus, hasUnsavedChanges, lastSyncAt, onSave, onLoad, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleAction = (action) => {
        action();
        setIsOpen(false);
    };

    // Status visual logic
    let statusColor = "bg-green-500";
    let statusRing = "ring-green-400/50";
    let StatusIcon = CheckCircle2;
    let statusText = "All Synced";

    if (syncStatus === 'syncing') {
        statusColor = "bg-blue-500";
        statusRing = "ring-blue-400/50";
        StatusIcon = RefreshCw;
        statusText = "Syncing...";
    } else if (hasUnsavedChanges) {
        statusColor = "bg-amber-500";
        statusRing = "ring-amber-400/50";
        StatusIcon = AlertCircle;
        statusText = "Unsaved Changes";
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Avatar Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative group flex items-center justify-center transition-all duration-300 outline-none
                    ${isOpen ? 'scale-105' : 'hover:scale-105 active:scale-95'}
                `}
            >
                {/* Status Ring Animation */}
                <div className={`absolute inset-0 rounded-full border-2 ${syncStatus === 'syncing' ? 'border-blue-400 animate-spin-slow' : 'border-transparent'} opacity-50`}></div>

                {/* Status Glow */}
                <div className={`absolute -inset-0.5 rounded-full blur opacity-40 transition-colors duration-500 z-0 ${hasUnsavedChanges ? 'bg-amber-400' : 'bg-transparent'}`}></div>

                {/* Avatar Image / Placeholder */}
                <div className={`z-10 w-10 h-10 rounded-full overflow-hidden border-2 transition-colors duration-300
                    ${hasUnsavedChanges ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-white shadow-sm'}
                `}>
                    {user?.picture ? (
                        <img src={user.picture} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white">
                            <span className="font-bold text-lg">{user?.name?.[0] || "U"}</span>
                        </div>
                    )}
                </div>

                {/* Status Dot (Absolute Badge) */}
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${statusColor} shadow-sm z-10 transition-colors duration-300 flex items-center justify-center`}>
                    {syncStatus === 'syncing' && <RefreshCw size={8} className="text-white animate-spin" />}
                </div>
            </button>

            {/* Dropdown Menu */}
            <div className={`
                absolute right-0 top-full mt-3 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden transform transition-all duration-200 origin-top-right z-50
                ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
            `}>

                {/* User Header */}
                <div className="p-4 border-b border-stone-100 bg-stone-50/50">
                    <p className="font-bold text-stone-800 truncate">{user?.name || "Pikmin Player"}</p>
                    <p className="text-xs text-stone-500 truncate font-medium">{user?.email}</p>

                    {/* Status Badge in Menu */}
                    <div className={`mt-3 flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg w-fit transition-colors
                        ${hasUnsavedChanges ? 'bg-amber-100 text-amber-700' :
                            syncStatus === 'syncing' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                    `}>
                        <StatusIcon size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                        {statusText}
                    </div>
                    <p className="mt-2 text-[11px] text-stone-500 font-semibold">
                        上次同步: {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : '尚未同步'}
                    </p>
                </div>

                {/* Actions */}
                <div className="p-2 flex flex-col gap-1">
                    <button
                        onClick={() => handleAction(onSave)}
                        disabled={syncStatus === 'syncing'}
                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-stone-600 font-bold text-sm transition-colors group disabled:opacity-50"
                    >
                        <div className={`p-2 rounded-full ${hasUnsavedChanges ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-200' : 'bg-stone-200 text-stone-500'}`}>
                            <Save size={18} />
                        </div>
                        <span>Save to Cloud</span>
                        {hasUnsavedChanges && <span className="ml-auto w-2 h-2 rounded-full bg-amber-500"></span>}
                    </button>

                    <button
                        onClick={() => {
                            if (confirm("This will overwrite your local changes with the Cloud version. Continue?")) {
                                handleAction(onLoad);
                            }
                        }}
                        disabled={syncStatus === 'syncing'}
                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-stone-600 font-bold text-sm transition-colors group"
                    >
                        <div className="p-2 rounded-full bg-stone-200 text-stone-500 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                            <Download size={18} />
                        </div>
                        <span>Load from Cloud</span>
                    </button>

                    <div className="h-px bg-stone-100 my-1 mx-2"></div>

                    <button
                        onClick={() => handleAction(onLogout)}
                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-stone-500 hover:text-red-500 font-bold text-sm transition-colors group"
                    >
                        <div className="p-2 rounded-full bg-stone-200 text-stone-400 group-hover:bg-red-100 group-hover:text-red-500 transition-colors">
                            <LogOut size={18} />
                        </div>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
