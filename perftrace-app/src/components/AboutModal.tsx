import React from 'react';
import { X, Zap, ExternalLink, Cpu, CheckCircle } from 'lucide-react';
import { useUIStore } from '../store';

export const AboutModal: React.FC = () => {
  const { isAboutModalOpen, setIsAboutModalOpen } = useUIStore();

  if (!isAboutModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="bg-surface-panel border border-subtle rounded-xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Hero Gradient */}
        <div className="relative px-6 pt-6 pb-4 border-b border-subtle bg-gradient-to-b from-emerald-500/10 via-surface-base/40 to-transparent">
          <button
            onClick={() => setIsAboutModalOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-lg text-muted hover:text-main hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-md">
              <Zap className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-main">PerfTrace</h2>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  v1.2.0
                </span>
              </div>
              <p className="text-xs text-muted">Precision Perfboard Prototyping CAD</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-muted leading-relaxed">
            PerfTrace brings modern CAD precision to DIY electronics on stripboards and prototyping dot-boards. Design solder bridges, route copper traces, verify design rules in real-time, and print physical 1:1 fabrication guides.
          </p>

          <div className="bg-surface-base/80 border border-subtle rounded-lg p-3 space-y-2">
            <div className="font-semibold text-main text-[11px] uppercase tracking-wider text-emerald-500">
              What's New in v1.2.0
            </div>
            <ul className="space-y-1.5 text-muted">
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-main">Instant Fresh Project Creation:</strong> Creates a new board immediately with safety prompts for unsaved work.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-main">Streamlined Drawing Ribbon:</strong> Clean project badge and decluttered tool ribbon.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-main">1:1 Physical Scale Print & PDF Export:</strong> Print overlays with exact 2.54mm pitch and solder mirroring.</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between text-muted pt-1">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Engine: Konva + React 19 + jsPDF</span>
            </div>
            <a
              href="https://github.com/moon-god23/PerfTrace"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 transition-colors font-medium"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-subtle bg-surface-base/50 flex justify-end">
          <button
            onClick={() => setIsAboutModalOpen(false)}
            className="px-4 py-1.5 text-xs rounded-lg font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
