import { v4 as uuidv4 } from 'uuid';
import type { BoardState, AdvisorWarning, HoleCoord } from '../types';

function manhattan(a: HoleCoord, b: HoleCoord): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function holesEqual(a: HoleCoord, b: HoleCoord): boolean {
  return a.col === b.col && a.row === b.row;
}

/**
 * RG-01: HF solder trace that is long (> 8 holes Manhattan distance).
 * RG-02: High wire-jumper count (> 3) on HF or power nets.
 * RG-03: Two different HF traces sharing a common endpoint hole (parallel routing risk).
 */
export function routingGeometryRules(board: BoardState): AdvisorWarning[] {
  const warnings: AdvisorWarning[] = [];

  const hfSolderTraces = board.traces.filter(
    t => t.signalType === 'hf_data' && t.material === 'solder'
  );

  // RG-01: Long HF solder traces
  for (const trace of hfSolderTraces) {
    const dist = manhattan(trace.from, trace.to);
    if (dist > 8) {
      warnings.push({
        id: uuidv4(),
        severity: 'warning',
        message: `HF signal solder trace spans ${dist} holes — long HF traces cause signal degradation. Consider a direct wire jumper instead.`,
        affectedHoles: [trace.from, trace.to],
        affectedComponentIds: [],
        ruleId: 'RG-01',
      });
    }
  }

  // RG-02: High wire jumper count on critical nets
  const hfWireJumpers = board.traces.filter(
    t => (t.signalType === 'hf_data' || t.signalType === 'power') && t.material === 'wire'
  );
  if (hfWireJumpers.length > 3) {
    warnings.push({
      id: uuidv4(),
      severity: 'suggestion',
      message: `${hfWireJumpers.length} wire jumpers on HF/power nets — high jumper count on critical paths increases failure risk. Consider re-routing.`,
      affectedHoles: hfWireJumpers.flatMap(t => [t.from, t.to]),
      affectedComponentIds: [],
      ruleId: 'RG-02',
    });
  }

  // RG-03: Two HF traces sharing a common hole (potential parallel run)
  const hfTraces = board.traces.filter(t => t.signalType === 'hf_data');
  for (let i = 0; i < hfTraces.length; i++) {
    for (let j = i + 1; j < hfTraces.length; j++) {
      const a = hfTraces[i];
      const b = hfTraces[j];
      const sharedHoles: HoleCoord[] = [];

      if (holesEqual(a.from, b.from) || holesEqual(a.from, b.to)) sharedHoles.push(a.from);
      if (holesEqual(a.to, b.from) || holesEqual(a.to, b.to)) sharedHoles.push(a.to);

      if (sharedHoles.length > 0) {
        warnings.push({
          id: uuidv4(),
          severity: 'warning',
          message: `Two HF signal traces share a common hole — parallel HF routing can cause crosstalk. Consider spacing them apart.`,
          affectedHoles: sharedHoles,
          affectedComponentIds: [],
          ruleId: 'RG-03',
        });
        break; // One warning per pair is enough
      }
    }
  }

  return warnings;
}
