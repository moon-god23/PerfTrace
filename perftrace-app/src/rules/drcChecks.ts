import { v4 as uuidv4 } from 'uuid';
import type { BoardState, AdvisorWarning, HoleCoord } from '../types';

const POLARISED_TYPES = new Set(['led', 'capacitor']);

/**
 * DRC-01: Two traces from different signal types sharing the same hole (short circuit risk).
 * DRC-02: Polarised component with no value label.
 * DRC-03: Multiple components placed but zero traces drawn.
 */
export function drcChecks(board: BoardState): AdvisorWarning[] {
  const warnings: AdvisorWarning[] = [];

  // DRC-01: Shared holes between different-net traces
  // Build a map: hole_key -> set of signal types
  const holeSignalTypes = new Map<string, { types: Set<string>; holes: HoleCoord[] }>();

  for (const trace of board.traces) {
    for (const hole of [trace.from, trace.to]) {
      const key = `${hole.col},${hole.row}`;
      if (!holeSignalTypes.has(key)) {
        holeSignalTypes.set(key, { types: new Set(), holes: [hole] });
      }
      holeSignalTypes.get(key)!.types.add(trace.signalType);
    }
  }

  for (const [, data] of holeSignalTypes) {
    // Exclude 'unknown' from conflict detection
    const relevantTypes = [...data.types].filter(t => t !== 'unknown');
    if (relevantTypes.length > 1) {
      warnings.push({
        id: uuidv4(),
        severity: 'high',
        message: `Traces from different nets (${relevantTypes.join(', ')}) share the same hole — this will cause a short circuit.`,
        affectedHoles: data.holes,
        affectedComponentIds: [],
        ruleId: 'DRC-01',
      });
    }
  }

  // DRC-02: Polarised components with no value label
  for (const comp of board.components) {
    if (POLARISED_TYPES.has(comp.type) && (!comp.value || comp.value.trim() === '')) {
      warnings.push({
        id: uuidv4(),
        severity: 'suggestion',
        message: `Polarised component ${comp.name} (${comp.type}) has no value label — add a polarity indicator (e.g. "100µF", "Red") to avoid reverse-connection errors.`,
        affectedHoles: [comp.position],
        affectedComponentIds: [comp.id],
        ruleId: 'DRC-02',
      });
    }
  }

  // DRC-03: Multiple components, no traces
  if (board.components.length > 2 && board.traces.length === 0) {
    warnings.push({
      id: uuidv4(),
      severity: 'suggestion',
      message: `${board.components.length} components placed but no traces drawn — start connecting your components using the Pen, Freehand, or Wire tools.`,
      affectedHoles: [],
      affectedComponentIds: board.components.map(c => c.id),
      ruleId: 'DRC-03',
    });
  }

  return warnings;
}
