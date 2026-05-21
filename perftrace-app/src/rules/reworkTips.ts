import { v4 as uuidv4 } from 'uuid';
import type { BoardState, AdvisorWarning, HoleCoord } from '../types';

const IC_TYPES = new Set(['dip8', 'dip14', 'dip16', 'arduino_nano']);

function manhattan(a: HoleCoord, b: HoleCoord): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

/**
 * RT-01: IC placed with another component within 1 hole (no clearance for IC puller tool).
 * RT-02: Board has power/ground traces but no obvious test-point solder pads.
 */
export function reworkTips(board: BoardState): AdvisorWarning[] {
  const warnings: AdvisorWarning[] = [];

  const ics = board.components.filter(c => IC_TYPES.has(c.type));
  const nonIcs = board.components.filter(c => !IC_TYPES.has(c.type));

  // RT-01: IC clearance check
  for (const ic of ics) {
    const tooClose = nonIcs.find(other => manhattan(ic.position, other.position) <= 1);
    if (tooClose) {
      warnings.push({
        id: uuidv4(),
        severity: 'suggestion',
        message: `IC ${ic.name} has another component within 1 hole — leave at least 2 holes of clearance on all sides for an IC puller tool.`,
        affectedHoles: [ic.position, tooClose.position],
        affectedComponentIds: [ic.id, tooClose.id],
        ruleId: 'RT-01',
      });
    }
  }

  // RT-02: No test points on power/ground rails
  const hasPowerGndTraces = board.traces.some(
    t => t.signalType === 'power' || t.signalType === 'ground'
  );

  if (hasPowerGndTraces && board.traces.length > 4) {
    // Heuristic: look for any solder trace endpoint that is only used once
    // (i.e. a dead-end hole — potential test point location)
    const holeCount = new Map<string, number>();
    for (const trace of board.traces) {
      for (const hole of [trace.from, trace.to]) {
        const key = `${hole.col},${hole.row}`;
        holeCount.set(key, (holeCount.get(key) ?? 0) + 1);
      }
    }
    const singleUseHoles = [...holeCount.entries()].filter(([, count]) => count === 1);

    if (singleUseHoles.length === 0) {
      warnings.push({
        id: uuidv4(),
        severity: 'suggestion',
        message: `No accessible test points detected on power or ground rails — consider leaving a free solder pad on VCC and GND for easy probing with a multimeter or oscilloscope.`,
        affectedHoles: [],
        affectedComponentIds: [],
        ruleId: 'RT-02',
      });
    }
  }

  return warnings;
}
