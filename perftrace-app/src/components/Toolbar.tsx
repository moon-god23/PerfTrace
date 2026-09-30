import React, { useRef, useState } from 'react';
import {
  Ruler, RefreshCw, MousePointer2, PenTool, Pencil,
  Spline, Link, Eraser, Undo, Redo, FlipVertical,
  Settings, ZoomIn, ZoomOut, Printer, Edit3,
} from 'lucide-react';
import { useBoardStore, useUIStore } from '../store';
import type { DrawingTool, SignalType } from '../types';
import { clsx } from 'clsx';

export const Toolbar: React.FC = () => {
  const { rows, cols, undo, redo, past, future, isDirty, projectName, setProjectName } = useBoardStore();
  const { zoom, setZoom, setIsBoardSizeModalOpen, activeTool, setActiveTool, activeSignalType, setActiveSignalType, boardSide, setBoardSide, isPreferencesOpen, setIsPreferencesOpen, setIsPrintModalOpen } = useUIStore();

  const zoomIn  = () => setZoom(Math.min(zoom * 1.2, 5));
  const zoomOut = () => setZoom(Math.max(zoom / 1.2, 0.1));

  // Inline project-name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(projectName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const commitName = () => {
    const trimmed = nameValue.trim() || 'Untitled Project';
    setProjectName(trimmed);
    setNameValue(trimmed);
    setEditingName(false);
  };

  const tools: { id: DrawingTool; icon: React.ComponentType<{ className?: string }>; tooltip: string }[] = [
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
    <div className="h-12 bg-surface-panel border-b border-subtle flex items-center justify-between px-2 sm:px-3 shrink-0 w-full z-10 shadow-sm font-sans gap-2 select-none overflow-hidden">
      {/* ── 1. Left Pinned Section (Project Title & Status) ────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="flex items-center gap-2 bg-surface-hover/80 hover:bg-surface-hover border border-subtle px-2.5 py-1.5 rounded-lg transition-colors group cursor-pointer"
          title={`Project: ${projectName} (Click to rename)`}
          onClick={() => { if (!editingName) { setNameValue(projectName); setEditingName(true); } }}
        >
          {isDirty ? (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="Unsaved changes" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500/70 shrink-0" title="All changes saved" />
          )}

          {editingName ? (
            <input
              ref={nameInputRef}
              className="bg-surface-base border border-blue-500 rounded px-2 py-0.5 text-xs text-main outline-none w-32 sm:w-40 font-medium"
              value={nameValue}
              autoFocus
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName();
                if (e.key === 'Escape') { setNameValue(projectName); setEditingName(false); }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-main truncate max-w-[120px] sm:max-w-[180px]">
                {projectName}
              </span>
              <Edit3 className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-subtle shrink-0 hidden sm:block" />
      </div>

      {/* ── 2. Middle Scrollable / Flexible Tool Strip ────────────────────── */}
      <div
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto overflow-y-hidden toolbar-scroll py-1 px-1 justify-start md:justify-center"
      >
        {/* Drawing Tools */}
        <div className="flex items-center bg-surface-hover rounded p-1 border border-subtle shrink-0">
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
                  isActive ? "bg-[#10b981] text-main" : "text-muted hover:text-main hover:bg-surface-active"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Signal Type Selector */}
        <div className="flex items-center bg-surface-hover rounded p-1 border border-subtle space-x-1 shrink-0">
          {signalTypes.map(sig => (
            <button
              key={sig.id}
              title={`Signal: ${sig.label}`}
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
        <div className="flex items-center bg-surface-hover rounded p-1 border border-subtle text-xs font-medium shrink-0">
          <button
            onClick={() => setBoardSide('top')}
            className={clsx(
              "px-2 sm:px-2.5 py-1 sm:py-1.5 rounded transition-colors",
              boardSide === 'top' ? "bg-blue-500 text-main" : "text-muted hover:text-main hover:bg-surface-active"
            )}
            title="Top Side"
          >
            Top
          </button>
          <button
            onClick={() => setBoardSide('bottom')}
            className={clsx(
              "px-2 sm:px-2.5 py-1 sm:py-1.5 rounded flex items-center gap-1 transition-colors",
              boardSide === 'bottom' ? "bg-blue-500 text-main" : "text-muted hover:text-main hover:bg-surface-active"
            )}
            title="Bottom Side"
          >
            <FlipVertical className="w-3 h-3" />
            <span className="hidden sm:inline">Bottom</span>
            <span className="sm:hidden">Bot</span>
          </button>
        </div>

        {/* History */}
        <div className="flex items-center bg-surface-hover rounded p-1 border border-subtle shrink-0">
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="p-1.5 text-muted hover:text-main hover:bg-surface-active rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="p-1.5 text-muted hover:text-main hover:bg-surface-active rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 3. Right Pinned Section (ALWAYS VISIBLE ON SCREEN) ───────────── */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 pl-1.5">
        <button
          title="Print 1:1 Scale Layout (Ctrl+P)"
          onClick={() => setIsPrintModalOpen(true)}
          className="px-2 sm:px-2.5 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded text-xs font-medium flex items-center transition-colors shrink-0 shadow-sm"
        >
          <Printer className="w-3.5 h-3.5 sm:mr-1.5 text-emerald-500" />
          <span className="hidden sm:inline">Print 1:1</span>
        </button>
        <button
          title="Board Dimensions"
          onClick={() => setIsBoardSizeModalOpen(true)}
          className="px-2 sm:px-2.5 py-1.5 bg-surface-hover hover:bg-surface-active border border-subtle text-main hover:text-main rounded text-xs font-medium flex items-center transition-colors shrink-0 shadow-sm"
        >
          <Ruler className="w-3.5 h-3.5 sm:mr-1.5 text-muted" />
          <span className="hidden sm:inline">Board</span>
        </button>
        <button
          title="Reset View"
          onClick={() => {
            useUIStore.getState().setZoom(1);
            useUIStore.getState().setPan({ x: 100, y: 100 });
          }}
          className="px-2 sm:px-2.5 py-1.5 bg-surface-hover hover:bg-surface-active border border-subtle text-main hover:text-main rounded text-xs font-medium flex items-center transition-colors shrink-0 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 sm:mr-1.5 text-muted" />
          <span className="hidden sm:inline">View</span>
        </button>

        {/* Zoom controls */}
        <div className="flex items-center bg-surface-hover rounded border border-subtle shrink-0">
          <button
            title="Zoom Out"
            onClick={zoomOut}
            className="p-1.5 text-muted hover:text-main hover:bg-surface-active rounded-l transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-[10px] font-mono text-muted min-w-[38px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            title="Zoom In"
            onClick={zoomIn}
            className="p-1.5 text-muted hover:text-main hover:bg-surface-active rounded-r transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="hidden xl:flex items-center text-[10px] font-medium text-muted shrink-0">
          <span>{cols}×{rows}</span>
        </div>

        {/* Settings / Preferences */}
        <button
          title="Preferences"
          onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
          className={`p-1.5 rounded border transition-colors shrink-0 ${
            isPreferencesOpen
              ? 'bg-[#10b981]/20 border-[#10b981] text-emerald-500'
              : 'bg-surface-hover border-subtle text-muted hover:text-main hover:bg-surface-active'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
