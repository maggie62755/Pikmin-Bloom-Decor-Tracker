import React from 'react';
import { Sprout, Heart, Check } from 'lucide-react';

const PikminCard = ({ color, status, onClick, name }) => {
  const baseClasses = "relative w-full aspect-square rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 border-2 border-slate-200 shadow-sm hover:scale-105 active:scale-95";
  
  // Status logic
  // 0: Not Encountered (Gray, low opacity)
  // 1: Seedling (Sprout icon)
  // 2: Growing (Heart icon)
  // 3: Collected (Full color, Check icon optional or just clear)

  let statusClasses = "";
  let Icon = null;

  if (status === 0) {
    statusClasses = "bg-gray-200 opacity-30 grayscale";
  } else if (status === 1) {
    statusClasses = "bg-green-100 border-green-300";
    Icon = Sprout;
  } else if (status === 2) {
    statusClasses = "bg-pink-100 border-pink-300";
    Icon = Heart;
  } else if (status === 3) {
    statusClasses = `${color.bg} border-transparent`; // Use the color from constants
    // For status 3, we show the pure color.
  }

  // Handle dark colors for icon visibility if we had an icon on status 3
  const iconColor = status === 1 ? "text-green-600" : status === 2 ? "text-pink-500" : "text-white";

  return (
    <div 
      onClick={onClick}
      className={`${baseClasses} ${statusClasses}`}
      title={`${name} - ${color.name} (${['Unknown', 'Seedling', 'Growing', 'Collected'][status]})`}
    >
      {/* Icon Overlay for Status 1 & 2 */}
      {Icon && <Icon className={`w-1/2 h-1/2 ${iconColor}`} />}
      
      {/* Visual indicator for 'Collected' could be a small checkmark or just the pure color */}
      {status === 3 && (
        <div className="absolute bottom-0 right-0 p-0.5 bg-white rounded-full shadow-sm">
             <div className={`w-2 h-2 rounded-full ${color.bg}`} /> 
        </div>
      )}
    </div>
  );
};

export default PikminCard;
