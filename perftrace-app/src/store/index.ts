import { create } from 'zustand';
import type { BoardState, HoleCoord, PlacedComponent, Trace, DrawingTool, SignalType } from '../types';

type HistorySnapshot = {
  components: PlacedComponent[];
  traces: Trace[];
};

interface BoardStore extends BoardState {
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  setBoardSize: (rows: number, cols: number) => void;
  
  addComponent: (component: PlacedComponent) => void;
  updateComponent: (id: string, updates: Partial<PlacedComponent>) => void;
  removeComponent: (id: string) => void;
  
  addTrace: (trace: Trace) => void;
  removeTrace: (id: string) => void;
  updateTrace: (id: string, updates: Partial<Trace>) => void;

  commitHistory: () => void;
  undo: () => void;
  redo: () => void;
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

  commitHistory: () => {
    const state = get();
    set({
      past: [...state.past, { components: state.components, traces: state.traces }],
      future: [] // Clear future on new action
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
    };
  })
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

  isBoardSizeModalOpen: boolean;
  setIsBoardSizeModalOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
  pan: { x: 100, y: 100 },
  setPan: (pan) => set({ pan }),
  cursorHole: null,
  setCursorHole: (hole) => set({ cursorHole: hole }),
  
  selectedComponentId: null,
  setSelectedComponentId: (id) => set({ selectedComponentId: id, selectedTraceId: null }), // mutually exclusive selection
  
  selectedTraceId: null,
  setSelectedTraceId: (id) => set({ selectedTraceId: id, selectedComponentId: null }),

  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  activeSignalType: 'unknown',
  setActiveSignalType: (type) => set({ activeSignalType: type }),

  isBoardSizeModalOpen: false,
  setIsBoardSizeModalOpen: (isOpen) => set({ isBoardSizeModalOpen: isOpen }),
}));
