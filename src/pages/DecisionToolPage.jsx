import React from 'react';
import DecisionHelper from '../components/DecisionHelper';

const DecisionToolPage = () => {
    return (
        <div className="page-container">
            {/* Header Section */}
            <div className="section-header">
                <span className="section-label">
                    Decision Tool
                </span>
                <h2 className="section-title">決策助手
                    <p className="section-desc">/ 輸入你找到的皮克敏與顏色，根據目前的收集進度與目標，自動判斷是否應該保留。</p>
                </h2>
            </div>

            {/* Tool Component */}
            <DecisionHelper />

            {/* Instructions / Notes (Optional) */}
            <div className="bg-white/50 rounded-2xl p-6 text-sm text-gray-500 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-2">使用說明</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>開啟 <strong>Rare Grinding (🌟)</strong> 會在已收集基本款時，仍建議保留有稀有版本的皮克敏。</li>
                    <li>開啟 <strong>Prioritize New (🌱)</strong> 會建議優先處理全新未取得的飾品，暫緩已收集基本款的重複任務。</li>
                    <li>狀態顏色：<span className="text-emerald-500 font-bold">綠色 (建議保留)</span>、<span className="text-gray-400 font-bold">灰色 (建議釋放)</span>、<span className="text-amber-500 font-bold">黃色 (為了 Rare 保留)</span>。</li>
                </ul>
            </div>
        </div>
    );
};

export default DecisionToolPage;
