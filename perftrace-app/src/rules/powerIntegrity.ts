import { v4 as uuidv4 } from 'uuid';
import type { BoardState, AdvisorWarning, HoleCoord, PlacedComponent } from '../types';
import { COMPONENT_LIBRARY } from '../types/componentLibrary';
import type { ComponentDefinition } from '../types/componentLibrary';

const IC_TYPES = new Set(['dip8', 'dip14', 'dip16', 'arduino_nano']);
const CAP_TYPES = new Set(['capacitor']);
const POWER_CONNECTOR_TYPES = new Set(['header1x2', 'header1x4']);

function manhattan(a: HoleCoord, b: HoleCoord): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

interface Footprint {
  colMin: number;
  colMax: number;
  rowMin: number;
  rowMax: number;
}

function getFootprint(comp: PlacedComponent, def: ComponentDefinition): Footprint {
  const isVert = comp.orientation === 'vertical';
  const w = isVert ? def.height : def.width;
  const h = isVert ? def.width : def.height;
  return {
    colMin: comp.position.col,
    colMax: comp.position.col + w - 1,
    rowMin: comp.position.row,
    rowMax: comp.position.row + h - 1,
  };
}

/** Returns true if a hole is within the component footprint ± pad holes of margin. */
function holeInFootprint(hole: HoleCoord, fp: Footprint, pad = 1): boolean {
  return (
    hole.col >= fp.colMin - pad &&
    hole.col <= fp.colMax + pad &&
    hole.row >= fp.rowMin - pad &&
    hole.row <= fp.rowMax + pad
  );
}

/**
 * Returns true if at least one trace has one endpoint touching/near `a`
 * AND the other endpoint touching/near `b` — i.e. they are electrically connected.
 */
function areConnectedByTrace(
  a: Footprint,
  b: Footprint,
  board: BoardState,
): boolean {
  return board.traces.some(trace => {
    const fromA = holeInFootprint(trace.from, a);
    const toB   = holeInFootprint(trace.to,   b);
    const fromB = holeInFootprint(trace.from, b);
    const toA   = holeInFootprint(trace.to,   a);
    return (fromA && toB) || (fromB && toA);
  });
}

/**
 * PI-01: IC present with no decoupling capacitor PLACED NEAR AND WIRED TO IT.
 *   - "Near" means Manhattan distance ≤ 5 holes between component positions.
 *   - "Wired" means there is a trace connecting the IC footprint to the cap footprint.
 *   Placing a cap nearby but leaving it unconnected does NOT satisfy this rule.
 *
 * PI-02: Power connector + power traces exist but no bulk capacitor on board.
 */
export function powerIntegrityRules(board: BoardState): AdvisorWarning[] {
  const warnings: AdvisorWarning[] = [];

  const ics  = board.components.filter(c => IC_TYPES.has(c.type));
  const caps = board.components.filter(c => CAP_TYPES.has(c.type));

  // PI-01
  for (const ic of ics) {
    const icDef = COMPONENT_LIBRARY.find(d => d.type === ic.type);
    if (!icDef) continue;
    const icFP = getFootprint(ic, icDef);

    const hasDecouplingCap = caps.some(cap => {
      // Must be physically close
      if (manhattan(ic.position, cap.position) > 6) return false;

      const capDef = COMPONENT_LIBRARY.find(d => d.type === cap.type);
      if (!capDef) return false;
      const capFP = getFootprint(cap, capDef);

      // AND must be connected by a trace
      return areConnectedByTrace(icFP, capFP, board);
    });

    if (!hasDecouplingCap) {
      warnings.push({
        id: uuidv4(),
        severity: 'high',
        message: `IC ${ic.name} (${ic.type}) has no decoupling capacitor wired to it — place a 100nF cap within 5 holes and connect it to the IC's power and ground pins.`,
        affectedHoles: [ic.position],
        affectedComponentIds: [ic.id],
        ruleId: 'PI-01',
      });
    }
  }

  // PI-02
  const hasPowerConnector = board.components.some(c => POWER_CONNECTOR_TYPES.has(c.type));
  const hasPowerTrace     = board.traces.some(t => t.signalType === 'power');

  if (hasPowerConnector && hasPowerTrace && caps.length === 0) {
    const connectors = board.components.filter(c => POWER_CONNECTOR_TYPES.has(c.type));
    warnings.push({
      id: uuidv4(),
      severity: 'high',
      message: `Power connector detected but no bulk capacitor on board — add a 10–100µF electrolytic capacitor near the power entry point to stabilise the supply.`,
      affectedHoles: connectors.map(c => c.position),
      affectedComponentIds: connectors.map(c => c.id),
      ruleId: 'PI-02',
    });
  }

  return warnings;
}
