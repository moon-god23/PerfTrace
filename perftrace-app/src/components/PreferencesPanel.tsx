import React, { useEffect, useCallback } from 'react';
import { X, Moon, Sun, Monitor, Settings, Sliders, Grid3x3, Layers, Zap, Keyboard } from 'lucide-react';
import { useUIStore } from '../store';
import { usePreferencesStore } from '../store/preferencesStore';
import type { AppTheme } from '../store/preferencesStore';
import { savePreferences } from '../io/autoSave';
import { applyTheme } from '../utils/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-subtle">
    <span className="text-emerald-500">{icon}</span>
    <h3 className="text-xs font-bold uppercase tracking-widest text-muted">{title}</h3>
  </div>
);

const Toggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <label className="flex items-start justify-between gap-4 cursor-pointer group">
    <div className="min-w-0">
      <p className="text-sm text-main group-hover:text-main transition-colors">{label}</p>
      {description && <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{description}</p>}
    </div>
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors mt-0.5 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 ${
        checked ? 'bg-[#10b981]' : 'bg-[#374151]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </label>
);

const Slider: React.FC<{
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}> = ({ label, description, value, min, max, step = 1, unit = '', onChange }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-main">{label}</p>
        {description && <p className="text-[11px] text-muted mt-0.5">{description}</p>}
      </div>
      <span className="text-sm font-mono text-emerald-500 bg-surface-hover px-2 py-0.5 rounded min-w-[52px] text-right">
        {value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 appearance-none bg-[#374151] rounded-full cursor-pointer accent-[#10b981]"
    />
    <div className="flex justify-between text-[10px] text-muted">
      <span>{min}{unit}</span>
      <span>{max}{unit}</span>
    </div>
  </div>
);

const KEYBOARD_SHORTCUTS: { key: string; description: string }[] = [
  { key: 'S', description: 'Select tool' },
  { key: 'P', description: 'Pen tool' },
  { key: 'F', description: 'Freehand trace' },
  { key: 'W', description: 'Wire jump' },
  { key: 'B', description: 'Solder bridge' },
  { key: 'E', description: 'Trace eraser' },
  { key: 'R', description: 'Rotate component' },
  { key: 'Delete', description: 'Delete selected' },
  { key: 'Ctrl+Z', description: 'Undo' },
  { key: 'Ctrl+Y', description: 'Redo' },
  { key: 'Ctrl+S', description: 'Save' },
  { key: 'Ctrl+Shift+S', description: 'Save As' },
  { key: 'Ctrl+O', description: 'Open project' },
  { key: 'Ctrl+N', description: 'New project' },
  { key: '[  /  ]', description: 'Step layer scrubber' },
  { key: 'Escape', description: 'Cancel / Deselect' },
];

// ─── Main Panel ───────────────────────────────────────────────────────────────

export const PreferencesPanel: React.FC = () => {
  const { isPreferencesOpen, setIsPreferencesOpen } = useUIStore();
  const prefs = usePreferencesStore();

  // Persist whenever any preference changes
  const persist = useCallback(() => {
    const { setTheme, setAutoSaveEnabled, setGridDotSize, setShowHoleCoordinates,
            setTraceAdvisorEnabled, setAdvisorDebounceMs, setXrayOpacity,
            setLayerScrubberSnap, loadPreferences: _load, ...rest } = usePreferencesStore.getState();
    void _load; // suppress unused warning
    savePreferences({
      theme: rest.theme,
      autoSaveEnabled: rest.autoSaveEnabled,
      gridDotSize: rest.gridDotSize,
      showHoleCoordinates: rest.showHoleCoordinates,
      traceAdvisorEnabled: rest.traceAdvisorEnabled,
      advisorDebounceMs: rest.advisorDebounceMs,
      xrayOpacity: rest.xrayOpacity,
      layerScrubberSnap: rest.layerScrubberSnap,
    });
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isPreferencesOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPreferencesOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPreferencesOpen, setIsPreferencesOpen]);

  if (!isPreferencesOpen) return null;

  const handleTheme = (theme: AppTheme) => {
    prefs.setTheme(theme);
    applyTheme(theme);
    persist();
  };

  const makeToggleHandler = (setter: (v: boolean) => void) => (v: boolean) => {
    setter(v);
    setTimeout(persist, 0);
  };

  const makeSliderHandler = (setter: (v: number) => void) => (v: number) => {
    setter(v);
    setTimeout(persist, 0);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={() => setIsPreferencesOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[400px] bg-surface-panel border-l border-subtle z-50 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle shrink-0 bg-surface-base">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4.5 h-4.5 text-emerald-500" />
            <h2 className="text-base font-bold text-main tracking-tight">User Preferences</h2>
          </div>
          <button
            onClick={() => setIsPreferencesOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-muted hover:text-main hover:bg-surface-active rounded-lg transition-colors"
            title="Close (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8">

          {/* ── General ── */}
          <section>
            <SectionHeader icon={<Settings className="w-3.5 h-3.5" />} title="General" />

            <div className="space-y-5">
              {/* Theme */}
              <div>
                <p className="text-sm text-main mb-2.5">Theme</p>
                <div className="flex gap-2">
                  {([ 
                    { id: 'dark'   as AppTheme, icon: Moon,    label: 'Dark'   },
                    { id: 'light'  as AppTheme, icon: Sun,     label: 'Light'  },
                    { id: 'system' as AppTheme, icon: Monitor, label: 'System' },
                  ] as const).map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => handleTheme(id)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        prefs.theme === id
                          ? 'border-[#10b981] bg-[#10b981]/10 text-emerald-500'
                          : 'border-subtle bg-surface-hover text-muted hover:text-main hover:border-[#4b5563]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted mt-1.5">
                  Full light theme support coming in Phase 13. System follows your OS setting.
                </p>
              </div>

              <Toggle
                label="Auto-save"
                description="Save to IndexedDB after each change (debounced 2s). Project recoverable on next launch."
                checked={prefs.autoSaveEnabled}
                onChange={makeToggleHandler(prefs.setAutoSaveEnabled)}
              />
            </div>
          </section>

          {/* ── Canvas & Grid ── */}
          <section>
            <SectionHeader icon={<Grid3x3 className="w-3.5 h-3.5" />} title="Canvas & Grid" />
            <div className="space-y-5">
              <Slider
                label="Grid Dot Size"
                description="Visual size of perfboard holes at 100% zoom."
                value={prefs.gridDotSize}
                min={1}
                max={5}
                unit="px"
                onChange={makeSliderHandler(prefs.setGridDotSize)}
              />
              <Toggle
                label="Show Hole Coordinates"
                description="Display current hole coordinate (e.g. A1) in the status bar."
                checked={prefs.showHoleCoordinates}
                onChange={makeToggleHandler(prefs.setShowHoleCoordinates)}
              />
            </div>
          </section>

          {/* ── Trace Advisor ── */}
          <section>
            <SectionHeader icon={<Zap className="w-3.5 h-3.5" />} title="Trace Advisor" />
            <div className="space-y-5">
              <Toggle
                label="Enable Trace Advisor"
                description="Run the rule engine on every board change and show warnings in the right panel."
                checked={prefs.traceAdvisorEnabled}
                onChange={makeToggleHandler(prefs.setTraceAdvisorEnabled)}
              />
              <Slider
                label="Analysis Debounce"
                description="Delay before re-running the rule engine after a change. Increase if you notice lag."
                value={prefs.advisorDebounceMs}
                min={100}
                max={1000}
                step={50}
                unit="ms"
                onChange={makeSliderHandler(prefs.setAdvisorDebounceMs)}
              />
            </div>
          </section>

          {/* ── Board Side View ── */}
          <section>
            <SectionHeader icon={<Layers className="w-3.5 h-3.5" />} title="Board Side View" />
            <div className="space-y-5">
              <Slider
                label="X-ray Ghost Opacity"
                description="Opacity of top-side component ghost when viewing the solder (bottom) side."
                value={prefs.xrayOpacity}
                min={0}
                max={100}
                unit="%"
                onChange={makeSliderHandler(prefs.setXrayOpacity)}
              />
            </div>
          </section>

          {/* ── Layer Scrubber ── */}
          <section>
            <SectionHeader icon={<Sliders className="w-3.5 h-3.5" />} title="Layer Scrubber" />
            <div className="space-y-5">
              <Toggle
                label="Snap to Layer Boundaries"
                description="When scrubbing, snap the slider to each of the 8 defined layer positions."
                checked={prefs.layerScrubberSnap}
                onChange={makeToggleHandler(prefs.setLayerScrubberSnap)}
              />
            </div>
          </section>

          {/* ── Keyboard Shortcuts ── */}
          <section>
            <SectionHeader icon={<Keyboard className="w-3.5 h-3.5" />} title="Keyboard Shortcuts" />
            <p className="text-[11px] text-muted mb-3">
              Customisable shortcuts coming in Phase 13.
            </p>
            <div className="rounded-lg border border-subtle overflow-hidden">
              {KEYBOARD_SHORTCUTS.map((s, i) => (
                <div
                  key={s.key}
                  className={`flex items-center justify-between px-3 py-2 text-xs ${
                    i % 2 === 0 ? 'bg-surface-hover' : 'bg-surface-panel'
                  }`}
                >
                  <span className="text-main">{s.description}</span>
                  <kbd className="px-1.5 py-0.5 bg-surface-base border border-[#3b4263] rounded text-[10px] font-mono text-[#a5b4fc] shadow-sm">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom spacing */}
          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-subtle shrink-0 bg-surface-base flex items-center justify-between">
          <span className="text-[11px] text-muted">Preferences auto-saved to IndexedDB</span>
          <button
            onClick={() => setIsPreferencesOpen(false)}
            className="px-3 py-1.5 bg-[#10b981] hover:bg-[#059669] text-main text-xs font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
};
