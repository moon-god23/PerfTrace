import { v4 as uuidv4 } from 'uuid';
import type { BoardState, AdvisorWarning } from '../types';

/**
 * GT-01: Mixed analog (lf_data) and digital (hf_data) signals but no ground traces — star ground recommended.
 * GT-02: Ground traces exist but all are wire jumpers (no solder ground plane).
 */
export function groundTopologyRules(board: BoardState): AdvisorWarning[] {
  const warnings: AdvisorWarning[] = [];

  const hasHf = board.traces.some(t => t.signalType === 'hf_data');
  const hasLf = board.traces.some(t => t.signalType === 'lf_data');
  const groundTraces = board.traces.filter(t => t.signalType === 'ground');

  // GT-01: Mixed signal board with no ground traces at all
  if (hasHf && hasLf && groundTraces.length === 0) {
    warnings.push({
      id: uuidv4(),
      severity: 'warning',
      message: `Mixed analog and digital signals detected but no ground traces drawn — consider using star grounding to prevent digital noise from coupling into analog circuits.`,
      affectedHoles: [],
      affectedComponentIds: [],
      ruleId: 'GT-01',
    });
  }

  // GT-02: Ground traces exist but all are wire jumpers (no solder ground trace)
  if (groundTraces.length > 0) {
    const hasSolderGround = groundTraces.some(t => t.material === 'solder');
    if (!hasSolderGround) {
      warnings.push({
        id: uuidv4(),
        severity: 'warning',
        message: `All ground connections use wire jumpers — solder traces form a lower-impedance ground plane. Add at least one solder ground trace for a stable reference.`,
        affectedHoles: groundTraces.map(t => t.from),
        affectedComponentIds: [],
        ruleId: 'GT-02',
      });
    }
  }

  return warnings;
}
