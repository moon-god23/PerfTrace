import React from 'react';
import { COMPONENT_LIBRARY } from '../types/componentLibrary';
import type { ComponentDefinition } from '../types/componentLibrary';

export const Sidebar: React.FC = () => {
  const categories = Array.from(new Set(COMPONENT_LIBRARY.map(c => c.category)));

  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-[#141622] border-r border-[#2a2d3e] flex flex-col h-full font-sans text-sm">
      <div className="p-4 border-b border-[#2a2d3e] shrink-0">
        <h2 className="font-semibold text-gray-200">Components</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {COMPONENT_LIBRARY.filter(c => c.category === category).map(comp => (
                <div
                  key={comp.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, comp)}
                  className="p-2 bg-[#1e2136] border border-[#2a2d3e] rounded flex items-center cursor-grab hover:border-[#3b82f6] transition-colors"
                >
                  <div 
                    className="w-4 h-4 rounded mr-3 shrink-0" 
                    style={{ backgroundColor: comp.color }}
                  />
                  <span className="text-gray-300 font-medium">{comp.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
