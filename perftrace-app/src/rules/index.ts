import type { BoardState, AdvisorWarning, WarningSeverity } from '../types';
import { connectionMethodRules } from './connectionMethod';
import { routingGeometryRules } from './routingGeometry';
import { powerIntegrityRules } from './powerIntegrity';
import { groundTopologyRules } from './groundTopology';
import { drcChecks } from './drcChecks';
import { reworkTips } from './reworkTips';

const SEVERITY_ORDER: Record<WarningSeverity, number> = {
  critical: 0,
  high: 1,
  warning: 2,
  suggestion: 3,
};

export function runAllRules(board: BoardState): AdvisorWarning[] {
  const warnings: AdvisorWarning[] = [
    ...connectionMethodRules(board),
    ...routingGeometryRules(board),
    ...powerIntegrityRules(board),
    ...groundTopologyRules(board),
    ...drcChecks(board),
    ...reworkTips(board),
  ];

  return warnings.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
}
