import React, { useState, useRef, useEffect } from 'react';
import {
  Zap, Printer, FilePlus, FolderOpen, Save, SaveAll,
  Settings, Undo2, Redo2, Trash2, Eye, Ruler,
  Info, Keyboard, Check, ZoomIn, ZoomOut, RefreshCw, FlipVertical
} from 'lucide-react';
import { useBoardStore, useUIStore } from '../store';
import { useFileOps } from '../hooks/useFileOps';
import { clsx } from 'clsx';

type MenuId = 'file' | 'edit' | 'view' | 'board' | 'help' | null;

export const MenuBar: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const {
    rows, cols, undo, redo, past, future, isDirty,
    clearAllTraces, clearAllComponents, projectName
  } = useBoardStore();

  const {
    zoom, setZoom, setPan, boardSide, setBoardSide,
    layerVisibility, setLayerVisibility,
    setIsBoardSizeModalOpen, setIsPreferencesOpen,
    setIsPrintModalOpen, setIsShortcutsModalOpen, setIsAboutModalOpen
  } = useUIStore();

  const { newProject, openProject, saveProject, saveAsProject } = useFileOps();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcuts (Ctrl+P, Ctrl+N, Ctrl+O, Ctrl+S, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Do not intercept if user is typing in an input or textarea
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPrintModalOpen(true);
      } else if (mod && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveProject();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveAsProject();
      } else if (mod && !e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        openProject();
      } else if (mod && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newProject();
      } else if (mod && !e.shiftKey && e.key === ',') {
        e.preventDefault();
        setIsPreferencesOpen(true);
      } else if (mod && (e.key === '0' || e.key === 'NumPad0')) {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 100, y: 100 });
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newProject, openProject, saveProject, saveAsProject, setIsPreferencesOpen, setIsPrintModalOpen, setIsShortcutsModalOpen, setPan, setZoom]);

  const handleMenuClick = (menu: MenuId) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleMenuHover = (menu: MenuId) => {
    if (openMenu !== null && openMenu !== menu) {
      setOpenMenu(menu);
    }
  };

  const closeAndRun = (action: () => void) => {
    setOpenMenu(null);
    action();
  };

  return (
    <div
      ref={menuBarRef}
      className="h-8 bg-surface-base border-b border-subtle flex items-center justify-between px-2 text-xs select-none relative z-30 shrink-0 font-sans"
    >
      {/* ── Left Side: App Brand + Menus ── */}
      <div className="flex items-center space-x-1">
        {/* Brand Icon */}
        <div 
          onClick={() => setIsAboutModalOpen(true)}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-surface-hover cursor-pointer text-amber-500 mr-1"
          title="About PerfTrace v1.1.0"
        >
          <Zap className="w-3.5 h-3.5 fill-amber-500" />
          <span className="font-bold text-main tracking-tight hidden sm:inline">PerfTrace</span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 font-semibold">
            v1.1
          </span>
        </div>

        {/* ── FILE MENU ── */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('file')}
            onMouseEnter={() => handleMenuHover('file')}
            className={clsx(
              "px-2 py-1 rounded transition-colors",
              openMenu === 'file' ? "bg-surface-active text-main" : "text-muted hover:text-main hover:bg-surface-hover"
            )}
          >
            File
          </button>

          {openMenu === 'file' && (
            <div className="absolute left-0 top-full mt-0.5 w-60 bg-surface-panel border border-subtle rounded-lg shadow-2xl py-1 z-40 backdrop-blur-md">
              <button
                onClick={() => closeAndRun(newProject)}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FilePlus className="w-3.5 h-3.5 text-blue-400" />
                  <span>New Project</span>
                </div>
                <kbd className="text-[10px] font-mono text-muted">Ctrl+N</kbd>
              </button>

              <button
                onClick={() => closeAndRun(openProject)}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Project...</span>
                </div>
                <kbd className="text-[10px] font-mono text-muted">Ctrl+O</kbd>
              </button>

              <button
                onClick={() => closeAndRun(saveProject)}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Project</span>
                </div>
                <kbd className="text-[10px] font-mono text-muted">Ctrl+S</kbd>
              </button>

              <button
                onClick={() => closeAndRun(saveAsProject)}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <SaveAll className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Save As...</span>
                </div>
                <kbd className="text-[10px] font-mono text-muted">Ctrl+Shift+S</kbd>
              </button>

              <div className="my-1 border-t border-subtle" />

              {/* 1:1 Scale Print / Export Action */}
              <button
                onClick={() => closeAndRun(() => setIsPrintModalOpen(true))}
                className="w-full px-3 py-1.5 flex items-center justify-between text-main bg-emerald-500/10 hover:bg-emerald-500/20 font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Print 1:1 Scale Layout...</span>
                </div>
                <kbd className="text-[10px] font-mono text-emerald-500 font-semibold">Ctrl+P</kbd>
              </button>

              <div className="my-1 border-t border-subtle" />

              <button
                onClick={() => closeAndRun(() => setIsPreferencesOpen(true))}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-gray-400" />
                  <span>Preferences...</span>
                </div>
                <kbd className="text-[10px] font-mono text-muted">Ctrl+,</kbd>
              </button>
            </div>
          )}
        </div>

        {/* ── EDIT MENU ── */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('edit')}
            onMouseEnter={() => handleMenuHover('edit')}
            className={clsx(
              "px-2 py-1 rounded transition-colors",
              openMenu === 'edit' ? "bg-surface-active text-main" : "text-muted hover:text-main hover:bg-surface-hover"
            )}
          >
            Edit
          </button>

          {openMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-0.5 w-56 bg-surface-panel border border-subtle rounded-lg shadow-2xl py-1 z-40 backdrop-blur-md">
              <button
                onClick={() => closeAndRun(undo)}
                disabled={past.length === 0}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </div>
                <kbd className="text-[10px] font-mono text-muted">Ctrl+Z</kbd>
              </button>

              <button
                onClick={() => closeAndRun(redo)}
                disabled={future.length === 0}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Redo2 className="w-3.5 h-3.5" />
                  <span>Redo</span>
                </div>
                <kbd className="text-[10px] font-mono text-muted">Ctrl+Y</kbd>
              </button>

              <div className="my-1 border-t border-subtle" />

              <button
                onClick={() => closeAndRun(() => {
                  if (window.confirm('Are you sure you want to clear all copper traces and wire jumpers?')) {
                    clearAllTraces();
                  }
                })}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Traces</span>
              </button>

              <button
                onClick={() => closeAndRun(() => {
                  if (window.confirm('Are you sure you want to remove all components from the board?')) {
                    clearAllComponents();
                  }
                })}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Components</span>
              </button>
            </div>
          )}
        </div>

        {/* ── VIEW MENU ── */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('view')}
            onMouseEnter={() => handleMenuHover('view')}
            className={clsx(
              "px-2 py-1 rounded transition-colors",
              openMenu === 'view' ? "bg-surface-active text-main" : "text-muted hover:text-main hover:bg-surface-hover"
            )}
          >
            View
          </button>

          {openMenu === 'view' && (
            <div className="absolute left-0 top-full mt-0.5 w-60 bg-surface-panel border border-subtle rounded-lg shadow-2xl py-1 z-40 backdrop-blur-md">
              <button
                onClick={() => closeAndRun(() => setZoom(Math.min(zoom * 1.2, 5)))}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Zoom In</span>
                </div>
                <kbd className="text-[10px] font-mono text-muted">Ctrl++</kbd>
              </button>

              <button
                onClick={() => closeAndRun(() => setZoom(Math.max(zoom / 1.2, 0.1)))}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ZoomOut className="w-3.5 h-3.5" />
                  <span>Zoom Out</span>
                </div>
                <kbd className="text-[10px] font-mono text-muted">Ctrl+-</kbd>
              </button>

              <button
                onClick={() => closeAndRun(() => {
                  setZoom(1);
                  setPan({ x: 100, y: 100 });
                })}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset View (100%)</span>
                </div>
                <kbd className="text-[10px] font-mono text-muted">Ctrl+0</kbd>
              </button>

              <div className="my-1 border-t border-subtle" />

              <button
                onClick={() => closeAndRun(() => setBoardSide(boardSide === 'top' ? 'bottom' : 'top'))}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Switch to {boardSide === 'top' ? 'Bottom (Solder)' : 'Top (Component)'}</span>
                </div>
              </button>

              <div className="my-1 border-t border-subtle" />

              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-muted tracking-wider">
                Layers
              </div>

              <button
                onClick={() => setLayerVisibility('components', !layerVisibility.components)}
                className="w-full px-3 py-1 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Components</span>
                </div>
                {layerVisibility.components && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>

              <button
                onClick={() => setLayerVisibility('labels', !layerVisibility.labels)}
                className="w-full px-3 py-1 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pin Labels</span>
                </div>
                {layerVisibility.labels && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>

              <button
                onClick={() => setLayerVisibility('solderTraces', !layerVisibility.solderTraces)}
                className="w-full px-3 py-1 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Solder Traces</span>
                </div>
                {layerVisibility.solderTraces && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>

              <button
                onClick={() => setLayerVisibility('wireJumps', !layerVisibility.wireJumps)}
                className="w-full px-3 py-1 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Wire Jumps</span>
                </div>
                {layerVisibility.wireJumps && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            </div>
          )}
        </div>

        {/* ── BOARD MENU ── */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('board')}
            onMouseEnter={() => handleMenuHover('board')}
            className={clsx(
              "px-2 py-1 rounded transition-colors",
              openMenu === 'board' ? "bg-surface-active text-main" : "text-muted hover:text-main hover:bg-surface-hover"
            )}
          >
            Board
          </button>

          {openMenu === 'board' && (
            <div className="absolute left-0 top-full mt-0.5 w-56 bg-surface-panel border border-subtle rounded-lg shadow-2xl py-1 z-40 backdrop-blur-md">
              <button
                onClick={() => closeAndRun(() => setIsBoardSizeModalOpen(true))}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Board Dimensions...</span>
                </div>
                <span className="text-[10px] font-mono text-muted">{cols}×{rows}</span>
              </button>
            </div>
          )}
        </div>

        {/* ── HELP MENU ── */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('help')}
            onMouseEnter={() => handleMenuHover('help')}
            className={clsx(
              "px-2 py-1 rounded transition-colors",
              openMenu === 'help' ? "bg-surface-active text-main" : "text-muted hover:text-main hover:bg-surface-hover"
            )}
          >
            Help
          </button>

          {openMenu === 'help' && (
            <div className="absolute left-0 top-full mt-0.5 w-56 bg-surface-panel border border-subtle rounded-lg shadow-2xl py-1 z-40 backdrop-blur-md">
              <button
                onClick={() => closeAndRun(() => setIsShortcutsModalOpen(true))}
                className="w-full px-3 py-1.5 flex items-center justify-between text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Keyboard className="w-3.5 h-3.5 text-blue-400" />
                  <span>Keyboard Shortcuts</span>
                </div>
                <kbd className="text-[10px] font-mono text-muted">?</kbd>
              </button>

              <button
                onClick={() => closeAndRun(() => setIsAboutModalOpen(true))}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-muted hover:text-main hover:bg-surface-hover transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>About PerfTrace...</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Side: Print Quick Button + Project Status ── */}
      <div className="flex items-center gap-2">
        {/* Quick Print Button */}
        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-medium transition-colors shadow-xs"
          title="Print 1:1 Physical Scale Layout (Ctrl+P)"
        >
          <Printer className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden sm:inline">Print 1:1 Layout</span>
        </button>

        {/* Project Name Indicator */}
        <div className="flex items-center gap-1 text-[11px] text-muted max-w-[150px] truncate">
          {isDirty && (
            <span className="text-amber-500 leading-none text-base font-bold" title="Unsaved changes">●</span>
          )}
          <span className="truncate">{projectName}</span>
        </div>
      </div>
    </div>
  );
};
