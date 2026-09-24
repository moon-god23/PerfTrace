import { create } from 'zustand';
import type { BoardState, HoleCoord, PlacedComponent, Trace, DrawingTool, SignalType, AdvisorWarning } from '../types';
import type { PerfTraceProject } from '../types/projectSchema';

type HistorySnapshot = {
  components: PlacedComponent[];
  traces: Trace[];
};

interface BoardStore extends BoardState {
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  // ── Project metadata ──────────────────────────────────────────────────────
  projectName: string;
  setProjectName: (name: string) => void;

  /** True when there are unsaved changes; false after a successful save. */
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;

  /**
   * FileSystemFileHandle retained after Save As so that a subsequent
   * Ctrl+S can overwrite silently without opening the picker again.
   */
  fileHandle: FileSystemFileHandle | null;
  setFileHandle: (handle: FileSystemFileHandle | null) => void;

  // ── Board size ────────────────────────────────────────────────────────────
  setBoardSize: (rows: number, cols: number) => void;

  // ── Components / Traces ───────────────────────────────────────────────────
  addComponent: (component: PlacedComponent) => void;
  updateComponent: (id: string, updates: Partial<PlacedComponent>) => void;
  removeComponent: (id: string) => void;

  addTrace: (trace: Trace) => void;
  removeTrace: (id: string) => void;
  updateTrace: (id: string, updates: Partial<Trace>) => void;

  clearAllTraces: () => void;
  clearAllComponents: () => void;

  // ── History ───────────────────────────────────────────────────────────────
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;

  // ── Project lifecycle ─────────────────────────────────────────────────────
  /**
   * Atomically replaces all board state from a loaded .ptrace project.
   * Clears undo/redo history.
   */
  loadProject: (project: PerfTraceProject) => void;

  /**
   * Resets to a blank board with the given dimensions.
   * Clears all components, traces, nets, and history.
   */
  newProject: (rows: number, cols: number, name?: string) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  rows: 30,
  cols: 70,
  components: [],
  traces: [],
  jumpers: [],
  nets: [],
  past: [],
  future: [],

  // ── Project metadata defaults ─────────────────────────────────────────────
  projectName: 'Untitled Project',
  setProjectName: (name) => set({ projectName: name }),

  isDirty: false,
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  fileHandle: null,
  setFileHandle: (handle) => set({ fileHandle: handle }),

  setBoardSize: (rows, cols) => set({ rows, cols }),
  
  addComponent: (comp) => set((state) => ({ components: [...state.components, comp] })),
  updateComponent: (id, updates) => set((state) => ({
    components: state.components.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  removeComponent: (id) => set((state) => ({
    components: state.components.filter(c => c.id !== id)
  })),

  addTrace: (trace) => set((state) => ({ traces: [...state.traces, trace] })),
  removeTrace: (id) => set((state) => ({
    traces: state.traces.filter(t => t.id !== id)
  })),
  updateTrace: (id, updates) => set((state) => ({
    traces: state.traces.map(t => t.id === id ? { ...t, ...updates } : t)
  })),

  clearAllTraces: () => {
    get().commitHistory();
    set({ traces: [], jumpers: [] });
  },
  clearAllComponents: () => {
    get().commitHistory();
    set({ components: [] });
  },

  commitHistory: () => {
    const state = get();
    set({
      past: [...state.past, { components: state.components, traces: state.traces }],
      future: [], // Clear future on new action
      isDirty: true,
    });
  },

  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const newPast = [...state.past];
    const previous = newPast.pop()!;
    return {
      past: newPast,
      future: [{ components: state.components, traces: state.traces }, ...state.future],
      components: previous.components,
      traces: previous.traces,
      isDirty: true,
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const newFuture = [...state.future];
    const next = newFuture.shift()!;
    return {
      past: [...state.past, { components: state.components, traces: state.traces }],
      future: newFuture,
      components: next.components,
      traces: next.traces,
      isDirty: true,
    };
  }),

  loadProject: (project) => set({
    rows: project.board.rows,
    cols: project.board.cols,
    components: project.components,
    traces: project.traces,
    jumpers: project.jumpers ?? [],
    nets: project.nets ?? [],
    past: [],
    future: [],
    projectName: project.meta.name,
    isDirty: false,
  }),

  newProject: (rows, cols, name = 'Untitled Project') => set({
    rows,
    cols,
    components: [],
    traces: [],
    jumpers: [],
    nets: [],
    past: [],
    future: [],
    projectName: name,
    isDirty: false,
    fileHandle: null,
  }),
}));

interface UIStore {
  zoom: number;
  setZoom: (zoom: number) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  cursorHole: HoleCoord | null;
  setCursorHole: (hole: HoleCoord | null) => void;
  
