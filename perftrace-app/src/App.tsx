import { useEffect } from 'react';
import { BoardCanvas } from './canvas/BoardCanvas';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { Sidebar } from './components/Sidebar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { BoardSizeModal } from './components/BoardSizeModal';
import { LayerScrubber } from './components/LayerScrubber';
import { RecoveryModal } from './components/RecoveryModal';
import { SaveErrorToast } from './components/SaveErrorToast';
import { PreferencesPanel } from './components/PreferencesPanel';
import { useAdvisor } from './rules/useAdvisor';
import { useAutoSave } from './hooks/useAutoSave';
import { loadAutoSave, loadPreferences } from './io/autoSave';
import { useUIStore } from './store';
import { usePreferencesStore } from './store/preferencesStore';
import { applyTheme } from './utils/theme';

function App() {
  // Run the Trace Advisor rule engine — debounced 300ms, updates store on every board change
  useAdvisor();

  // Auto-save to IndexedDB on every board mutation
  useAutoSave();

  const { setIsRecoveryModalOpen } = useUIStore();
  const { loadPreferences: loadPrefsToStore, theme } = usePreferencesStore();

  // On first mount: load preferences from IndexedDB + apply theme; check for auto-saved board
  useEffect(() => {
    // Load and apply saved user preferences
    loadPreferences().then((savedPrefs) => {
      if (savedPrefs) {
        loadPrefsToStore(savedPrefs);
        applyTheme(savedPrefs.theme ?? 'dark');
      } else {
        // Apply default theme
        applyTheme(theme);
      }
    });

    // Check for unsaved board session
    loadAutoSave().then((saved) => {
      if (saved) {
        setIsRecoveryModalOpen(true);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-base text-main overflow-hidden">
      <Toolbar />
      <div className="flex-1 relative flex overflow-hidden">
        <Sidebar />
        <BoardCanvas />
        <PropertiesPanel />
        <LayerScrubber />
      </div>
      <StatusBar />
      <BoardSizeModal />

      {/* Phase 6 — Save / Load overlays */}
      <RecoveryModal />
      <SaveErrorToast />

      {/* Phase 7 — User Preferences panel */}
      <PreferencesPanel />
    </div>
  );
}

export default App;
