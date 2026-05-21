import { BoardCanvas } from './canvas/BoardCanvas';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { Sidebar } from './components/Sidebar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { BoardSizeModal } from './components/BoardSizeModal';
import { LayerScrubber } from './components/LayerScrubber';
import { useAdvisor } from './rules/useAdvisor';

function App() {
  // Run the Trace Advisor rule engine — debounced 300ms, updates store on every board change
  useAdvisor();

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
    </div>
  );
}

export default App;
