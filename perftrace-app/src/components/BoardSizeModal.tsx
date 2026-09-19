import React, { useState } from 'react';
import { useBoardStore, useUIStore } from '../store';

export const BoardSizeModal: React.FC = () => {
  const { isBoardSizeModalOpen, setIsBoardSizeModalOpen } = useUIStore();
  const { rows, cols, setBoardSize } = useBoardStore();

  const [customCols, setCustomCols] = useState(cols.toString());
  const [customRows, setCustomRows] = useState(rows.toString());

  if (!isBoardSizeModalOpen) return null;

  const handleApplySize = (r: number, c: number) => {
    setBoardSize(r, c);
    setIsBoardSizeModalOpen(false);
  };

  const handleCustomApply = () => {
    const r = parseInt(customRows, 10);
    const c = parseInt(customCols, 10);
    if (!isNaN(r) && !isNaN(c) && r > 0 && c > 0) {
      handleApplySize(r, c);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-sans">
      <div className="bg-surface-panel border border-subtle rounded-lg shadow-2xl w-[400px] p-6 text-sm">
        <h2 className="text-emerald-500 font-bold text-lg mb-6">Select Board Size</h2>

        <div className="space-y-3 mb-8">
          <button 
            onClick={() => handleApplySize(15, 20)}
            className="w-full text-left px-4 py-3 bg-surface-hover hover:bg-surface-active border border-subtle text-main rounded font-medium transition-colors"
          >
            Small (15 × 20)
          </button>
          <button 
            onClick={() => handleApplySize(24, 30)}
            className="w-full text-left px-4 py-3 bg-surface-hover hover:bg-surface-active border border-subtle text-main rounded font-medium transition-colors"
          >
            Medium (24 × 30)
          </button>
          <button 
            onClick={() => handleApplySize(30, 70)}
            className="w-full text-left px-4 py-3 bg-surface-hover hover:bg-surface-active border border-subtle text-main rounded font-medium transition-colors"
          >
            Large (30 × 70)
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-muted mb-2">Custom</label>
          <div className="flex items-center space-x-2 text-muted">
            <input 
              type="text" 
              value={customCols}
              onChange={(e) => setCustomCols(e.target.value)}
              className="w-16 bg-surface-base border border-subtle rounded p-1.5 text-main text-center outline-none focus:border-[#10b981]"
            />
            <span>cols ×</span>
            <input 
              type="text" 
              value={customRows}
              onChange={(e) => setCustomRows(e.target.value)}
              className="w-16 bg-surface-base border border-subtle rounded p-1.5 text-main text-center outline-none focus:border-[#10b981]"
            />
            <span>rows</span>
            <div className="flex-1"></div>
            <button 
              onClick={handleCustomApply}
              className="px-4 py-1.5 bg-surface-base border border-[#10b981] text-emerald-500 hover:bg-[#10b981]/10 rounded font-medium transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        <button 
          onClick={() => setIsBoardSizeModalOpen(false)}
          className="w-full px-4 py-2 bg-surface-hover hover:bg-surface-active border border-subtle text-main rounded font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
