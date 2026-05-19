import React from 'react';
import { Zap, Ruler, RefreshCw, MousePointer2, PenTool, Pencil, Spline, Link, Eraser, Undo, Redo, FlipVertical } from 'lucide-react';
import { useBoardStore, useUIStore } from '../store';
import type { DrawingTool, SignalType } from '../types';
import { clsx } from 'clsx';

export const Toolbar: React.FC = () => {
  const { rows, cols, undo, redo, past, future } = useBoardStore();
  const { zoom, setIsBoardSizeModalOpen, activeTool, setActiveTool, activeSignalType, setActiveSignalType, boardSide, setBoardSide } = useUIStore();

  const tools: { id: DrawingTool; icon: React.FC<any>; tooltip: string }[] = [
    { id: 'select', icon: MousePointer2, tooltip: 'Select (S)' },
    { id: 'pen', icon: PenTool, tooltip: 'Pen Tool (P)' },
    { id: 'freehand', icon: Pencil, tooltip: 'Freehand Trace (F)' },
    { id: 'wire', icon: Spline, tooltip: 'Wire Jump (W)' },
    { id: 'solder_bridge', icon: Link, tooltip: 'Solder Bridge (B)' },
    { id: 'eraser', icon: Eraser, tooltip: 'Trace Eraser (E)' },
  ];

  const signalTypes: { id: SignalType; color: string; label: string }[] = [
    { id: 'power', color: 'bg-red-500', label: 'Power' },
    { id: 'ground', color: 'bg-black', label: 'Ground' },
    { id: 'hf_data', color: 'bg-blue-500', label: 'HF Data' },
    { id: 'lf_data', color: 'bg-green-500', label: 'LF Data' },
    { id: 'unknown', color: 'bg-gray-400', label: 'Unknown' },
  ];

  return (
    <div className="h-14 bg-[#141622] border-b border-[#2a2d3e] flex items-center px-4 shrink-0 w-full z-10 shadow-md justify-between font-sans">
      <div className="flex items-center space-x-4">
        {/* Logo */}
        <div className="flex items-center space-x-2 mr-2">
          <Zap className="w-5 h-5 text-[#f59e0b]" fill="#f59e0b" />
          <span className="text-xl font-bold tracking-wide text-[#10b981]">PerfTrace</span>
        </div>
        
        {/* Drawing Tools */}
        <div className="flex items-center bg-[#1e2136] rounded p-1 border border-[#2a2d3e]">
          {tools.map(tool => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                title={tool.tooltip}
                onClick={() => setActiveTool(tool.id)}
                className={clsx(
                  "p-1.5 rounded transition-colors",
                  isActive ? "bg-[#10b981] text-white" : "text-[#8b92b2] hover:text-white hover:bg-[#2a2d45]"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Signal Type Selector */}
        <div className="flex items-center bg-[#1e2136] rounded p-1 border border-[#2a2d3e] space-x-1">
          {signalTypes.map(sig => (
            <button
              key={sig.id}
              title={sig.label}
              onClick={() => setActiveSignalType(sig.id)}
              className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                activeSignalType === sig.id ? "ring-2 ring-white ring-offset-1 ring-offset-[#1e2136]" : "opacity-60 hover:opacity-100"
              )}
            >
              <span className={clsx("w-4 h-4 rounded-full border border-gray-600/50", sig.color)} />
            </button>
          ))}
        </div>

        {/* Board Side Toggle */}
        <div className="flex items-center bg-[#1e2136] rounded p-1 border border-[#2a2d3e] text-xs font-medium">
          <button
            onClick={() => setBoardSide('top')}
            className={clsx(
              "px-3 py-1.5 rounded transition-colors",
              boardSide === 'top' ? "bg-[#3b82f6] text-white" : "text-[#8b92b2] hover:text-white hover:bg-[#2a2d45]"
            )}
          >
            Top
          </button>
          <button
            onClick={() => setBoardSide('bottom')}
            className={clsx(
              "px-3 py-1.5 rounded flex items-center gap-1 transition-colors",
              boardSide === 'bottom' ? "bg-[#3b82f6] text-white" : "text-[#8b92b2] hover:text-white hover:bg-[#2a2d45]"
            )}
          >
            <FlipVertical className="w-3 h-3" />
            Bottom
          </button>
        </div>

        {/* History */}
        <div className="flex items-center bg-[#1e2136] rounded p-1 border border-[#2a2d3e]">
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="p-1.5 text-[#8b92b2] hover:text-white hover:bg-[#2a2d45] rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="p-1.5 text-[#8b92b2] hover:text-white hover:bg-[#2a2d45] rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Right side info */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => setIsBoardSizeModalOpen(true)}
          className="px-3 py-1 bg-[#1e2136] hover:bg-[#2a2d45] border border-[#2a2d3e] text-gray-300 rounded text-xs font-medium flex items-center transition-colors">
          <Ruler className="w-3.5 h-3.5 mr-1.5 text-[#8b92b2]" />
          Board
        </button>
        <button 
          onClick={() => {
            useUIStore.getState().setZoom(1);
            useUIStore.getState().setPan({ x: 100, y: 100 });
          }}
          className="px-3 py-1 bg-[#1e2136] hover:bg-[#2a2d45] border border-[#2a2d3e] text-gray-300 rounded text-xs font-medium flex items-center transition-colors">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-[#8b92b2]" />
          View
        </button>
        <div className="flex items-center space-x-2 text-[10px] font-medium text-[#6b7280] ml-2">
           <span>{cols}×{rows}</span>
           <span>•</span>
           <span>{Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
