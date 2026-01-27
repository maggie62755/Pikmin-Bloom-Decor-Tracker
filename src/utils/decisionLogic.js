import { DECOR_STATUS } from '../constants';

/**
 * Helper to check if a variant is considered "Rare".
 */
const isRareVariant = (variant) => {
    return variant.name.includes('Rare') || variant.image_name === '(Rare)';
};

/**
 * Helper to check if a variant involves multiple visuals per color.
 * 1. JSON Color Variations (e.g. "yellow1" for Battery, Theme Park)
 */
const isMultiVisual = (variant) => {
    if (!variant) return false;
    
    // Check for multiple color forms in JSON (e.g. "yellow1")
    return variant.colors?.some(c => /[0-9]/.test(c));
};

/**
 * Helper to check if a category's "Basic" (Non-Rare) set is complete.
 */
export const checkBasicCompleteness = (category, collection) => {
    if (!category || !collection) return false;
    
    // For Multi-Visual categories (e.g. Roadside with Stickers), 
    // "Completeness" is hard to define (infinite).
    // But logically, if we have marked "Collected" in the app, we treat it as Done for automated purposes?
    // User probably marks "Collected" when they have *one* of them.
    // Or they never mark "Collected" until they have all?
    // Let's assume standard behavior: Mark Collected = Have One.
    // But advice on duplicates should be "Check".
    
    // Filter for basic variants
    const basicVariants = category.variants.filter(v => !isRareVariant(v));
    
    // Check if every basic variant is fully collected
    return basicVariants.every(v => 
        v.colors.every(c => {
            const status = collection[v.id]?.[c] || DECOR_STATUS.NOT_COLLECTED;
            return status >= DECOR_STATUS.GROWING; // Treated as collected
        })
    );
};

/**
 * Determines the advice for a Pikmin/Seedling based on automated rules.
 * 
 * @param {Object} params
 * @param {string} params.status - Current status of the selected item (0-3)
 * @param {Object} params.variant - Current variant object
 * @param {string} params.color - Current color ID
 * @param {Object} params.category - Current category object
 * @param {Object} params.collection - Full collection state
 * 
 * @returns {Object} Advice object
 */
export const getAdvice = ({ status, variant, color, category, collection }) => {
    
    // Result Template
    const result = {
        actionColor: 'text-gray-500', // unified color theme
        seedlingAction: '',
        pikminAction: '',
        reason: '',
        mode: '' // 'BASIC_HUNT' or 'RARE_GRIND' or 'COMPLETE'
    };

    // 0. Safety
    if (!variant || !color || !category) return result;

    // 1. Context Analysis
    const isRare = isRareVariant(variant);
    const hasMultiVisuals = isMultiVisual(variant);
    const basicComplete = checkBasicCompleteness(category, collection);
    
    // Find linked Rare variant (if current is Basic)
    let rareVariant = null;
    if (!isRare) {
        rareVariant = category.variants.find(v => isRareVariant(v));
    }
    const hasRareVariant = !!rareVariant;

    const isCollected = status >= DECOR_STATUS.GROWING; // User has this specific item
    const notCollected = status === DECOR_STATUS.NOT_COLLECTED;

    // 2. Logic Flow

    // A. It's a New Item (Never had it)
    if (notCollected) {
        result.actionColor = 'text-emerald-500';
        result.seedlingAction = '立刻種植';
        result.pikminAction = '立刻探險';
        result.reason = '新飾品！尚未解鎖圖鑑。';
        result.mode = 'NEW_DISCOVERY';
        return result;
    }

    // B. It's an Existing Item (Duplicate)
    
    // Case B1: It is a Rare Variant itself
    if (isRare) {
        // If we have it (referenced by isCollected), then it's a Duplicate Rare.
        result.actionColor = 'text-gray-500';
        result.seedlingAction = '回收';
        result.pikminAction = '釋放';
        result.reason = '已擁有的稀有飾品。';
        result.mode = 'COMPLETE';
        return result;
    }

    // Case B2: It is a Basic Variant
    // Check Modes
    if (basicComplete) {
        // Mode: RARE GRINDING (Basics are done)
        result.mode = 'RARE_GRINDING';

        // Sub-case: Multi-Visual Check (Even if Basic Complete)
        // If it's a Ticket, user might still want it.
        // But Rare Grinding usually implies we want the RARE one.
        // IF the multi-visual basic is collected, do we want another?
        // Maybe. "Check Design".
        if (hasMultiVisuals) {
            result.actionColor = 'text-amber-500';
            result.seedlingAction = '種植 (確認圖案)';
            result.pikminAction = '培養四星 (確認圖案)';
            result.reason = '⚠️ 此飾品有同色多種樣式 (如日期、地點)，需培養後才能確認。';
            // We don't return here immediately, we need to check rare too?
            // If we need rare, we DEFINITELY keep.
            // If we don't need rare, we STILL might keep for visual.
            // So "Check Design" overrides "Release".
        }

        if (hasRareVariant) {
            // Check if we have the Rare version of THIS color
            const rareStatus = collection[rareVariant.id]?.[color] || DECOR_STATUS.NOT_COLLECTED;
            const haveRare = rareStatus >= DECOR_STATUS.GROWING;

            if (!haveRare) {
                // We need it!
                result.actionColor = 'text-amber-500';
                result.seedlingAction = '種植 (拼稀有)';
                result.pikminAction = '保留 (拼稀有)';
                result.reason = '基本款已齊，正在收集異色/稀有版本。';
                return result;
            } else {
                // We have the rare too.
                // If Multi-Visual, revert to "Check Design" advice from above?
                if (hasMultiVisuals) {
                     // Already set above? No, I overwrote logic flow.
                     // Let's refactor return.
                     return result; 
                }
                
                result.actionColor = 'text-gray-500';
                result.seedlingAction = '回收';
                result.pikminAction = '釋放';
                result.reason = '基本款與稀有款皆已收藏。';
                return result;
            }
        } else {
             // No Rare variant exists
             if (hasMultiVisuals) {
                 return result; // Use the "Check Design" from earlier
             }

             result.actionColor = 'text-gray-500';
             result.seedlingAction = '回收';
             result.pikminAction = '釋放';
             result.reason = '此分類已畢業 (無稀有版本)。';
             return result;
        }

    } else {
        // Mode: PRIORITIZE_NEW (Basics NOT done)
        result.mode = 'PRIORITIZE_NEW';
        
        // Multi-Visual Check
        if (hasMultiVisuals) {
            result.actionColor = 'text-amber-500';
            result.seedlingAction = '種植 (確認圖案)';
            result.pikminAction = '培養四星 (確認圖案)';
            result.reason = '⚠️ 此飾品有同色多種樣式，需培養後才能確認。';
            return result;
        }

        // We are missing some basics.
        // Since this IS a duplicate (checked by isCollected), act based on priority.
        
        // User Rule Update: Seedlings have no space limit. 
        // If it has a future use (Rare Variant exists), Keep the seedling.
        if (hasRareVariant) {
             result.actionColor = 'text-gray-500'; 
             result.seedlingAction = '保留 (未來拼稀有)';
             result.pikminAction = '暫不探險 / 釋放';
             result.reason = '優先保留空間給新飾品 (但花苗無空間壓力可留)。'; 
             return result;
        } else {
             // No rare variant, truly useless duplicate
             result.actionColor = 'text-gray-500';
             result.seedlingAction = '回收';
             result.pikminAction = '暫不探險 / 釋放';
             result.reason = '優先保留空間給未取得的基本款。'; 
             return result;
        }
    }
};
