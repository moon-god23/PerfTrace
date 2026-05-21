import React, { useEffect } from 'react';
import { Zap, X } from 'lucide-react';

interface TraceCompletionPopupProps {
  /** Viewport pixel position to anchor near (typically last trace endpoint) */
  x: number;
  y: number;
  onKeep: () => void;
  onSwitch: () => void;
}

export const TraceCompletionPopup: React.FC<TraceCompletionPopupProps> = ({
  x,
  y,
  onKeep,
  onSwitch,
}) => {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onKeep, 4000);
    return () => clearTimeout(timer);
  }, [onKeep]);

  // Clamp to viewport
  const popupX = Math.min(x, window.innerWidth - 280);
  const popupY = Math.max(y - 100, 8);

  return (
    <div
      className="absolute z-50 w-64 bg-[#1e2136] border border-[#3b82f6]/60 rounded-lg shadow-2xl shadow-black/60 p-3 pointer-events-auto"
      style={{ left: popupX, top: popupY }}
    >
      <div className="flex items-start gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-blue-300 mb-0.5">HF Signal Detected</p>
          <p className="text-[11px] text-gray-300 leading-relaxed">
            Wire jumpers minimise parasitic inductance on HF signals. Switch this trace?
          </p>
        </div>
        <button
          onClick={onKeep}
          className="ml-auto text-[#4b5563] hover:text-gray-300 transition-colors shrink-0"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSwitch}
          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors"
        >
          Switch to Wire
        </button>
        <button
          onClick={onKeep}
          className="flex-1 py-1.5 bg-[#2a2d45] hover:bg-[#353860] text-gray-300 text-xs font-medium rounded transition-colors border border-[#3b4168]"
        >
          Keep Solder
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="mt-2 h-0.5 bg-[#2a2d45] rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500/60 rounded-full"
          style={{ animation: 'shrink 4s linear forwards' }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
