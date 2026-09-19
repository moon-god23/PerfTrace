import React, { useState, useEffect } from 'react';
import { useUIStore } from '../store';
import { usePreferencesStore } from '../store/preferencesStore';
import type { DrawingTool } from '../types';
import { Wifi, WifiOff } from 'lucide-react';

const columnToLetter = (col: number) => {
  let letter = '';
  let temp = col;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

const TOOL_LABELS: Record<DrawingTool, string> = {
  select:        'Select',
  pen:           'Pen',
  freehand:      'Freehand',
  wire:          'Wire Jump',
  solder_bridge: 'Solder Bridge',
  eraser:        'Eraser',
};

const TOOL_ICONS: Record<DrawingTool, string> = {
  select:        '↖',
  pen:           '✒',
  freehand:      '✏',
  wire:          '〰',
  solder_bridge: '⊕',
  eraser:        '⌫',
};

export const StatusBar: React.FC = () => {
  const { cursorHole, zoom, advisorWarnings, setActiveRightTab, activeTool } = useUIStore();
  const { showHoleCoordinates } = usePreferencesStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  let coordinateDisplay = '–';
  if (cursorHole) {
    const colStr = columnToLetter(cursorHole.col);
    const rowStr = cursorHole.row + 1;
    coordinateDisplay = `${colStr}${rowStr}`;
  }

  const warningCount    = advisorWarnings.filter(w => w.severity === 'warning' || w.severity === 'high' || w.severity === 'critical').length;
  const suggestionCount = advisorWarnings.filter(w => w.severity === 'suggestion').length;
  const hasAny = warningCount > 0 || suggestionCount > 0;

  return (
    <div className="h-8 bg-surface-base border-t border-subtle flex items-center justify-between px-4 text-[11px] text-muted select-none z-10 w-full shrink-0 font-sans tracking-wide">
      {/* Left: tool + hole coordinate */}
      <div className="flex items-center space-x-4">
        <span className="flex items-center gap-1.5">
          <span className="text-muted">{TOOL_ICONS[activeTool]}</span>
          <span className="text-muted font-medium">{TOOL_LABELS[activeTool]}</span>
        </span>
        <span className="text-[#2a2d3e]">|</span>
        {showHoleCoordinates && (
          <span>
            Hole: <strong className="text-emerald-500 font-medium ml-1">{coordinateDisplay}</strong>
          </span>
        )}
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>

      {/* Right: warnings + online status */}
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

        {/* Online/Offline indicator */}
        {isOnline ? (
          <span className="flex items-center gap-1 text-emerald-600" title="Online — Cloud AI available">
            <Wifi className="w-3 h-3" />
            <span className="hidden sm:inline">Online</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[#ef4444]" title="Offline — AI features unavailable">
            <WifiOff className="w-3 h-3" />
            <span className="hidden sm:inline">Offline</span>
          </span>
        )}

        <span className="text-[#2a2d3e] hidden sm:inline">|</span>
        <span className="hidden sm:inline">Scroll to zoom • Middle-drag to pan</span>
      </div>
    </div>
  );
};
