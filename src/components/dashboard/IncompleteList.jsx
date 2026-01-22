import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import { COLORS } from '../../theme/colors';

const IncompleteList = ({ incompleteCategories }) => {
    const navigate = useNavigate();

    const handleTagClick = (item) => {
        // Navigate to Tracker with state to pre-fill search/filter
        navigate('/tracker', {
            state: {
                searchQuery: item.searchTerm,
                filterType: item.filterType || 'all'
            }
        });
    };

    return (
        <div className="mt-12">
            <div className="mb-4 pl-2 border-l-4 border-brand-primary/20">
                <span className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">
                    Action Items
                </span>
                <h3 className="text-2xl font-black text-stone-800 leading-none tracking-tight">
                    未完成類別 <span className="text-brand-primary ml-1">({incompleteCategories.length})</span>
                </h3>
            </div>

            {incompleteCategories.length > 0 ? (
                <div className="incomplete-grid">
                    {incompleteCategories.map(cat => (
                        <div key={cat.id} className="incomplete-card group">
                            <div className="incomplete-header">
                                <span className="incomplete-title">{cat.name_ch}</span>
                                <span className="text-sm font-bold text-brand-primary">{cat.progress}/{cat.total}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="progress-bar-bg">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${cat.percent}%`, backgroundColor: cat.percent > 80 ? COLORS.status.collected : COLORS.brand.primary }}
                                />
                            </div>

                            {/* Missing List */}
                            <div className="missing-tags">
                                {cat.missingItems.slice(0, 10).map((item, idx) => (
                                    <button
                                        key={idx}
                                        className="missing-tag hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30 cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                                        onClick={() => handleTagClick(item)}
                                        title={`前往追蹤頁面搜尋 "${item.searchTerm}"`}
                                    >
                                        <Search size={10} className="opacity-50" />
                                        {item.label}
                                    </button>
                                ))}
                                {cat.missingItems.length > 10 && (
                                    <span className="missing-tag text-stone-400">+{cat.missingItems.length - 10} 更多</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p className="empty-state-text">太棒了！所選範圍內的所有類別都已收集完成！</p>
                </div>
            )}
        </div>
    );
};

export default IncompleteList;