  selectedComponentId: string | null;
  setSelectedComponentId: (id: string | null) => void;
  
  selectedTraceId: string | null;
  setSelectedTraceId: (id: string | null) => void;

  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;

  activeSignalType: SignalType;
  setActiveSignalType: (type: SignalType) => void;

  boardSide: 'top' | 'bottom';
  setBoardSide: (side: 'top' | 'bottom') => void;

  layerVisibility: {
    components: boolean;
    labels: boolean;
    solderTraces: boolean;
    wireJumps: boolean;
  };
  setLayerVisibility: (layer: keyof UIStore['layerVisibility'], visible: boolean) => void;

  scrubberValue: number;
  setScrubberValue: (val: number) => void;

  isBoardSizeModalOpen: boolean;
  setIsBoardSizeModalOpen: (isOpen: boolean) => void;

  /** Whether the session-recovery modal is visible on app startup. */
  isRecoveryModalOpen: boolean;
  setIsRecoveryModalOpen: (open: boolean) => void;

  /** Non-empty string when a save/load error toast should be shown. */
  saveErrorMessage: string;
  setSaveErrorMessage: (msg: string) => void;

  advisorWarnings: AdvisorWarning[];
  setAdvisorWarnings: (warnings: AdvisorWarning[]) => void;

  highlightedWarningId: string | null;
  setHighlightedWarningId: (id: string | null) => void;

  /** Whether warning overlays are shown on the canvas. */
  advisorHighlightsEnabled: boolean;
  setAdvisorHighlightsEnabled: (enabled: boolean) => void;

  activeRightTab: 'advisor' | 'properties' | 'nets';
  setActiveRightTab: (tab: 'advisor' | 'properties' | 'nets') => void;

  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;

  isRightPanelCollapsed: boolean;
  setIsRightPanelCollapsed: (v: boolean) => void;

  isPreferencesOpen: boolean;
  setIsPreferencesOpen: (open: boolean) => void;

  isPrintModalOpen: boolean;
  setIsPrintModalOpen: (open: boolean) => void;

  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;

  isAboutModalOpen: boolean;
  setIsAboutModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
  pan: { x: 0, y: 0 },
  setPan: (pan) => set({ pan }),
  cursorHole: null,
  setCursorHole: (cursorHole) => set({ cursorHole }),
  
  selectedComponentId: null,
  setSelectedComponentId: (id) => set({ selectedComponentId: id, selectedTraceId: null }), // mutually exclusive selection
  
  selectedTraceId: null,
  setSelectedTraceId: (id) => set({ selectedTraceId: id, selectedComponentId: null }),

  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  activeSignalType: 'unknown',
  setActiveSignalType: (type) => set({ activeSignalType: type }),

  boardSide: 'top',
  setBoardSide: (side) => set({ boardSide: side }),
  layerVisibility: {
    components: true,
    labels: true,
    solderTraces: true,
    wireJumps: true,
  },
  setLayerVisibility: (layer, visible) => set((state) => ({
    layerVisibility: { ...state.layerVisibility, [layer]: visible }
  })),
  scrubberValue: 100,
  setScrubberValue: (val) => set({ scrubberValue: val }),

  isBoardSizeModalOpen: false,
  setIsBoardSizeModalOpen: (isOpen) => set({ isBoardSizeModalOpen: isOpen }),

  isRecoveryModalOpen: false,
  setIsRecoveryModalOpen: (open) => set({ isRecoveryModalOpen: open }),

  saveErrorMessage: '',
  setSaveErrorMessage: (msg) => set({ saveErrorMessage: msg }),

  advisorWarnings: [],
  setAdvisorWarnings: (warnings) => set({ advisorWarnings: warnings }),

  highlightedWarningId: null,
  setHighlightedWarningId: (id) => set({ highlightedWarningId: id }),

  advisorHighlightsEnabled: true,
  setAdvisorHighlightsEnabled: (enabled) => set({ advisorHighlightsEnabled: enabled }),

  activeRightTab: 'advisor',
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),

  isSidebarCollapsed: false,
  setIsSidebarCollapsed: (v) => set({ isSidebarCollapsed: v }),

  isRightPanelCollapsed: false,
  setIsRightPanelCollapsed: (v) => set({ isRightPanelCollapsed: v }),

  isPreferencesOpen: false,
  setIsPreferencesOpen: (open) => set({ isPreferencesOpen: open }),

  isPrintModalOpen: false,
  setIsPrintModalOpen: (open) => set({ isPrintModalOpen: open }),

  isShortcutsModalOpen: false,
  setIsShortcutsModalOpen: (open) => set({ isShortcutsModalOpen: open }),

  isAboutModalOpen: false,
  setIsAboutModalOpen: (open) => set({ isAboutModalOpen: open }),
}));
