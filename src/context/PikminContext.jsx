import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { DECOR_CATEGORIES, DECOR_STATUS } from '../constants';
import SyncConflictModal from '../components/SyncConflictModal';

const PikminContext = createContext();

export const usePikmin = () => {
    const context = useContext(PikminContext);
    if (!context) {
        throw new Error('usePikmin must be used within a PikminProvider');
    }
    return context;
};

export const PikminProvider = ({ children }) => {
    // State: { [variantId]: { [colorId]: status } }
    const [collection, setCollection] = useState(() => {
        const saved = localStorage.getItem('pikmin-collection');
        return saved ? JSON.parse(saved) : {};
    });

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [localTimestamp, setLocalTimestamp] = useState(() => localStorage.getItem('pikmin-local-timestamp') || null);

    // Conflict State
    const [conflictData, setConflictData] = useState(null); // { cloud: {data, timestamp, completion}, local: {data, timestamp, completion} }

    const { login, logout, user, token, saveToSheet: saveToSheetApi, loadFromSheet: loadFromSheetApi, checkCloudVersion, syncStatus, syncMessage } = useGoogleSheets();

    // Persistence
    useEffect(() => {
        localStorage.setItem('pikmin-collection', JSON.stringify(collection));
    }, [collection]);

    useEffect(() => {
        if (localTimestamp) {
            localStorage.setItem('pikmin-local-timestamp', localTimestamp);
        }
    }, [localTimestamp]);

    const toggleStatus = React.useCallback((variantId, colorId, specificStatus = null) => {
        setCollection(prev => {
            const variant = prev[variantId] || {};
            const currentStatus = variant[colorId] || DECOR_STATUS.NOT_COLLECTED;

            // If specificStatus is provided, use it. Otherwise cycle.
            const nextStatus = specificStatus !== null
                ? specificStatus
                : (currentStatus + 1) % 4;

            return {
                ...prev,
                [variantId]: {
                    ...variant,
                    [colorId]: nextStatus
                }
            };
        });
        setHasUnsavedChanges(true); // Mark as dirty
    }, []);

    // Helper calculate progress (can be used by Dashboard and Tracker)
    const calculateProgress = React.useCallback((category, collectionState = collection) => {
        let collectedArg = 0;
        let totalArg = 0;

        category.variants.forEach(v => {
            v.colors.forEach(c => {
                totalArg++;
                if ((collectionState[v.id]?.[c] || DECOR_STATUS.NOT_COLLECTED) === DECOR_STATUS.COLLECTED) {
                    collectedArg++;
                }
            });
        });

        return { collected: collectedArg, total: totalArg };
    }, [collection]);

    const calculateTotalProgress = React.useCallback((collectionState = collection) => {
        let collected = 0;
        let total = 0;
        DECOR_CATEGORIES.forEach(cat => {
            const { collected: c, total: t } = calculateProgress(cat, collectionState);
            collected += c;
            total += t;
        });
        return { collected, total };
    }, [calculateProgress, collection]);

    // --- Sync Logic ---

    // 1. Calculate stats for a collection snapshot (for comparison)
    const getStats = (col, ts) => {
        // We need to pass the collection state to calculateTotalProgress logic.
        // But calculateTotalProgress depends on closure 'collection', so we extracted the logic slightly to accept arg.

        let collected = 0;
        let total = 0;
        DECOR_CATEGORIES.forEach(cat => {
            // Re-implement simplified logic to avoid dependency hell or reuse refined calculateProgress
            cat.variants.forEach(v => {
                v.colors.forEach(c => {
                    total++;
                    if ((col[v.id]?.[c] || DECOR_STATUS.NOT_COLLECTED) === DECOR_STATUS.COLLECTED) {
                        collected++;
                    }
                });
            });
        });

        const percent = total > 0 ? Math.round((collected / total) * 100) : 0;
        return { timestamp: ts, completion: percent, collection: col };
    };

    // 2. Logic to run on Login (or explicit Sync Click)
    const performCloudCheck = async () => {
        if (!user) return;

        // Fetch Cloud Data (Full)
        const result = await loadFromSheetApi();
        if (!result) return; // Error handled in hook

        const { data: cloudData, timestamp: cloudTimestamp } = result;

        // Scenario A: Cloud is empty (New user or first sync)
        if (!cloudTimestamp) {
            // Treat as: Local is newer (or just standard save needed).
            // Do not prompt conflict.
            // If we have local data, prompt user to Save initially? Or just set state.
            // For now, let's just mark unsaved if we have something.
            if (Object.keys(collection).length > 0) {
                setHasUnsavedChanges(true);
            }
            return;
        }

        // Scenario B: Comparison
        const cloudStats = getStats(cloudData, cloudTimestamp);
        const localStats = getStats(collection, localTimestamp);

        // If exact match on timestamp? (Unlikely unless we tracked it perfectly)
        // Or if data is stringify equal?
        const isDataIdentical = JSON.stringify(cloudData) === JSON.stringify(collection);

        if (isDataIdentical) {
            setLocalTimestamp(cloudTimestamp);
            setHasUnsavedChanges(false);
            return;
        }

        // Data differs. Conflict Modal time.
        // EXCEPT if Local is Empty (fresh device), just auto-adopt Cloud.
        const isLocalEmpty = Object.keys(collection).length === 0;
        if (isLocalEmpty) {
            setCollection(cloudData);
            setLocalTimestamp(cloudTimestamp);
            setHasUnsavedChanges(false);
            return;
        }

        // Real Conflict
        setConflictData({
            cloud: cloudStats,
            local: localStats
        });
    };

    // Run check on login
    useEffect(() => {
        if (user) {
            performCloudCheck();
        }
    }, [user]); // Run once when user becomes available

    const resolveConflict = (choice) => {
        if (choice === 'cloud') {
            setCollection(conflictData.cloud.collection);
            setLocalTimestamp(conflictData.cloud.timestamp);
            setHasUnsavedChanges(false);
        } else {
            // Keep Local -> Must Save to push to cloud
            setHasUnsavedChanges(true);
            // We don't update localTimestamp here because it hasn't been saved to cloud yet.
        }
        setConflictData(null);
    };

    // Wrapper for Save
    const saveToSheet = async () => {
        try {
            // Optimistic: We passed the pre-flight check inside hook or assume we want to force?
            // User requested explicit check logic: "Before save, check F1".
            // Hook's saveToSheet already does this? No, I implemented it to THROW if conflict.

            const newTimestamp = await saveToSheetApi(collection, DECOR_CATEGORIES, localTimestamp);

            // If successful:
            setLocalTimestamp(newTimestamp);
            setHasUnsavedChanges(false);
        } catch (error) {
            if (error.message === 'CLOUD_CONFLICT') {
                // Trigger full comparison to show modal
                await performCloudCheck();
            }
        }
    };

    const value = React.useMemo(() => ({
        collection,
        setCollection,
        toggleStatus,
        calculateProgress,
        calculateTotalProgress,
        login,
        logout,
        user,
        token,
        saveToSheet,
        loadFromSheet: loadFromSheetApi, // Expose raw if needed, but mainly we use internal logic
        syncStatus,
        syncMessage,
        hasUnsavedChanges,
        localTimestamp
    }), [
        collection,
        toggleStatus,
        calculateProgress,
        calculateTotalProgress,
        login, logout, user, token,
        saveToSheet, loadFromSheetApi,
        syncStatus, syncMessage,
        hasUnsavedChanges, localTimestamp
    ]);

    return (
        <PikminContext.Provider value={value}>
            {children}
            {conflictData && (
                <SyncConflictModal
                    cloudStats={conflictData.cloud}
                    localStats={conflictData.local}
                    onKeepCloud={() => resolveConflict('cloud')}
                    onKeepLocal={() => resolveConflict('local')}
                    onCancel={() => setConflictData(null)}
                />
            )}
        </PikminContext.Provider>
    );
};
