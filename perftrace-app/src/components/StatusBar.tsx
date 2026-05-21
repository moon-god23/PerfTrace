import React from 'react';
import { useUIStore } from '../store';

const columnToLetter = (col: number) => {
  let letter = '';
  let temp = col;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

export const StatusBar: React.FC = () => {
  const { cursorHole, zoom, advisorWarnings, setActiveRightTab } = useUIStore();

  let coordinateDisplay = '-';
  if (cursorHole) {
    const colStr = columnToLetter(cursorHole.col);
    const rowStr = cursorHole.row + 1;
    coordinateDisplay = `${colStr}${rowStr}`;
  }

  const warningCount    = advisorWarnings.filter(w => w.severity === 'warning' || w.severity === 'high' || w.severity === 'critical').length;
  const suggestionCount = advisorWarnings.filter(w => w.severity === 'suggestion').length;
  const hasAny = warningCount > 0 || suggestionCount > 0;

  return (
    <div className="h-8 bg-[#0f111a] border-t border-[#2a2d3e] flex items-center justify-between px-6 text-[11px] text-[#4b5563] select-none z-10 w-full shrink-0 font-sans tracking-wide">
      <div className="flex items-center space-x-6">
        <span>Hole: <strong className="text-[#10b981] font-medium ml-1">{coordinateDisplay}</strong></span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Warning badges */}
        {!hasAny && (
          <span className="text-emerald-600 text-[10px] font-medium flex items-center gap-1">
            ✅ No issues
          </span>
        )}
        {warningCount > 0 && (
          <button
            onClick={() => setActiveRightTab('advisor')}
            title="Open Trace Advisor"
            className="flex items-center gap-1 text-yellow-500 hover:text-yellow-300 transition-colors"
          >
            <span>🟡</span>
            <span className="font-semibold">{warningCount}</span>
          </button>
        )}
        {suggestionCount > 0 && (
          <button
            onClick={() => setActiveRightTab('advisor')}
            title="Open Trace Advisor"
            className="flex items-center gap-1 text-blue-400 hover:text-blue-200 transition-colors"
          >
            <span>💡</span>
            <span className="font-semibold">{suggestionCount}</span>
          </button>
        )}

        <span className="text-[#2a2d3e]">|</span>
        <span>Scroll to zoom • Middle-drag to pan</span>
      </div>
    </div>
  );
};
