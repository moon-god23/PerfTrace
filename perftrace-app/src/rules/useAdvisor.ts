import { useEffect } from 'react';
import { useBoardStore, useUIStore } from '../store';
import { runAllRules } from './index';
import type { BoardState } from '../types';

/**
 * useAdvisor — Subscribes to board state changes and runs the rule engine
 * debounced at 300ms. Writes results to useUIStore.advisorWarnings.
 *
 * Call this hook once in App.tsx.
 */
export function useAdvisor() {
  const components = useBoardStore(s => s.components);
  const traces     = useBoardStore(s => s.traces);
  const rows       = useBoardStore(s => s.rows);
  const cols       = useBoardStore(s => s.cols);
  const nets       = useBoardStore(s => s.nets);

  const setAdvisorWarnings = useUIStore(s => s.setAdvisorWarnings);

  useEffect(() => {
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
    }, 300);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [components, traces, rows, cols, nets]);
}
