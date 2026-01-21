import React from 'react';
import { Filter } from 'lucide-react';
import { COLORS } from '../../theme/colors';

const IncompleteList = ({ incompleteCategories }) => {
    return (
        <div className="mt-12">
            <h3 className="text-xl font-black text-stone-900 mb-6 flex items-center gap-2">
                <Filter size={20} className="text-brand-primary" />
                未完成的類別 ({incompleteCategories.length})
            </h3>
            
            {incompleteCategories.length > 0 ? (
                <div className="incomplete-grid">
                    {incompleteCategories.map(cat => (
                        <div key={cat.id} className="incomplete-card">
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
                                    <span key={idx} className="missing-tag">{item}</span>
                                ))}
                                {cat.missingItems.length > 10 && (
                                    <span className="missing-tag">+{cat.missingItems.length - 10} 更多</span>
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
