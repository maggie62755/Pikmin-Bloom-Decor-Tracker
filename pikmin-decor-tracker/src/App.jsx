import React, { useState, useEffect } from 'react';
import { DECOR_CATEGORIES } from './constants';
import CategoryAccordion from './components/CategoryAccordion';
import DecorGrid from './components/DecorGrid';
import { useGoogleSheets } from './hooks/useGoogleSheets';
import { RefreshCw, Save, Download, LogIn, LogOut } from 'lucide-react';

function App() {
  // State: { [variantId]: { [colorId]: status } }
  const [collection, setCollection] = useState(() => {
    const saved = localStorage.getItem('pikmin-collection');
    return saved ? JSON.parse(saved) : {};
  });

  const [openCategories, setOpenCategories] = useState({});
  const { login, logout, user, saveToSheet, loadFromSheet, syncStatus, syncMessage } = useGoogleSheets();

  // Persistence
  useEffect(() => {
    localStorage.setItem('pikmin-collection', JSON.stringify(collection));
  }, [collection]);

  const toggleCategory = (id) => {
    setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCardClick = (variantId, colorId) => {
    setCollection(prev => {
      const variant = prev[variantId] || {};
      const currentStatus = variant[colorId] || 0;
      const nextStatus = (currentStatus + 1) % 4;
      
      return {
        ...prev,
        [variantId]: {
          ...variant,
          [colorId]: nextStatus
        }
      };
    });
  };

  const calculateProgress = (category) => {
    let collectedArg = 0;
    let totalArg = 0;
    
    category.variants.forEach(v => {
      v.colors.forEach(c => {
        totalArg++;
        if ((collection[v.id]?.[c] || 0) === 3) {
          collectedArg++;
        }
      });
    });
    
    return { collected: collectedArg, total: totalArg };
  };

  const calculateTotalProgress = () => {
      let collected = 0;
      let total = 0;
      DECOR_CATEGORIES.forEach(cat => {
          const { collected: c, total: t } = calculateProgress(cat);
          collected += c;
          total += t;
      });
      return { collected, total };
  };

  const { collected: totalCollected, total: grandTotal } = calculateTotalProgress();

  const handleSave = () => saveToSheet(collection, DECOR_CATEGORIES);
  const handleLoad = async () => {
    if (confirm("This will overwrite your current local progress with data from Google Sheets. Continue?")) {
        const data = await loadFromSheet();
        if (data) setCollection(data);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent">
              Pikmin Decor
            </h1>
            <p className="text-xs text-slate-500 font-medium">
                {totalCollected} / {grandTotal} Collected
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!user ? (
               <button onClick={() => login()} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
                 <LogIn size={16} /> Login
               </button>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 hidden sm:block">
                        {syncMessage || "Ready"}
                    </span>
                     <button onClick={handleLoad} disabled={syncStatus === 'syncing'} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full" title="Load from Cloud">
                        <Download size={20} className={syncStatus === 'syncing' ? 'animate-bounce' : ''} />
                    </button>
                    <button onClick={handleSave} disabled={syncStatus === 'syncing'} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Save to Cloud">
                        <Save size={20} className={syncStatus === 'syncing' ? 'animate-pulse' : ''} />
                    </button>
                     <button onClick={logout} className="p-2 text-red-400 hover:bg-red-50 rounded-full" title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            )}
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full">
            <div 
                className="h-full bg-gradient-to-r from-pink-500 to-yellow-500 transition-all duration-500"
                style={{ width: `${(totalCollected / grandTotal) * 100}%` }}
            />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-24 space-y-4">
        {DECOR_CATEGORIES.map(category => {
          const { collected, total } = calculateProgress(category);
          return (
            <CategoryAccordion
              key={category.id}
              category={category}
              isOpen={openCategories[category.id]}
              onToggle={() => toggleCategory(category.id)}
              progress={collected}
              total={total}
            >
              <DecorGrid 
                variants={category.variants}
                onCardClick={handleCardClick}
                collectionState={collection}
              />
            </CategoryAccordion>
          );
        })}
      </main>
    </div>
  );
}

export default App;
