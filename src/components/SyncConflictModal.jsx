import React from 'react';
import { Cloud, Smartphone, AlertTriangle, Check, ArrowRight, X } from 'lucide-react';
import { useTranslation } from '../i18n';

const SyncConflictModal = ({ cloudStats, localStats, onKeepCloud, onKeepLocal, onCancel }) => {
    const { t } = useTranslation();
    if (!cloudStats || !localStats) return null;

    const formatDate = (isoString) => {
        if (!isoString) return t('sync.never_synced');
        return new Date(isoString).toLocaleString();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-journal-paper rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-journal-line">
                {/* Header */}
                <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-display font-bold text-journal-ink">{t('conflict.title')}</h3>
                        <p className="text-sm text-journal-muted font-medium">{t('sync.unsaved_changes')}</p>
                    </div>
                    {onCancel && (
                        <button onClick={onCancel} className="ml-auto p-2 hover:bg-amber-100 rounded-full text-journal-muted hover:text-journal-ink transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    <p className="text-journal-ink/80 mb-6 font-medium">
                        {t('conflict.title')}
                    </p>

                    <div className="grid gap-4">
                        {/* Cloud Option */}
                        <div className="relative group cursor-pointer" onClick={onKeepCloud}>
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-cyan-300 rounded-2xl opacity-50 blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative flex items-center gap-4 p-4 rounded-2xl border-2 border-journal-line bg-white hover:border-blue-400/50 transition-all">
                                <div className="bg-blue-50 p-3 rounded-xl text-blue-500">
                                    <Cloud size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold font-display text-journal-ink">{t('conflict.cloud_label')}</h4>
                                        <span className="text-xs font-mono font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                            {t('conflict.completion')}: {cloudStats.completion}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-journal-muted font-medium truncate">
                                        {t('conflict.last_updated')}: {formatDate(cloudStats.timestamp)}
                                    </p>
                                </div>
                                <div className="text-journal-line group-hover:text-blue-500 transition-colors">
                                    <Check size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center text-journal-muted font-display font-bold text-sm">OR</div>

                        {/* Local Option */}
                        <div className="relative group cursor-pointer" onClick={onKeepLocal}>
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-300 to-red-300 rounded-2xl opacity-50 blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative flex items-center gap-4 p-4 rounded-2xl border-2 border-journal-line bg-white hover:border-orange-400/50 transition-all">
                                <div className="bg-orange-50 p-3 rounded-xl text-orange-500">
                                    <Smartphone size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold font-display text-journal-ink">{t('conflict.local_label')}</h4>
                                        <span className="text-xs font-mono font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                            {t('conflict.completion')}: {localStats.completion}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-journal-muted font-medium truncate">
                                        {t('conflict.last_updated')}: {formatDate(localStats.timestamp)}
                                    </p>
                                </div>
                                <div className="text-journal-line group-hover:text-orange-500 transition-colors">
                                    <Check size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-journal-surface px-6 py-4 text-center">
                    <p className="text-xs text-journal-muted font-medium">
                        {t('conflict.warning')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SyncConflictModal;
