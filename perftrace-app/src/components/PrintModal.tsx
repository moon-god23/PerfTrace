import React, { useState, useEffect, useRef } from 'react';
import {
  X, Printer, Download, FlipHorizontal, Eye, FileText,
  CheckCircle2, Sparkles, AlertCircle, Compass, Layers
} from 'lucide-react';
import { useBoardStore, useUIStore } from '../store';
import {
  type PrintOptions,
  DEFAULT_PRINT_OPTIONS,
  PITCH_MM,
  renderBoardToCanvas,
  downloadBoardPdf,
  printBoardDirectly,
} from '../utils/printEngine';
import { clsx } from 'clsx';

export const PrintModal: React.FC = () => {
  const { rows, cols, components, traces, projectName } = useBoardStore();
  const { isPrintModalOpen, setIsPrintModalOpen, boardSide } = useUIStore();

  const [options, setOptions] = useState<PrintOptions>(() => ({
    ...DEFAULT_PRINT_OPTIONS,
    side: boardSide, // default to current canvas side
  }));

  const [isGenerating, setIsGenerating] = useState(false);
  const previewCanvasContainerRef = useRef<HTMLDivElement>(null);

  // Update preview canvas whenever options change
  useEffect(() => {
    if (!isPrintModalOpen) return;

    const canvas = renderBoardToCanvas({
      rows,
      cols,
      components,
      traces,
      projectName,
      options,
    });

    if (previewCanvasContainerRef.current) {
      previewCanvasContainerRef.current.innerHTML = '';
      canvas.className = 'max-w-full max-h-[360px] object-contain shadow-md rounded border border-gray-300 dark:border-gray-700 bg-white';
      previewCanvasContainerRef.current.appendChild(canvas);
    }
  }, [isPrintModalOpen, rows, cols, components, traces, projectName, options]);

  if (!isPrintModalOpen) return null;

  const widthMm = (cols * PITCH_MM).toFixed(1);
  const heightMm = (rows * PITCH_MM).toFixed(1);
  const widthIn = (cols * 0.1).toFixed(2);
  const heightIn = (rows * 0.1).toFixed(2);

  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        downloadBoardPdf({ rows, cols, components, traces, projectName, options });
      } finally {
        setIsGenerating(false);
      }
    }, 50);
  };

  const handleDirectPrint = () => {
    printBoardDirectly({ rows, cols, components, traces, projectName, options });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        className="bg-surface-panel border border-subtle rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[92vh] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle bg-surface-base/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-main">Print 1:1 Physical Scale Layout</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  v1.1 True Scale
                </span>
              </div>
              <p className="text-xs text-muted">Generate exact-pitch perfboard templates for direct hardware overlay</p>
            </div>
          </div>
          <button
            onClick={() => setIsPrintModalOpen(false)}
            className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
          {/* Left Column: Live Scaled Preview */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <div className="flex items-center justify-between text-muted">
              <span className="font-semibold text-main uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                Live Scaled Sheet Preview
              </span>
              <span className="text-[11px] font-mono">
                {options.paperFormat.toUpperCase()} ({options.orientation === 'auto' ? 'Auto-Fit' : options.orientation})
              </span>
            </div>

            {/* Preview Frame */}
            <div className="bg-surface-base/80 border border-subtle rounded-xl p-4 flex items-center justify-center min-h-[300px] overflow-auto">
              <div ref={previewCanvasContainerRef} className="flex items-center justify-center" />
            </div>

            {/* Physical Dimension Specs */}
            <div className="bg-surface-base/50 border border-subtle rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted">Physical Dimensions:</span>
                <span className="font-mono font-semibold text-main">
                  {widthMm} mm × {heightMm} mm <span className="text-muted">({widthIn}" × {heightIn}")</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Hole Grid Count:</span>
                <span className="font-mono font-medium text-main">{cols} columns × {rows} rows</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Hole-to-Hole Pitch:</span>
                <span className="font-mono font-semibold text-emerald-500">2.54 mm (0.100 inch)</span>
              </div>
              <div className="flex items-center justify-between border-t border-subtle/50 pt-1.5">
                <span className="text-muted">Current Orientation:</span>
                <span className="font-medium text-main">
                  {options.side === 'top' ? 'Top View (Component Side)' : (
                    options.mirrorBottom ? 'Bottom View (Mirrored Solder Side)' : 'Bottom View (Non-mirrored)'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Print Controls */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* 1. View & Mirroring */}
            <div className="space-y-2">
              <label className="font-semibold text-main uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-500" />
                Board Side & Mirroring
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, side: 'top' })}
                  className={clsx(
                    "p-2.5 rounded-lg border text-left transition-all",
                    options.side === 'top'
                      ? "bg-blue-500/15 border-blue-500 text-main ring-1 ring-blue-500"
                      : "bg-surface-base border-subtle text-muted hover:text-main hover:bg-surface-hover"
                  )}
                >
                  <div className="font-semibold">Top View</div>
                  <div className="text-[11px] text-muted">Component placement guide</div>
                </button>

                <button
                  type="button"
                  onClick={() => setOptions({ ...options, side: 'bottom' })}
                  className={clsx(
                    "p-2.5 rounded-lg border text-left transition-all",
                    options.side === 'bottom'
                      ? "bg-blue-500/15 border-blue-500 text-main ring-1 ring-blue-500"
                      : "bg-surface-base border-subtle text-muted hover:text-main hover:bg-surface-hover"
                  )}
                >
                  <div className="font-semibold">Bottom View</div>
                  <div className="text-[11px] text-muted">Solder side wiring guide</div>
                </button>
              </div>

              {options.side === 'bottom' && (
                <label className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg cursor-pointer text-main">
                  <input
                    type="checkbox"
                    checked={options.mirrorBottom}
                    onChange={(e) => setOptions({ ...options, mirrorBottom: e.target.checked })}
                    className="mt-0.5 rounded border-subtle text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-medium flex items-center gap-1.5 text-amber-400">
                      <FlipHorizontal className="w-3.5 h-3.5" />
                      Mirror Horizontally (Recommended)
                    </span>
                    <p className="text-[11px] text-muted mt-0.5">
                      Flips the layout left-to-right so it matches what you physically see when flipping the perfboard over to solder.
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* 2. Print Style Presets */}
            <div className="space-y-2">
              <label className="font-semibold text-main uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Print Style Preset
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'color', label: 'Full Color', desc: 'Visual wiring guide' },
                  { id: 'bw', label: 'B&W Toner Saver', desc: 'Crisp, ink-friendly' },
                  { id: 'drill', label: 'Punch Template', desc: 'Hole piercing marks' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setOptions({ ...options, style: style.id as PrintOptions['style'] })}
                    className={clsx(
                      "p-2 rounded-lg border text-left transition-all",
                      options.style === style.id
                        ? "bg-emerald-500/15 border-emerald-500 text-main ring-1 ring-emerald-500"
                        : "bg-surface-base border-subtle text-muted hover:text-main hover:bg-surface-hover"
                    )}
                  >
                    <div className="font-semibold">{style.label}</div>
                    <div className="text-[10px] text-muted">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Paper Size & Orientation */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-main uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Paper Format
                </label>
                <select
                  value={options.paperFormat}
                  onChange={(e) => setOptions({ ...options, paperFormat: e.target.value as PrintOptions['paperFormat'] })}
                  className="w-full bg-surface-base border border-subtle rounded-lg px-2.5 py-1.5 text-main outline-none focus:border-blue-500"
                >
                  <option value="a4">A4 (210 × 297 mm)</option>
                  <option value="letter">US Letter (8.5 × 11 in)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-main uppercase tracking-wider text-[11px]">
                  Orientation
                </label>
                <select
                  value={options.orientation}
                  onChange={(e) => setOptions({ ...options, orientation: e.target.value as PrintOptions['orientation'] })}
                  className="w-full bg-surface-base border border-subtle rounded-lg px-2.5 py-1.5 text-main outline-none focus:border-blue-500"
                >
                  <option value="auto">Auto (Best Fit)</option>
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
            </div>

            {/* 4. Layer Inclusions */}
            <div className="space-y-2">
              <label className="font-semibold text-main uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Elements to Include
              </label>
              <div className="grid grid-cols-2 gap-2 bg-surface-base/50 border border-subtle rounded-lg p-2.5">
                <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-main">
                  <input
                    type="checkbox"
                    checked={options.includeComponents}
                    onChange={(e) => setOptions({ ...options, includeComponents: e.target.checked })}
                    className="rounded border-subtle text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Component Outlines</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-main">
                  <input
                    type="checkbox"
                    checked={options.includeLabels}
                    onChange={(e) => setOptions({ ...options, includeLabels: e.target.checked })}
                    className="rounded border-subtle text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Labels & Values</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-main">
                  <input
                    type="checkbox"
                    checked={options.includeTraces}
                    onChange={(e) => setOptions({ ...options, includeTraces: e.target.checked })}
                    className="rounded border-subtle text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Traces & Solder Bridges</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-main">
                  <input
                    type="checkbox"
                    checked={options.includeGridCoordinates}
                    onChange={(e) => setOptions({ ...options, includeGridCoordinates: e.target.checked })}
                    className="rounded border-subtle text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Grid Letters (A-Z, 1-N)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-main">
                  <input
                    type="checkbox"
                    checked={options.includeRuler}
                    onChange={(e) => setOptions({ ...options, includeRuler: e.target.checked })}
                    className="rounded border-subtle text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>1:1 Calibration Ruler</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-main">
                  <input
                    type="checkbox"
                    checked={options.includeMetadata}
                    onChange={(e) => setOptions({ ...options, includeMetadata: e.target.checked })}
                    className="rounded border-subtle text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Project Info Header</span>
                </label>
              </div>
            </div>

            {/* Scale Note Alert */}
            <div className="flex items-start gap-2 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-muted">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">
                <strong className="text-main">Printer Setup Tip:</strong> In your printer dialog, ensure scaling is set to <strong className="text-main">"100% / Actual Size"</strong>. Do NOT select "Fit to Page", which stretches or shrinks the layout.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-subtle bg-surface-base/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>High-DPI Vector/Raster Engine active</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintModalOpen(false)}
              className="px-4 py-2 text-xs rounded-xl font-medium bg-surface-base hover:bg-surface-hover border border-subtle text-muted hover:text-main transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleDirectPrint}
              className="px-4 py-2 text-xs rounded-xl font-medium bg-surface-hover hover:bg-surface-active border border-subtle text-main flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-muted" />
              <span>Direct Print</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-5 py-2 text-xs rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-md transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating PDF...' : 'Download 1:1 PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
