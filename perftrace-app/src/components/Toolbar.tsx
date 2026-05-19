import React from 'react';
import { Zap, Ruler, RefreshCw } from 'lucide-react';
import { useBoardStore, useUIStore } from '../store';

export const Toolbar: React.FC = () => {
  const { rows, cols } = useBoardStore();
  const { zoom, setIsBoardSizeModalOpen } = useUIStore();

  return (
    <div className="h-14 bg-[#141622] border-b border-[#2a2d3e] flex items-center px-6 shrink-0 w-full z-10 shadow-md justify-between font-sans">
      <div className="flex items-center space-x-8">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-[#f59e0b]" fill="#f59e0b" />
          <span className="text-xl font-bold tracking-wide text-[#10b981]">PerfTrace</span>
        </div>
        
        {/* Buttons */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsBoardSizeModalOpen(true)}
            className="px-4 py-1.5 bg-[#1e2136] hover:bg-[#2a2d45] border border-[#2a2d3e] text-gray-300 rounded text-sm font-medium flex items-center transition-colors">
            <Ruler className="w-4 h-4 mr-2 text-[#8b92b2]" />
            Board Size
          </button>
          <button 
            onClick={() => {
              useUIStore.getState().setZoom(1);
              useUIStore.getState().setPan({ x: 100, y: 100 });
            }}
            className="px-4 py-1.5 bg-[#1e2136] hover:bg-[#2a2d45] border border-[#2a2d3e] text-gray-300 rounded text-sm font-medium flex items-center transition-colors">
            <RefreshCw className="w-4 h-4 mr-2 text-[#8b92b2]" />
            Reset View
          </button>
        </div>
      </div>
      
      {/* Right side info */}
      <div className="flex items-center space-x-4 text-xs font-medium text-[#6b7280]">
         <span>{cols} × {rows} holes</span>
         <span>•</span>
         <span>Zoom {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};
