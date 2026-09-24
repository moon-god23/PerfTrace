import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useUIStore } from '../store';

interface ShortcutItem {
  keys: string[];
  desc: string;
}

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, setIsShortcutsModalOpen } = useUIStore();

  if (!isShortcutsModalOpen) return null;

  const sections: { title: string; shortcuts: ShortcutItem[] }[] = [
    {
      title: 'File & Project',
      shortcuts: [
        { keys: ['Ctrl', 'P'], desc: 'Print / Export 1:1 Layout' },
        { keys: ['Ctrl', 'N'], desc: 'New Blank Project' },
        { keys: ['Ctrl', 'O'], desc: 'Open .ptrace Project' },
        { keys: ['Ctrl', 'S'], desc: 'Save Project' },
        { keys: ['Ctrl', 'Shift', 'S'], desc: 'Save Project As...' },
        { keys: ['Ctrl', ','], desc: 'Open Preferences' },
      ],
    },
    {
      title: 'Canvas & Navigation',
      shortcuts: [
        { keys: ['Scroll'], desc: 'Zoom In / Out' },
        { keys: ['Ctrl', '+ / -'], desc: 'Zoom In / Out' },
        { keys: ['Ctrl', '0'], desc: 'Reset View (100% Zoom)' },
        { keys: ['Middle Drag'], desc: 'Pan Board' },
        { keys: ['Space', 'Drag'], desc: 'Pan Board' },
      ],
    },
    {
      title: 'Drawing Tools',
      shortcuts: [
        { keys: ['S'], desc: 'Select / Move Tool' },
        { keys: ['P'], desc: 'Orthogonal Pen Tool (90° / 45°)' },
        { keys: ['F'], desc: 'Freehand Trace Tool' },
        { keys: ['W'], desc: 'Top-Side Wire Jumper' },
        { keys: ['B'], desc: 'Solder Bridge Tool' },
        { keys: ['E'], desc: 'Trace Eraser' },
      ],
    },
    {
      title: 'Edit & Selection',
      shortcuts: [
        { keys: ['Ctrl', 'Z'], desc: 'Undo' },
        { keys: ['Ctrl', 'Y'], desc: 'Redo' },
        { keys: ['Del', 'Backspace'], desc: 'Delete Selected Trace or Component' },
        { keys: ['Esc'], desc: 'Cancel Drawing / Deselect' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="bg-surface-panel border border-subtle rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-subtle bg-surface-base/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-main">Keyboard Shortcuts</h2>
              <p className="text-xs text-muted">Quick reference for rapid prototyping</p>
            </div>
          </div>
          <button
            onClick={() => setIsShortcutsModalOpen(false)}
            className="p-1 rounded-lg text-muted hover:text-main hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((sec) => (
              <div key={sec.title} className="bg-surface-base/60 border border-subtle rounded-lg p-3 space-y-2.5">
                <h3 className="font-semibold text-main tracking-wider uppercase text-[11px] text-emerald-500">
                  {sec.title}
                </h3>
                <div className="space-y-1.5">
                  {sec.shortcuts.map((sc, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-muted">{sc.desc}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, ki) => (
                          <kbd
                            key={ki}
                            className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-surface-hover text-main border border-subtle shadow-xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-subtle bg-surface-base/50 flex justify-end">
          <button
            onClick={() => setIsShortcutsModalOpen(false)}
            className="px-4 py-1.5 text-xs rounded-lg font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
