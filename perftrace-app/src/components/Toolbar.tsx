import React, { useRef, useState } from 'react';
import {
  Zap, Ruler, RefreshCw, MousePointer2, PenTool, Pencil,
  Spline, Link, Eraser, Undo, Redo, FlipVertical,
  FilePlus, FolderOpen, Save, SaveAll,
} from 'lucide-react';
import { useBoardStore, useUIStore } from '../store';
import type { DrawingTool, SignalType } from '../types';
import { clsx } from 'clsx';
import { useFileOps } from '../hooks/useFileOps';

export const Toolbar: React.FC = () => {
  const { rows, cols, undo, redo, past, future, isDirty, projectName, setProjectName } = useBoardStore();
  const { zoom, setIsBoardSizeModalOpen, activeTool, setActiveTool, activeSignalType, setActiveSignalType, boardSide, setBoardSide } = useUIStore();

  const { newProject, openProject, saveProject, saveAsProject } = useFileOps();

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
    <div className="h-14 bg-[#141622] border-b border-[#2a2d3e] flex items-center justify-between px-2 sm:px-3 shrink-0 w-full z-10 shadow-md font-sans gap-2 select-none overflow-hidden">
      {/* ── 1. Left Pinned Section (Brand & File Ops) ────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Logo */}
        <div className="flex items-center space-x-1.5 mr-0.5 shrink-0" title="PerfTrace">
          <Zap className="w-5 h-5 text-[#f59e0b]" fill="#f59e0b" />
          <span className="text-xl font-bold tracking-wide text-[#10b981] hidden md:inline">PerfTrace</span>
        </div>

        {/* File Operations */}
        <div className="flex items-center bg-[#1e2136] rounded p-1 border border-[#2a2d3e] gap-0.5 shrink-0">
          <button
            title="New Project (Ctrl+N)"
            onClick={newProject}
            className="p-1.5 rounded text-[#8b92b2] hover:text-white hover:bg-[#2a2d45] transition-colors"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button
            title="Open Project (Ctrl+O)"
            onClick={openProject}
            className="p-1.5 rounded text-[#8b92b2] hover:text-white hover:bg-[#2a2d45] transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            title="Save (Ctrl+S)"
            onClick={saveProject}
            className="p-1.5 rounded text-[#8b92b2] hover:text-white hover:bg-[#2a2d45] transition-colors"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            title="Save As (Ctrl+Shift+S)"
            onClick={saveAsProject}
            className="p-1.5 rounded text-[#8b92b2] hover:text-white hover:bg-[#2a2d45] transition-colors"
          >
            <SaveAll className="w-4 h-4" />
          </button>
        </div>

        {/* Project Name */}
        <div className="flex items-center gap-1 min-w-0 max-w-[70px] sm:max-w-[110px] md:max-w-[150px]">
          {isDirty && (
            <span className="text-[#f59e0b] text-lg leading-none shrink-0" title="Unsaved changes">●</span>
          )}
          {editingName ? (
            <input
              ref={nameInputRef}
              className="bg-[#1e2136] border border-[#3b82f6] rounded px-2 py-0.5 text-xs sm:text-sm text-white outline-none min-w-0 w-24 sm:w-32"
              value={nameValue}
              autoFocus
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName();
                if (e.key === 'Escape') { setNameValue(projectName); setEditingName(false); }
              }}
            />
          ) : (
            <span
              className="text-xs sm:text-sm text-[#9ca3af] hover:text-white cursor-pointer truncate"
              title={`Project: ${projectName} (Double-click to rename)`}
              onDoubleClick={() => { setNameValue(projectName); setEditingName(true); }}
            >
              {projectName}
            </span>
          )}
        </div>

        <div className="w-px h-5 bg-[#2a2d3e] shrink-0 hidden sm:block" />
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
        <div className="flex items-center bg-[#1e2136] rounded p-1 border border-[#2a2d3e] shrink-0">
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
        <div className="flex items-center bg-[#1e2136] rounded p-1 border border-[#2a2d3e] space-x-1 shrink-0">
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
        <div className="flex items-center bg-[#1e2136] rounded p-1 border border-[#2a2d3e] text-xs font-medium shrink-0">
          <button
            onClick={() => setBoardSide('top')}
            className={clsx(
              "px-2 sm:px-2.5 py-1 sm:py-1.5 rounded transition-colors",
              boardSide === 'top' ? "bg-[#3b82f6] text-white" : "text-[#8b92b2] hover:text-white hover:bg-[#2a2d45]"
            )}
            title="Top Side"
          >
            Top
          </button>
          <button
            onClick={() => setBoardSide('bottom')}
            className={clsx(
              "px-2 sm:px-2.5 py-1 sm:py-1.5 rounded flex items-center gap-1 transition-colors",
              boardSide === 'bottom' ? "bg-[#3b82f6] text-white" : "text-[#8b92b2] hover:text-white hover:bg-[#2a2d45]"
            )}
            title="Bottom Side"
          >
            <FlipVertical className="w-3 h-3" />
            <span className="hidden sm:inline">Bottom</span>
            <span className="sm:hidden">Bot</span>
          </button>
        </div>

        {/* History */}
        <div className="flex items-center bg-[#1e2136] rounded p-1 border border-[#2a2d3e] shrink-0">
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

      {/* ── 3. Right Pinned Section (ALWAYS VISIBLE ON SCREEN) ───────────── */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 pl-1.5">
        <button
          title="Board Dimensions"
          onClick={() => setIsBoardSizeModalOpen(true)}
          className="px-2 sm:px-2.5 py-1.5 bg-[#1e2136] hover:bg-[#2a2d45] border border-[#2a2d3e] text-gray-200 hover:text-white rounded text-xs font-medium flex items-center transition-colors shrink-0 shadow-sm"
        >
          <Ruler className="w-3.5 h-3.5 sm:mr-1.5 text-[#8b92b2]" />
          <span className="hidden sm:inline">Board</span>
        </button>
        <button
          title="Reset View"
          onClick={() => {
            useUIStore.getState().setZoom(1);
            useUIStore.getState().setPan({ x: 100, y: 100 });
          }}
          className="px-2 sm:px-2.5 py-1.5 bg-[#1e2136] hover:bg-[#2a2d45] border border-[#2a2d3e] text-gray-200 hover:text-white rounded text-xs font-medium flex items-center transition-colors shrink-0 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 sm:mr-1.5 text-[#8b92b2]" />
          <span className="hidden sm:inline">View</span>
        </button>
        <div className="hidden xl:flex items-center space-x-1.5 text-[10px] font-medium text-[#6b7280] ml-1 shrink-0">
          <span>{cols}×{rows}</span>
          <span>•</span>
          <span>{Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
