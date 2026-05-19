import { create } from 'zustand';
import type { BoardState, HoleCoord, PlacedComponent } from '../types';

interface BoardStore extends BoardState {
  setBoardSize: (rows: number, cols: number) => void;
  addComponent: (component: PlacedComponent) => void;
  updateComponent: (id: string, updates: Partial<PlacedComponent>) => void;
  removeComponent: (id: string) => void;
}

export const useBoardStore = create<BoardStore>((set) => ({
  rows: 30,
  cols: 70,
  components: [],
  traces: [],
  jumpers: [],
  nets: [],
  
  setBoardSize: (rows, cols) => set({ rows, cols }),
  addComponent: (comp) => set((state) => ({ components: [...state.components, comp] })),
  updateComponent: (id, updates) => set((state) => ({
    components: state.components.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  removeComponent: (id) => set((state) => ({
    components: state.components.filter(c => c.id !== id)
  })),
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
  setSelectedComponentId: (id) => set({ selectedComponentId: id }),
  isBoardSizeModalOpen: false,
  setIsBoardSizeModalOpen: (isOpen) => set({ isBoardSizeModalOpen: isOpen }),
}));
