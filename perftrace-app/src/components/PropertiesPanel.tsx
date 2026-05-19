import React from 'react';
import { useBoardStore, useUIStore } from '../store';
import type { SignalType } from '../types';

export const PropertiesPanel: React.FC = () => {
  const { selectedComponentId, selectedTraceId } = useUIStore();
  const { components, traces, updateComponent, updateTrace, commitHistory } = useBoardStore();

  const selectedComponent = components.find(c => c.id === selectedComponentId);
  const selectedTrace = traces.find(t => t.id === selectedTraceId);

  if (!selectedComponent && !selectedTrace) {
    return (
      <div className="w-64 bg-[#141622] border-l border-[#2a2d3e] flex flex-col h-full font-sans text-sm p-6 text-center">
        <p className="text-[#6b7280] mt-10">Nothing selected</p>
      </div>
    );
  }

  if (selectedTrace) {
    return (
      <div className="w-64 bg-[#141622] border-l border-[#2a2d3e] flex flex-col h-full font-sans text-sm">
        <div className="p-4 border-b border-[#2a2d3e] shrink-0">
          <h2 className="font-semibold text-gray-200">Trace Properties</h2>
        </div>
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
      </div>
    );
  }

  if (selectedComponent) {
    return (
      <div className="w-64 bg-[#141622] border-l border-[#2a2d3e] flex flex-col h-full font-sans text-sm">
        <div className="p-4 border-b border-[#2a2d3e] shrink-0">
          <h2 className="font-semibold text-gray-200">Component Properties</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1">
              Reference
            </label>
            <input 
              type="text" 
              value={selectedComponent.name}
              onChange={(e) => {
                updateComponent(selectedComponent.id, { name: e.target.value });
              }}
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
                    // Allow only numbers, dots, commas, spaces, and multipliers for these
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
                onClick={() => {
                  updateComponent(selectedComponent.id, { orientation: 'horizontal' });
                  commitHistory();
                }}
                className={`flex-1 py-1 rounded border ${selectedComponent.orientation === 'horizontal' ? 'bg-[#3b82f6] border-[#3b82f6] text-white' : 'bg-[#1e2136] border-[#2a2d3e] text-gray-400 hover:text-gray-200'}`}
              >
                Horiz
              </button>
              <button 
                onClick={() => {
                  updateComponent(selectedComponent.id, { orientation: 'vertical' });
                  commitHistory();
                }}
                className={`flex-1 py-1 rounded border ${selectedComponent.orientation === 'vertical' ? 'bg-[#3b82f6] border-[#3b82f6] text-white' : 'bg-[#1e2136] border-[#2a2d3e] text-gray-400 hover:text-gray-200'}`}
              >
                Vert
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
