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
import { useAdvisor } from './rules/useAdvisor';
import { useAutoSave } from './hooks/useAutoSave';
import { loadAutoSave } from './io/autoSave';
import { useUIStore } from './store';

function App() {
  // Run the Trace Advisor rule engine — debounced 300ms, updates store on every board change
  useAdvisor();

  // Auto-save to IndexedDB on every board mutation
  useAutoSave();

  const { setIsRecoveryModalOpen } = useUIStore();

  // On first mount, check if an auto-save exists and open the recovery modal
  useEffect(() => {
    loadAutoSave().then((saved) => {
      if (saved) {
        setIsRecoveryModalOpen(true);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0f111a] text-gray-100 overflow-hidden">
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
    </div>
  );
}

export default App;
