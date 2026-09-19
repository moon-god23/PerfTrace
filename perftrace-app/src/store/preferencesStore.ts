import { create } from 'zustand';

export type AppTheme = 'dark' | 'light' | 'system';

export interface UserPreferences {
  // General
  theme: AppTheme;
  autoSaveEnabled: boolean;

  // Canvas & Grid
  gridDotSize: number;        // 1–5 px
  showHoleCoordinates: boolean;

  // Trace Advisor
  traceAdvisorEnabled: boolean;
  advisorDebounceMs: number;  // 100–1000 ms

  // Board Side View
  xrayOpacity: number;        // 0–100 %

  // Layer Scrubber
  layerScrubberSnap: boolean;
}

interface PreferencesStore extends UserPreferences {
  setTheme: (theme: AppTheme) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setGridDotSize: (size: number) => void;
  setShowHoleCoordinates: (show: boolean) => void;
  setTraceAdvisorEnabled: (enabled: boolean) => void;
  setAdvisorDebounceMs: (ms: number) => void;
  setXrayOpacity: (opacity: number) => void;
  setLayerScrubberSnap: (snap: boolean) => void;

  /** Bulk-load preferences (e.g. from IndexedDB on startup). */
  loadPreferences: (prefs: Partial<UserPreferences>) => void;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  autoSaveEnabled: true,
  gridDotSize: 3,
  showHoleCoordinates: true,
  traceAdvisorEnabled: true,
  advisorDebounceMs: 300,
  xrayOpacity: 30,
  layerScrubberSnap: false,
};

export const usePreferencesStore = create<PreferencesStore>((set) => ({
  ...DEFAULT_PREFERENCES,

  setTheme: (theme) => set({ theme }),
  setAutoSaveEnabled: (autoSaveEnabled) => set({ autoSaveEnabled }),
  setGridDotSize: (gridDotSize) => set({ gridDotSize }),
  setShowHoleCoordinates: (showHoleCoordinates) => set({ showHoleCoordinates }),
  setTraceAdvisorEnabled: (traceAdvisorEnabled) => set({ traceAdvisorEnabled }),
  setAdvisorDebounceMs: (advisorDebounceMs) => set({ advisorDebounceMs }),
  setXrayOpacity: (xrayOpacity) => set({ xrayOpacity }),
  setLayerScrubberSnap: (layerScrubberSnap) => set({ layerScrubberSnap }),

  loadPreferences: (prefs) => set((state) => ({ ...state, ...prefs })),
}));
