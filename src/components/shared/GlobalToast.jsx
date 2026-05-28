import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { usePikmin } from '../../context/PikminContext';

const TOAST_TYPE = {
    success: {
        icon: CheckCircle2,
        className: 'bg-green-50 text-green-800 border-green-200'
    },
    error: {
        icon: AlertCircle,
        className: 'bg-red-50 text-red-800 border-red-200'
    },
    syncing: {
        icon: Loader2,
        className: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    info: {
        icon: Info,
        className: 'bg-stone-50 text-stone-700 border-stone-200'
    }
};

const GlobalToast = () => {
    const { syncStatus, syncMessage } = usePikmin();
    const [visibleToast, setVisibleToast] = React.useState(null);

    React.useEffect(() => {
        if (!syncMessage || syncStatus === 'idle') return;

        setVisibleToast({
            id: Date.now(),
            status: syncStatus,
            message: syncMessage
        });

        if (syncStatus !== 'syncing') {
            const timer = setTimeout(() => setVisibleToast(null), 2600);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [syncStatus, syncMessage]);

    if (!visibleToast) return null;

    const config = TOAST_TYPE[visibleToast.status] || TOAST_TYPE.info;
    const Icon = config.icon;

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
            <div
                className={`min-w-[240px] max-w-[90vw] border rounded-2xl shadow-lg px-4 py-3 font-bold text-sm backdrop-blur-xl ${config.className}`}
                role="status"
                aria-live={visibleToast.status === 'error' ? 'assertive' : 'polite'}
            >
                <div className="flex items-center gap-2">
                    <Icon size={16} className={visibleToast.status === 'syncing' ? 'animate-spin' : ''} />
                    <span>{visibleToast.message}</span>
                </div>
            </div>
        </div>
    );
};

export default GlobalToast;
