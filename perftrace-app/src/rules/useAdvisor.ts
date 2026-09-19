import { useEffect } from 'react';
import { useBoardStore, useUIStore } from '../store';
import { usePreferencesStore } from '../store/preferencesStore';
import { runAllRules } from './index';
import type { BoardState } from '../types';

/**
 * useAdvisor — Subscribes to board state changes and runs the rule engine
 * debounced by `advisorDebounceMs` (default 300ms).
 * Respects the `traceAdvisorEnabled` preference — if disabled, clears warnings.
 * Call this hook once in App.tsx.
 */
export function useAdvisor() {
  const components = useBoardStore(s => s.components);
  const traces     = useBoardStore(s => s.traces);
  const rows       = useBoardStore(s => s.rows);
  const cols       = useBoardStore(s => s.cols);
  const nets       = useBoardStore(s => s.nets);

  const setAdvisorWarnings = useUIStore(s => s.setAdvisorWarnings);

  const traceAdvisorEnabled = usePreferencesStore(s => s.traceAdvisorEnabled);
  const advisorDebounceMs   = usePreferencesStore(s => s.advisorDebounceMs);

  useEffect(() => {
    if (!traceAdvisorEnabled) {
      setAdvisorWarnings([]);
      return;
    }

    const timer = setTimeout(() => {
      const board: BoardState = {
        rows,
        cols,
        components,
        traces,
        jumpers: [],
        nets,
      };
      const warnings = runAllRules(board);
      setAdvisorWarnings(warnings);
    }, advisorDebounceMs);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [components, traces, rows, cols, nets, traceAdvisorEnabled, advisorDebounceMs]);
}
