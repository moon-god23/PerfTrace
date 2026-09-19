import React from 'react';
import { useUIStore } from '../store';
import type { WarningSeverity } from '../types';
import { AlertTriangle, AlertOctagon, Lightbulb, CheckCircle, Info, Eye, EyeOff } from 'lucide-react';

const SEVERITY_CONFIG: Record<WarningSeverity, {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  label: string;
  badgeStyle: string;
}> = {
  critical: {
    icon: AlertOctagon,
    iconColor: 'text-red-500',
    borderColor: 'border-red-600',
    bgColor: 'bg-red-950/30',
    label: 'Critical',
    badgeStyle: 'bg-red-900/70 text-red-300 border border-red-700',
  },
  high: {
    icon: AlertTriangle,
    iconColor: 'text-orange-400',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-950/20',
    label: 'High',
    badgeStyle: 'bg-orange-900/50 text-orange-300 border border-orange-700',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-950/20',
    label: 'Warning',
    badgeStyle: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
  },
  suggestion: {
    icon: Lightbulb,
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-950/20',
    label: 'Suggestion',
    badgeStyle: 'bg-blue-900/50 text-blue-300 border border-blue-700',
  },
};
export const TraceAdvisorPanel: React.FC = () => {
  const { advisorWarnings, highlightedWarningId, setHighlightedWarningId, advisorHighlightsEnabled, setAdvisorHighlightsEnabled } = useUIStore();

  const counts = {
    critical:   advisorWarnings.filter(w => w.severity === 'critical').length,
    high:       advisorWarnings.filter(w => w.severity === 'high').length,
    warning:    advisorWarnings.filter(w => w.severity === 'warning').length,
    suggestion: advisorWarnings.filter(w => w.severity === 'suggestion').length,
  };

  const totalIssues = advisorWarnings.length;

  return (
    <div className="flex flex-col h-full">
      {/* Summary row */}
      <div className="px-4 pt-3 pb-2 border-b border-subtle shrink-0">
        <div className="flex items-center justify-between mb-2">
          {/* Highlights toggle */}
          <button
            onClick={() => setAdvisorHighlightsEnabled(!advisorHighlightsEnabled)}
            title={advisorHighlightsEnabled ? 'Hide canvas highlights' : 'Show canvas highlights'}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              advisorHighlightsEnabled
                ? 'bg-[#10b981]/15 text-emerald-500 border border-[#10b981]/40 hover:bg-[#10b981]/25'
                : 'bg-surface-hover text-muted border border-subtle hover:text-main'
            }`}
          >
            {advisorHighlightsEnabled
              ? <Eye className="w-3 h-3" />
              : <EyeOff className="w-3 h-3" />
            }
            Highlights
          </button>
        </div>

        {totalIssues === 0 ? (
          <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium py-1">
            <CheckCircle className="w-4 h-4" />
            No issues detected
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {counts.critical > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEVERITY_CONFIG.critical.badgeStyle}`}>
                ⛔ {counts.critical}
              </span>
            )}
            {counts.high > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEVERITY_CONFIG.high.badgeStyle}`}>
                🔴 {counts.high}
              </span>
            )}
            {counts.warning > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEVERITY_CONFIG.warning.badgeStyle}`}>
                🟡 {counts.warning}
              </span>
            )}
            {counts.suggestion > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEVERITY_CONFIG.suggestion.badgeStyle}`}>
                💡 {counts.suggestion}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Warning list */}
      <div className="flex-1 overflow-y-auto">
        {totalIssues === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-muted text-xs leading-relaxed">
              Your board looks good!<br />
              Warnings will appear here as you place components and draw traces.
            </p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-[#2a2d3e]/50">
            {advisorWarnings.map(warning => {
              const cfg = SEVERITY_CONFIG[warning.severity];
              const Icon = cfg.icon;
              const isHighlighted = highlightedWarningId === warning.id;

              return (
                <button
                  key={warning.id}
                  onClick={() =>
                    setHighlightedWarningId(isHighlighted ? null : warning.id)
                  }
                  title="Click to highlight on canvas"
                  className={`w-full text-left px-3 py-2.5 border-l-2 transition-all duration-150 hover:brightness-125 ${cfg.borderColor} ${cfg.bgColor} ${
                    isHighlighted ? 'ring-1 ring-inset ring-yellow-500/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.iconColor}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.iconColor}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[9px] text-muted font-mono">
                          {warning.ruleId}
                        </span>
                      </div>
                      <p className="text-[11px] text-main leading-relaxed break-words">
                        {warning.message}
                      </p>
                      {isHighlighted && (
                        <p className="text-[10px] text-yellow-500 mt-1 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Highlighted on canvas
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {totalIssues > 0 && (
        <div className="px-3 py-2 border-t border-subtle shrink-0">
          <p className="text-[10px] text-muted">
            Click a warning to highlight it on the canvas
          </p>
        </div>
      )}
    </div>
  );
};
