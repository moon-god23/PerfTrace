import React, { useEffect } from 'react';
import { useBoardStore, useUIStore } from '../store';
import type { SignalType } from '../types';
import { TraceAdvisorPanel } from './TraceAdvisorPanel';
import { Cpu, AlertTriangle, Network, ChevronLeft, ChevronRight } from 'lucide-react';

const NET_SIGNAL_COLORS: Record<string, string> = {
  power:   'bg-red-900/50 text-red-300 border-red-700',
  ground:  'bg-gray-800 text-main border-gray-600',
  hf_data: 'bg-blue-900/50 text-blue-300 border-blue-700',
  lf_data: 'bg-green-900/50 text-green-300 border-green-700',
  unknown: 'bg-surface-hover text-gray-400 border-subtle',
};

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
  const { components, traces, nets, updateComponent, updateTrace, commitHistory } = useBoardStore();

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
      <div className="w-8 bg-surface-panel border-l border-subtle flex flex-col items-center py-2 shrink-0 h-full z-10">
        <button
          onClick={() => setIsRightPanelCollapsed(false)}
          title="Expand panel"
          className="w-7 h-7 flex items-center justify-center text-muted hover:text-emerald-500 hover:bg-surface-hover rounded transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col gap-3 items-center mt-1">
          {(criticalCount + highCount) > 0 && (
            <div className="w-5 h-5 bg-red-500 rounded-full text-[9px] text-main flex items-center justify-center font-bold">
              {criticalCount + highCount}
            </div>
          )}
          <AlertTriangle className="w-4 h-4 text-muted" />
          <Cpu className="w-4 h-4 text-muted" />
          <Network className="w-4 h-4 text-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-surface-panel border-l border-subtle flex flex-col h-full font-sans text-sm shrink-0">

      {/* Tab bar */}
      <div className="flex border-b border-subtle shrink-0">
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
                  ? 'border-[#10b981] text-emerald-500'
                  : 'border-transparent text-muted hover:text-main hover:border-[#4b5563]'
              }`}
            >
              <div className="relative">
                <Icon className="w-3.5 h-3.5" />
                {tab.id === 'advisor' && (criticalCount + highCount) > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-main flex items-center justify-center font-bold">
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
          className="px-2 text-muted hover:text-main hover:bg-surface-active border-l border-subtle transition-colors shrink-0"
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
                <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-muted" />
                </div>
                <p className="text-muted text-xs leading-relaxed">
                  Select a component or trace on the canvas to see its properties.
                </p>
              </div>
            )}

            {selectedTrace && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Material
                  </label>
                  <div className="w-full bg-surface-hover border border-subtle rounded p-2 text-gray-400 capitalize">
                    {selectedTrace.material.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Signal Type
                  </label>
                  <select
                    value={selectedTrace.signalType}
                    onChange={(e) => {
                      updateTrace(selectedTrace.id, { signalType: e.target.value as SignalType });
                      commitHistory();
                    }}
                    className="w-full bg-surface-base border border-subtle rounded p-2 text-main focus:border-blue-500 outline-none"
                  >
                    <option value="power">Power</option>
                    <option value="ground">Ground</option>
                    <option value="hf_data">HF Data</option>
                    <option value="lf_data">LF Data</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div className="pt-4 border-t border-subtle">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
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
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={selectedComponent.name}
                    onChange={(e) => updateComponent(selectedComponent.id, { name: e.target.value })}
                    onBlur={() => commitHistory()}
                    className="w-full bg-surface-base border border-subtle rounded p-2 text-main focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Type
                  </label>
                  <div className="w-full bg-surface-hover border border-subtle rounded p-2 text-gray-400">
                    {selectedComponent.type}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
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
                      className={`w-full bg-surface-base border border-subtle rounded p-2 ${
                        (selectedComponent.type === 'resistor' || selectedComponent.type === 'capacitor') ? 'pr-8' : ''
                      } text-main focus:border-blue-500 outline-none`}
                    />
                    {selectedComponent.type === 'resistor' && (
                      <span className="absolute right-3 text-gray-400 pointer-events-none font-medium">Ω</span>
                    )}
                    {selectedComponent.type === 'capacitor' && (
                      <span className="absolute right-3 text-gray-400 pointer-events-none font-medium">F</span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-subtle">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Position
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 bg-surface-hover rounded p-2 text-center text-main">
                      Col: {selectedComponent.position.col}
                    </div>
                    <div className="flex-1 bg-surface-hover rounded p-2 text-center text-main">
                      Row: {selectedComponent.position.row}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Orientation
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => { updateComponent(selectedComponent.id, { orientation: 'horizontal' }); commitHistory(); }}
                      className={`flex-1 py-1 rounded border ${selectedComponent.orientation === 'horizontal' ? 'bg-blue-500 border-blue-500 text-main' : 'bg-surface-hover border-subtle text-gray-400 hover:text-main'}`}
                    >
                      Horiz
                    </button>
                    <button
                      onClick={() => { updateComponent(selectedComponent.id, { orientation: 'vertical' }); commitHistory(); }}
                      className={`flex-1 py-1 rounded border ${selectedComponent.orientation === 'vertical' ? 'bg-blue-500 border-blue-500 text-main' : 'bg-surface-hover border-subtle text-gray-400 hover:text-main'}`}
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
          nets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center">
                <Network className="w-6 h-6 text-muted" />
              </div>
              <p className="text-gray-400 text-xs font-medium">No Nets</p>
              <p className="text-muted text-xs leading-relaxed">
                Import a netlist (Phase 8) to auto-populate connections. Nets will appear here after import.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-2 border-b border-subtle bg-surface-base shrink-0">
                <p className="text-[10px] text-muted font-semibold uppercase tracking-wider">
                  {nets.length} net{nets.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="divide-y divide-[#2a2d3e]/50">
                {nets.map(net => (
                  <div key={net.id} className="px-3 py-2.5 hover:bg-surface-hover transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-main truncate">{net.name}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${NET_SIGNAL_COLORS[net.signalType] ?? NET_SIGNAL_COLORS.unknown}`}>
                        {net.signalType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted">
                      {net.connections.length} connection{net.connections.length !== 1 ? 's' : ''} · {net.priority}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
