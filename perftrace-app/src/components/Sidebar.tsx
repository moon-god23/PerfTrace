import React from 'react';
import { COMPONENT_LIBRARY } from '../types/componentLibrary';
import type { ComponentDefinition } from '../types/componentLibrary';
import { useUIStore } from '../store';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Layers, Package } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { layerVisibility, setLayerVisibility, isSidebarCollapsed, setIsSidebarCollapsed } = useUIStore();
  const categories = Array.from(new Set(COMPONENT_LIBRARY.map(c => c.category)));

  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const LayerToggle = ({ name, layerKey }: { name: string; layerKey: keyof typeof layerVisibility }) => {
    const isVisible = layerVisibility[layerKey];
    return (
      <div
        className="flex items-center justify-between p-1.5 hover:bg-[#1e2136] rounded cursor-pointer transition-colors"
        onClick={() => setLayerVisibility(layerKey, !isVisible)}
      >
        <span className="text-gray-300 font-medium">{name}</span>
        {isVisible ? <Eye className="w-4 h-4 text-[#10b981]" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
      </div>
    );
  };

  // ── Collapsed state: thin icon strip ──
  if (isSidebarCollapsed) {
    return (
      <div className="w-8 bg-[#141622] border-r border-[#2a2d3e] flex flex-col items-center py-2 shrink-0 h-full z-10">
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          title="Expand panel"
          className="w-7 h-7 flex items-center justify-center text-[#6b7280] hover:text-[#10b981] hover:bg-[#1e2136] rounded transition-colors mb-3"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex flex-col gap-2 items-center mt-1">
          <Layers className="w-4 h-4 text-[#4b5563]" />
          <Package className="w-4 h-4 text-[#4b5563]" />
        </div>
      </div>
    );
  }

  // ── Expanded state ──
  return (
    <div className="w-64 bg-[#141622] border-r border-[#2a2d3e] flex flex-col h-full font-sans text-sm shrink-0">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2d3e] shrink-0">
        <h2 className="font-semibold text-gray-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#6b7280]" />
          Layers
        </h2>
        <button
          onClick={() => setIsSidebarCollapsed(true)}
          title="Collapse panel"
          className="w-6 h-6 flex items-center justify-center text-[#6b7280] hover:text-gray-200 hover:bg-[#2a2d45] rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 border-b border-[#2a2d3e] shrink-0">
        <div className="space-y-1">
          <LayerToggle name="Components"    layerKey="components" />
          <LayerToggle name="Labels"        layerKey="labels" />
          <LayerToggle name="Solder Traces" layerKey="solderTraces" />
          <LayerToggle name="Wire Jumps"    layerKey="wireJumps" />
        </div>
      </div>

      <div className="px-4 py-3 border-b border-[#2a2d3e] shrink-0 bg-[#0f111a] flex items-center gap-2">
        <Package className="w-4 h-4 text-[#6b7280]" />
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
                  className="p-2 bg-[#1e2136] border border-[#2a2d3e] rounded flex items-center cursor-grab hover:border-[#3b82f6] active:cursor-grabbing transition-colors"
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
