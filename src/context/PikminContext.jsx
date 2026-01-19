import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { DECOR_CATEGORIES, DECOR_STATUS } from '../constants';

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

    const { login, logout, user, saveToSheet, loadFromSheet, syncStatus, syncMessage } = useGoogleSheets();

    // Persistence
    useEffect(() => {
        localStorage.setItem('pikmin-collection', JSON.stringify(collection));
    }, [collection]);

    const toggleStatus = React.useCallback((variantId, colorId) => {
        setCollection(prev => {
            const variant = prev[variantId] || {};
            const currentStatus = variant[colorId] || DECOR_STATUS.NOT_COLLECTED;
            const nextStatus = (currentStatus + 1) % 4;

            return {
                ...prev,
                [variantId]: {
                    ...variant,
                    [colorId]: nextStatus
                }
            };
        });
    }, []);

    // Helper calculate progress (can be used by Dashboard and Tracker)
    const calculateProgress = React.useCallback((category) => {
        let collectedArg = 0;
        let totalArg = 0;

        category.variants.forEach(v => {
            v.colors.forEach(c => {
                totalArg++;
                if ((collection[v.id]?.[c] || DECOR_STATUS.NOT_COLLECTED) === DECOR_STATUS.COLLECTED) {
                    collectedArg++;
                }
            });
        });

        return { collected: collectedArg, total: totalArg };
    }, [collection]);
    
    const calculateTotalProgress = React.useCallback(() => {
          let collected = 0;
          let total = 0;
          DECOR_CATEGORIES.forEach(cat => {
              const { collected: c, total: t } = calculateProgress(cat);
              collected += c;
              total += t;
          });
          return { collected, total };
      }, [calculateProgress]);

    const value = React.useMemo(() => ({
        collection,
        setCollection,
        toggleStatus,
        calculateProgress,
        calculateTotalProgress,
        login,
        logout,
        user,
        saveToSheet,
        loadFromSheet,
        syncStatus,
        syncMessage
    }), [
        collection, 
        toggleStatus, 
        calculateProgress, 
        calculateTotalProgress, 
        login, logout, user, 
        saveToSheet, loadFromSheet, 
        syncStatus, syncMessage
    ]);

    return (
        <PikminContext.Provider value={value}>
            {children}
        </PikminContext.Provider>
    );
};
