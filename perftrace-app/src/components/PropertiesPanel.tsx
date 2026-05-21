import React, { useEffect } from 'react';
import { useBoardStore, useUIStore } from '../store';
import type { SignalType } from '../types';
import { TraceAdvisorPanel } from './TraceAdvisorPanel';
import { Cpu, AlertTriangle, Network, ChevronLeft, ChevronRight } from 'lucide-react';

type Tab = 'advisor' | 'properties' | 'nets';

const TABS: { id: Tab; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'advisor',    label: 'Advisor',    icon: AlertTriangle },
  { id: 'properties', label: 'Properties', icon: Cpu },
  { id: 'nets',       label: 'Nets',       icon: Network },
];

export const PropertiesPanel: React.FC = () => {
  const {
    selectedComponentId, selectedTraceId,
    activeRightTab, setActiveRightTab,
    advisorWarnings,
    isRightPanelCollapsed, setIsRightPanelCollapsed,
  } = useUIStore();
  const { components, traces, updateComponent, updateTrace, commitHistory } = useBoardStore();

  const selectedComponent = components.find(c => c.id === selectedComponentId);
  const selectedTrace     = traces.find(t => t.id === selectedTraceId);

  // Auto-switch to Properties tab when something is selected
  useEffect(() => {
    if (selectedComponentId || selectedTraceId) {
      setActiveRightTab('properties');
    }
  }, [selectedComponentId, selectedTraceId, setActiveRightTab]);

  const criticalCount = advisorWarnings.filter(w => w.severity === 'critical').length;
  const highCount     = advisorWarnings.filter(w => w.severity === 'high').length;

  // ── Collapsed state: thin icon strip ──
  if (isRightPanelCollapsed) {
    return (
      <div className="w-8 bg-[#141622] border-l border-[#2a2d3e] flex flex-col items-center py-2 shrink-0 h-full z-10">
        <button
          onClick={() => setIsRightPanelCollapsed(false)}
          title="Expand panel"
          className="w-7 h-7 flex items-center justify-center text-[#6b7280] hover:text-[#10b981] hover:bg-[#1e2136] rounded transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col gap-3 items-center mt-1">
          {(criticalCount + highCount) > 0 && (
            <div className="w-5 h-5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
              {criticalCount + highCount}
            </div>
          )}
          <AlertTriangle className="w-4 h-4 text-[#4b5563]" />
          <Cpu className="w-4 h-4 text-[#4b5563]" />
          <Network className="w-4 h-4 text-[#4b5563]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[#141622] border-l border-[#2a2d3e] flex flex-col h-full font-sans text-sm shrink-0">

      {/* Tab bar */}
      <div className="flex border-b border-[#2a2d3e] shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeRightTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveRightTab(tab.id)}
              title={tab.label}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 border-b-2 transition-colors text-[10px] font-semibold uppercase tracking-wider ${
                isActive
                  ? 'border-[#10b981] text-[#10b981]'
                  : 'border-transparent text-[#6b7280] hover:text-gray-300 hover:border-[#4b5563]'
              }`}
            >
              <div className="relative">
                <Icon className="w-3.5 h-3.5" />
                {tab.id === 'advisor' && (criticalCount + highCount) > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                    {criticalCount + highCount}
                  </span>
                )}
              </div>
              {tab.label}
            </button>
          );
        })}
        {/* Collapse button */}
        <button
          onClick={() => setIsRightPanelCollapsed(true)}
          title="Collapse panel"
          className="px-2 text-[#6b7280] hover:text-gray-200 hover:bg-[#2a2d45] border-l border-[#2a2d3e] transition-colors shrink-0"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* ── Advisor tab ── */}
        {activeRightTab === 'advisor' && <TraceAdvisorPanel />}

        {/* ── Properties tab ── */}
        {activeRightTab === 'properties' && (
          <>
            {!selectedComponent && !selectedTrace && (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[#1e2136] flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-[#4b5563]" />
                </div>
                <p className="text-[#6b7280] text-xs leading-relaxed">
                  Select a component or trace on the canvas to see its properties.
                </p>
              </div>
            )}

            {selectedTrace && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1">
                    Material
                  </label>
                  <div className="w-full bg-[#1e2136] border border-[#2a2d3e] rounded p-2 text-gray-400 capitalize">
                    {selectedTrace.material.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1">
                    Signal Type
                  </label>
                  <select
                    value={selectedTrace.signalType}
                    onChange={(e) => {
                      updateTrace(selectedTrace.id, { signalType: e.target.value as SignalType });
                      commitHistory();
                    }}
                    className="w-full bg-[#0f111a] border border-[#2a2d3e] rounded p-2 text-gray-200 focus:border-[#3b82f6] outline-none"
                  >
                    <option value="power">Power</option>
                    <option value="ground">Ground</option>
                    <option value="hf_data">HF Data</option>
                    <option value="lf_data">LF Data</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div className="pt-4 border-t border-[#2a2d3e]">
                  <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                    Coordinates
                  </label>
                  <div className="text-gray-400 text-xs">
                    From: ({selectedTrace.from.col}, {selectedTrace.from.row}) <br/>
                    To: ({selectedTrace.to.col}, {selectedTrace.to.row})
                  </div>
                </div>
              </div>
            )}

            {selectedComponent && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={selectedComponent.name}
                    onChange={(e) => updateComponent(selectedComponent.id, { name: e.target.value })}
                    onBlur={() => commitHistory()}
                    className="w-full bg-[#0f111a] border border-[#2a2d3e] rounded p-2 text-gray-200 focus:border-[#3b82f6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1">
                    Type
                  </label>
                  <div className="w-full bg-[#1e2136] border border-[#2a2d3e] rounded p-2 text-gray-400">
                    {selectedComponent.type}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1">
                    Value
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={selectedComponent.value || ''}
                      onChange={(e) => {
                        let filteredValue = e.target.value;
                        const type = selectedComponent.type;
                        if (type === 'resistor' || type === 'capacitor') {
                          filteredValue = filteredValue.replace(/[^0-9.,kmgpunKMGPUN\s]/g, '');
                        }
                        updateComponent(selectedComponent.id, { value: filteredValue });
                      }}
                      onBlur={() => commitHistory()}
                      placeholder="e.g. 10k, 100n"
                      className={`w-full bg-[#0f111a] border border-[#2a2d3e] rounded p-2 ${
                        (selectedComponent.type === 'resistor' || selectedComponent.type === 'capacitor') ? 'pr-8' : ''
                      } text-gray-200 focus:border-[#3b82f6] outline-none`}
                    />
                    {selectedComponent.type === 'resistor' && (
                      <span className="absolute right-3 text-gray-400 pointer-events-none font-medium">Ω</span>
                    )}
                    {selectedComponent.type === 'capacitor' && (
                      <span className="absolute right-3 text-gray-400 pointer-events-none font-medium">F</span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2a2d3e]">
                  <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                    Position
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 bg-[#1e2136] rounded p-2 text-center text-gray-300">
                      Col: {selectedComponent.position.col}
                    </div>
                    <div className="flex-1 bg-[#1e2136] rounded p-2 text-center text-gray-300">
                      Row: {selectedComponent.position.row}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                    Orientation
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => { updateComponent(selectedComponent.id, { orientation: 'horizontal' }); commitHistory(); }}
                      className={`flex-1 py-1 rounded border ${selectedComponent.orientation === 'horizontal' ? 'bg-[#3b82f6] border-[#3b82f6] text-white' : 'bg-[#1e2136] border-[#2a2d3e] text-gray-400 hover:text-gray-200'}`}
                    >
                      Horiz
                    </button>
                    <button
                      onClick={() => { updateComponent(selectedComponent.id, { orientation: 'vertical' }); commitHistory(); }}
                      className={`flex-1 py-1 rounded border ${selectedComponent.orientation === 'vertical' ? 'bg-[#3b82f6] border-[#3b82f6] text-white' : 'bg-[#1e2136] border-[#2a2d3e] text-gray-400 hover:text-gray-200'}`}
                    >
                      Vert
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Nets tab ── */}
        {activeRightTab === 'nets' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#1e2136] flex items-center justify-center">
              <Network className="w-6 h-6 text-[#4b5563]" />
            </div>
            <p className="text-gray-400 text-xs font-medium">Net List</p>
            <p className="text-[#6b7280] text-xs leading-relaxed">
              Net list import and management will be available in Phase 8.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
