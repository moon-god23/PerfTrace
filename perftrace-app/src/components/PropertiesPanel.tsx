import React from 'react';
import { useBoardStore, useUIStore } from '../store';

export const PropertiesPanel: React.FC = () => {
  const { selectedComponentId } = useUIStore();
  const { components, updateComponent } = useBoardStore();

  const selectedComponent = components.find(c => c.id === selectedComponentId);

  if (!selectedComponent) {
    return (
      <div className="w-64 bg-[#141622] border-l border-[#2a2d3e] flex flex-col h-full font-sans text-sm p-6 text-center">
        <p className="text-[#6b7280] mt-10">No component selected</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[#141622] border-l border-[#2a2d3e] flex flex-col h-full font-sans text-sm">
      <div className="p-4 border-b border-[#2a2d3e] shrink-0">
        <h2 className="font-semibold text-gray-200">Properties</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1">
            Reference
          </label>
          <input 
            type="text" 
            value={selectedComponent.name}
            onChange={(e) => updateComponent(selectedComponent.id, { name: e.target.value })}
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
              onClick={() => updateComponent(selectedComponent.id, { orientation: 'horizontal' })}
              className={`flex-1 py-1 rounded border ${selectedComponent.orientation === 'horizontal' ? 'bg-[#3b82f6] border-[#3b82f6] text-white' : 'bg-[#1e2136] border-[#2a2d3e] text-gray-400 hover:text-gray-200'}`}
            >
              Horiz
            </button>
            <button 
              onClick={() => updateComponent(selectedComponent.id, { orientation: 'vertical' })}
              className={`flex-1 py-1 rounded border ${selectedComponent.orientation === 'vertical' ? 'bg-[#3b82f6] border-[#3b82f6] text-white' : 'bg-[#1e2136] border-[#2a2d3e] text-gray-400 hover:text-gray-200'}`}
            >
              Vert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
