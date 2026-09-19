import React from 'react';
import { useUIStore } from '../store';
import { usePreferencesStore } from '../store/preferencesStore';
import { Layers } from 'lucide-react';

// The 8 defined snap positions (0–100)
const SNAP_POINTS = [0, 15, 30, 45, 60, 75, 90, 100];
const SNAP_LABELS: Record<number, string> = {
  0: 'Bare Grid',
  15: 'Solder Traces',
  30: 'Solder Bridges',
  45: 'Jumper Wires',
  60: 'Solder Joints',
  75: 'Component Bodies',
  90: 'Component Labels',
  100: 'All Layers',
};

const getScrubberLabel = (value: number) => {
  if (value < 20) return 'Bare Board';
  if (value < 40) return 'Traces & Jumps';
  if (value < 60) return 'Components';
  if (value < 80) return 'Labels';
  return 'All Layers Visible';
};

const snapToNearest = (value: number): number => {
  return SNAP_POINTS.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
};

export const LayerScrubber: React.FC = () => {
  const { scrubberValue, setScrubberValue } = useUIStore();
  const { layerScrubberSnap } = usePreferencesStore();

  const handleChange = (raw: number) => {
    const value = layerScrubberSnap ? snapToNearest(raw) : raw;
    setScrubberValue(value);
  };

  // Snap label when snapping is on
  const displayLabel = layerScrubberSnap
    ? (SNAP_LABELS[scrubberValue] ?? getScrubberLabel(scrubberValue))
    : getScrubberLabel(scrubberValue);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-hover/90 backdrop-blur border border-subtle rounded-full px-6 py-2 flex items-center gap-4 shadow-xl z-20">
      <Layers className="w-5 h-5 text-muted" />
      
      <div className="flex flex-col w-64">
        <div className="flex justify-between text-[10px] text-muted uppercase tracking-wider mb-1 font-bold">
          <span>Board</span>
          <span className="text-emerald-500">{displayLabel}</span>
          <span>All</span>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          value={scrubberValue}
          onChange={(e) => handleChange(parseInt(e.target.value))}
          className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer accent-blue-500"
        />

        {layerScrubberSnap && (
          <div className="flex justify-between mt-1">
            {SNAP_POINTS.map(p => (
              <button
                key={p}
                onClick={() => setScrubberValue(p)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  scrubberValue === p ? 'bg-emerald-500' : 'bg-muted hover:bg-main'
                }`}
                title={SNAP_LABELS[p]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
