import React from 'react';
import { useUIStore } from '../store';
import { Layers } from 'lucide-react';

export const LayerScrubber: React.FC = () => {
  const { scrubberValue, setScrubberValue } = useUIStore();

  const getScrubberLabel = () => {
    if (scrubberValue < 20) return "Bare Board";
    if (scrubberValue < 40) return "Traces & Jumps";
    if (scrubberValue < 60) return "Components";
    if (scrubberValue < 80) return "Labels";
    return "All Layers Visible";
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1e2136]/90 backdrop-blur border border-[#2a2d3e] rounded-full px-6 py-2 flex items-center gap-4 shadow-xl z-20">
      <Layers className="w-5 h-5 text-[#8b92b2]" />
      
      <div className="flex flex-col w-64">
        <div className="flex justify-between text-[10px] text-[#8b92b2] uppercase tracking-wider mb-1 font-bold">
          <span>Board</span>
          <span className="text-[#10b981]">{getScrubberLabel()}</span>
          <span>All</span>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          value={scrubberValue}
          onChange={(e) => setScrubberValue(parseInt(e.target.value))}
          className="w-full h-2 bg-[#2a2d45] rounded-lg appearance-none cursor-pointer accent-[#3b82f6]"
        />
      </div>
    </div>
  );
};
