import { useEffect, useRef } from 'react';
import { useBoardStore } from '../store';
import { usePreferencesStore } from '../store/preferencesStore';
import { scheduleAutoSave } from '../io/autoSave';
import type { PerfTraceProject } from '../types/projectSchema';
import { SCHEMA_VERSION } from '../types/projectSchema';

/**
 * Mounts once in App.tsx.
 * Subscribes to board state and triggers debounced auto-save to IndexedDB
 * on every mutation, but only when `autoSaveEnabled` preference is true.
 */
export function useAutoSave(): void {
  const lastSaved = useRef<string>('');

  useEffect(() => {
    const unsubscribe = useBoardStore.subscribe((state) => {
      // Check preference at call time (avoids stale closure)
      const autoSaveEnabled = usePreferencesStore.getState().autoSaveEnabled;
      if (!autoSaveEnabled) return;

      // Only auto-save when there are actual board contents
      if (state.components.length === 0 && state.traces.length === 0) return;

      const now = new Date().toISOString();
      const project: PerfTraceProject = {
        version: SCHEMA_VERSION,
        meta: {
          name: state.projectName,
          createdAt: now,
          savedAt: now,
        },
        board: { rows: state.rows, cols: state.cols },
        components: state.components,
        traces: state.traces,
        jumpers: state.jumpers,
        nets: state.nets,
      };

      const serialised = JSON.stringify(project);
      if (serialised === lastSaved.current) return; // Nothing changed
      lastSaved.current = serialised;

      scheduleAutoSave(project);
    });

    return unsubscribe;
  }, []);
}
