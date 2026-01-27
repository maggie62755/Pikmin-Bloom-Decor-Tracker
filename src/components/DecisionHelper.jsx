import React, { useState, useMemo, useEffect } from 'react';
import { usePikmin } from '../context/PikminContext';
import { DECOR_CATEGORIES, PIKMIN_COLORS, DECOR_STATUS, DECOR_STATUS_LABELS } from '../constants';
import { getAdvice, checkBasicCompleteness } from '../utils/decisionLogic';
import { Sprout, Footprints, AlertCircle, Leaf, Sparkles, Target, Ban } from 'lucide-react';

const DecisionHelper = () => {
    const { collection, toggleStatus } = usePikmin();

    // -- State --
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedVariant, setSelectedVariant] = useState('');
    const [selectedColor, setSelectedColor] = useState('');

    // -- Derived Data --
    const category = useMemo(() =>
        DECOR_CATEGORIES.find(c => c.id === selectedCategory),
        [selectedCategory]
    );

    const variant = useMemo(() =>
        category?.variants.find(v => v.id === selectedVariant),
        [category, selectedVariant]
    );

    // Reset downstream selections when upstream changes
    useEffect(() => {
        if (category?.variants?.length > 0) {
            setSelectedVariant(category.variants[0].id);
        } else {
            setSelectedVariant('');
        }
        setSelectedColor('');
    }, [category]);

    useEffect(() => {
        setSelectedColor('');
    }, [selectedVariant]);

    // -- Logic & Status --

    // Current Status
    const currentStatus = (selectedVariant && selectedColor)
        ? (collection[selectedVariant]?.[selectedColor] || DECOR_STATUS.NOT_COLLECTED)
        : DECOR_STATUS.NOT_COLLECTED;

    // Temp status for dropdown
    const [tempStatus, setTempStatus] = useState(currentStatus);

    // Sync temp status when real status or selection changes
    useEffect(() => {
        setTempStatus(currentStatus);
    }, [currentStatus, selectedVariant, selectedColor]);

    // Check Automation Rules
    const isBasicComplete = useMemo(() =>
        checkBasicCompleteness(category, collection),
        [category, collection]
    );



    // Get Advice
    const advice = useMemo(() => {
        if (!selectedCategory || !selectedVariant || !selectedColor) return null;

        return getAdvice({
            status: currentStatus,
            variant,
            color: selectedColor,
            category,
            collection
        });
    }, [currentStatus, variant, selectedColor, category, collection]);

    const activeDecorImage = useMemo(() => {
        if (!category || !variant || !selectedColor) return null;
        return `${import.meta.env.BASE_URL}images/decors_images/${category.image_path}/${variant.image_name}_${selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)}.png`;
    }, [category, variant, selectedColor]);


    // -- Render Helpers --
    const getStatusIcon = (s) => {
        switch (s) {
            case DECOR_STATUS.NOT_COLLECTED: return <span className="text-gray-400">✨ 未取得</span>;
            case DECOR_STATUS.SEEDLING: return <span className="text-brand-primary">🌱 花苗中</span>;
            case DECOR_STATUS.GROWING: return <span className="text-yellow-600">✅ 培養中</span>;
            case DECOR_STATUS.COLLECTED: return <span className="text-green-600">✅ 已收藏</span>;
            default: return null;
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 md:p-6 shadow-sm border border-white/50 space-y-6 md:space-y-8 transition-all duration-300">

            {/* 1. Header & Automated Rules Status */}

            {/* Rule Mode Display */}
            {selectedCategory && (
                <div className={`
                        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border
                        ${isBasicComplete
                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'}
                    `}>
                    {isBasicComplete ? (
                        <>
                            <Sparkles size={16} />
                            <span>Rare Grinding (基本款已齊)</span>
                        </>
                    ) : (
                        <>
                            <Target size={16} />
                            <span>Prioritize New (拼集滿圖鑑)</span>
                        </>
                    )}
                </div>
            )}

            {/* 2. Selection Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">分類</label>
                    <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="w-full p-3 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                    >
                        <option value="">選擇分類...</option>
                        {DECOR_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name_ch} ({cat.name})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Variant */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">飾品</label>
                    <select
                        value={selectedVariant}
                        onChange={e => setSelectedVariant(e.target.value)}
                        disabled={!selectedCategory}
                        className="w-full p-3 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium disabled:opacity-50"
                    >
                        <option value="">選擇飾品...</option>
                        {category?.variants.map(v => (
                            <option key={v.id} value={v.id}>
                                {v.name_ch} ({v.name})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Color */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">顏色</label>
                    <select
                        value={selectedColor}
                        onChange={e => setSelectedColor(e.target.value)}
                        disabled={!selectedVariant}
                        className="w-full p-3 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium disabled:opacity-50"
                    >
                        <option value="">選擇顏色...</option>
                        {variant?.colors.map(cId => {
                            const colorDef = PIKMIN_COLORS.find(pc => pc.id === cId);
                            return (
                                <option key={cId} value={cId}>
                                    {colorDef?.name_ch || cId} ({colorDef?.name || cId})
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>

            {/* 3. Decision & Advice Display */}
            {selectedCategory && selectedVariant && variant ? (
                selectedColor ? (
                    // --- Single Color View (Existing) ---
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fadeIn">

                        {/* Status Card */}
                        <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group flex flex-col">

                            {/* Background Image */}
                            {/* Hero Image */}
                            {activeDecorImage && (
                                <div className="w-full h-10 flex items-center justify-center mb-2 bg-gradient-to-b from-gray-50/50 to-transparent rounded-2xl">
                                    <img
                                        src={activeDecorImage}
                                        alt=""
                                        className="translate-x-2/3 h-36 w-auto object-contain drop-shadow-md hover:scale-110 transition-transform duration-500"
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                </div>
                            )}

                            <div className="relative z-10 flex flex-col justify-between gap-4 flex-1">
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">目前狀態</div>
                                    <div className="text-xl font-bold flex items-center gap-2">
                                        {getStatusIcon(currentStatus)}
                                    </div>
                                </div>

                                {/* Quick Actions Dropdown */}
                                {/* Quick Actions Dropdown */}
                                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 w-full">
                                    <select
                                        value={tempStatus}
                                        onChange={(e) => setTempStatus(Number(e.target.value))}
                                        className="flex-1 w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary p-2.5 outline-none transition-all shadow-sm"
                                    >
                                        {Object.values(DECOR_STATUS).map((statusValue) => (
                                            <option key={statusValue} value={statusValue}>
                                                {DECOR_STATUS_LABELS[statusValue]}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => toggleStatus(selectedVariant, selectedColor, tempStatus)}
                                        className="w-full sm:w-auto md:w-full lg:w-auto px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-medium rounded-lg text-sm transition-colors shadow-sm active:scale-95 whitespace-nowrap"
                                    >
                                        更新
                                    </button>
                                </div>

                                <div className="text-xs text-center text-gray-300">
                                    快速更新資料庫狀態
                                </div>
                            </div>
                        </div>

                        {/* Advice Cards (Split) */}
                        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* Seedling Advice */}
                            <div className={`p-5 rounded-2xl border flex flex-col gap-2 relative overflow-hidden
                                bg-white border-gray-200
                            `}>
                                <div className="flex items-center gap-2 text-stone-400 uppercase tracking-widest text-[10px] font-black">
                                    <Sprout size={14} />
                                    <span>如果是花苗</span>
                                </div>

                                <div className={`text-2xl font-black ${advice?.actionColor}`}>
                                    {advice?.seedlingAction}
                                </div>
                            </div>

                            {/* Pikmin Advice */}
                            <div className={`p-5 rounded-2xl border flex flex-col gap-2 relative overflow-hidden
                                bg-white border-gray-200
                            `}>
                                <div className="flex items-center gap-2 text-stone-400 uppercase tracking-widest text-[10px] font-black">
                                    <Footprints size={14} />
                                    <span>如果是皮克敏</span>
                                </div>

                                <div className={`text-2xl font-black ${advice?.actionColor}`}>
                                    {advice?.pikminAction}
                                </div>
                            </div>

                            {/* Logic Explanation - Full Width */}
                            <div className="col-span-1 sm:col-span-2 px-5 py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 flex items-start gap-3">
                                <div className="mt-1 opacity-50"><AlertCircle size={14} /></div>
                                <p>{advice?.reason}</p>
                            </div>

                        </div>
                    </div>
                ) : (
                    // --- Multi-Color View (Summary) ---
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
                        {variant.colors.map(cId => {
                            const colorDef = PIKMIN_COLORS.find(pc => pc.id === cId);
                            const s = collection[selectedVariant]?.[cId] || DECOR_STATUS.NOT_COLLECTED;

                            // Calculate advice on the fly for this color
                            const adv = getAdvice({
                                status: s,
                                variant,
                                color: cId,
                                category,
                                collection
                            });

                            const imagePath = `${import.meta.env.BASE_URL}images/decors_images/${category.image_path}/${variant.image_name}_${cId.charAt(0).toUpperCase() + cId.slice(1)}.png`;

                            return (
                                <div key={cId} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    {/* Background Image */}
                                    <div className="absolute inset-2 z-0 opacity-20 transition-transform duration-500 group-hover:scale-110 pointer-events-none flex items-center justify-center">
                                        <img
                                            src={imagePath}
                                            alt=""
                                            className="h-3/2 w-auto object-contain"
                                            onError={(e) => e.currentTarget.style.display = 'none'}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="relative z-10">
                                        {/* Color Header */}
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50/50">
                                            <div
                                                className="w-4 h-4 rounded-full border border-black/10 shadow-inner"
                                                style={{ backgroundColor: colorDef?.hex || '#ccc' }}
                                            />
                                            <span className="font-bold text-gray-700">{colorDef?.name_ch}</span>
                                            <div className="ml-auto scale-75 origin-right">{getStatusIcon(s)}</div>
                                        </div>

                                        {/* Mini Advice */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-xs text-gray-400 uppercase tracking-wider font-bold">
                                                <span>花苗</span>
                                                <span>皮克敏</span>
                                            </div>
                                            <div className="flex justify-between items-center font-bold text-sm">
                                                <span className={adv.actionColor}>{adv.seedlingAction}</span>
                                                <div className="w-px h-4 bg-gray-100 mx-2"></div>
                                                <span className={adv.actionColor}>{adv.pikminAction}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Action Overlay (Optional? Maybe just simple toggle) */}
                                    <button
                                        onClick={() => setSelectedColor(cId)}
                                        className="absolute inset-0 w-full h-full opacity-0 hover:bg-black/5 transition-opacity cursor-pointer z-20"
                                        title="點擊查看詳情"
                                    />
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                // Placeholder
                <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <div className="flex justify-center mb-2">
                        <Leaf className="w-8 h-8 opacity-50" />
                    </div>
                    <p>請選擇分類、飾品與顏色以取得建議</p>
                </div>
            )}
        </div>
    );
};

export default DecisionHelper;
