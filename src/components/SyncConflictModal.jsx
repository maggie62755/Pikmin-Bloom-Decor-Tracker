import React from 'react';
import { Cloud, Smartphone, AlertTriangle, Check, ArrowRight, X } from 'lucide-react';

const SyncConflictModal = ({ cloudStats, localStats, onKeepCloud, onKeepLocal, onCancel }) => {
    if (!cloudStats || !localStats) return null;

    const formatDate = (isoString) => {
        if (!isoString) return "Never";
        return new Date(isoString).toLocaleString();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-100">
                {/* Header */}
                <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-stone-800">Sync Conflict</h3>
                        <p className="text-sm text-stone-500 font-medium">Data versions mismatch</p>
                    </div>
                    {onCancel && (
                        <button onClick={onCancel} className="ml-auto p-2 hover:bg-amber-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    <p className="text-stone-600 mb-6 font-medium">
                        We found a difference between your local data and the cloud backup. Which version would you like to keep?
                    </p>

                    <div className="grid gap-4">
                        {/* Cloud Option */}
                        <div className="relative group cursor-pointer" onClick={onKeepCloud}>
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-cyan-300 rounded-2xl opacity-50 blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative flex items-center gap-4 p-4 rounded-2xl border-2 border-stone-100 bg-white hover:border-blue-400/50 transition-all">
                                <div className="bg-blue-50 p-3 rounded-xl text-blue-500">
                                    <Cloud size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-stone-800">Cloud Backup</h4>
                                        <span className="text-xs font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                            {cloudStats.completion}% Done
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-400 font-medium truncate">
                                        Last saved: {formatDate(cloudStats.timestamp)}
                                    </p>
                                </div>
                                <div className="text-stone-300 group-hover:text-blue-500 transition-colors">
                                    <Check size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center text-stone-300 font-black text-sm">Or</div>

                        {/* Local Option */}
                        <div className="relative group cursor-pointer" onClick={onKeepLocal}>
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-300 to-red-300 rounded-2xl opacity-50 blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative flex items-center gap-4 p-4 rounded-2xl border-2 border-stone-100 bg-white hover:border-orange-400/50 transition-all">
                                <div className="bg-orange-50 p-3 rounded-xl text-orange-500">
                                    <Smartphone size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-stone-800">This Device</h4>
                                        <span className="text-xs font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                            {localStats.completion}% Done
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-400 font-medium truncate">
                                        Last edited: {formatDate(localStats.timestamp)}
                                    </p>
                                </div>
                                <div className="text-stone-300 group-hover:text-orange-500 transition-colors">
                                    <Check size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-stone-50 px-6 py-4 text-center">
                    <p className="text-xs text-stone-400 font-medium">
                        Choosing one will overwrite the other. This action cannot be undone.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SyncConflictModal;
