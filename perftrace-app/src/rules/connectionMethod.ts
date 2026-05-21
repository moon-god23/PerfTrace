import { v4 as uuidv4 } from 'uuid';
import type { BoardState, AdvisorWarning } from '../types';

/**
 * CM-01: HF data traces should use wire jumpers, not solder traces.
 * CM-02: Power traces should use solder (not wire) for lower resistance.
 * CM-03: Ground traces should use solder (not wire) for lower impedance.
 */
export function connectionMethodRules(board: BoardState): AdvisorWarning[] {
  const warnings: AdvisorWarning[] = [];

  for (const trace of board.traces) {
    if (trace.signalType === 'hf_data' && trace.material === 'solder') {
      const dx = trace.to.col - trace.from.col;
      const dy = trace.to.row - trace.from.row;
      const manhattan = Math.abs(dx) + Math.abs(dy);

      // Only flag if the trace spans more than 2 holes (trivial solder bridges are fine)
      if (manhattan > 2) {
        warnings.push({
          id: uuidv4(),
          severity: 'warning',
          message: `HF signal routed as a solder trace — prefer a short wire jumper to minimise parasitic inductance and signal degradation.`,
          affectedHoles: [trace.from, trace.to],
          affectedComponentIds: [],
          ruleId: 'CM-01',
        });
      }
    }

    if (trace.signalType === 'power' && trace.material === 'wire') {
      warnings.push({
        id: uuidv4(),
        severity: 'suggestion',
        message: `Power line routed as a wire jumper — solder traces have lower resistance and higher current capacity for power rails.`,
        affectedHoles: [trace.from, trace.to],
        affectedComponentIds: [],
        ruleId: 'CM-02',
      });
    }

    if (trace.signalType === 'ground' && trace.material === 'wire') {
      warnings.push({
        id: uuidv4(),
        severity: 'suggestion',
        message: `Ground line routed as a wire jumper — solder traces provide lower impedance and a more stable reference plane.`,
        affectedHoles: [trace.from, trace.to],
        affectedComponentIds: [],
        ruleId: 'CM-03',
      });
    }
  }

  return warnings;
}
