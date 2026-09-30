import React, { useState } from 'react';
import { COMPONENT_LIBRARY } from '../types/componentLibrary';
import type { ComponentDefinition } from '../types/componentLibrary';
import { useUIStore } from '../store';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Layers, Package, Search, X } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { layerVisibility, setLayerVisibility, isSidebarCollapsed, setIsSidebarCollapsed } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = Array.from(new Set(COMPONENT_LIBRARY.map(c => c.category)));

  const filteredLibrary = searchQuery.trim()
    ? COMPONENT_LIBRARY.filter(c =>
        c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COMPONENT_LIBRARY;

  const filteredCategories = searchQuery.trim()
    ? Array.from(new Set(filteredLibrary.map(c => c.category)))
    : categories;

  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
  };

interface LayerToggleProps {
  name: string;
  isVisible: boolean;
  onToggle: () => void;
}

const LayerToggle: React.FC<LayerToggleProps> = ({ name, isVisible, onToggle }) => (
  <div
    className="flex items-center justify-between p-1.5 hover:bg-surface-hover rounded cursor-pointer transition-colors"
    onClick={onToggle}
  >
    <span className="text-main font-medium">{name}</span>
    {isVisible ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-muted" />}
  </div>
);

  // ── Collapsed state: thin icon strip ──
  if (isSidebarCollapsed) {
    return (
      <div className="w-8 bg-surface-panel border-r border-subtle flex flex-col items-center py-2 shrink-0 h-full z-10">
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          title="Expand panel"
          className="w-7 h-7 flex items-center justify-center text-muted hover:text-emerald-500 hover:bg-surface-hover rounded transition-colors mb-3"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex flex-col gap-2 items-center mt-1">
          <Layers className="w-4 h-4 text-muted" />
          <Package className="w-4 h-4 text-muted" />
        </div>
      </div>
    );
  }

  // ── Expanded state ──
  return (
    <div className="w-64 bg-surface-panel border-r border-subtle flex flex-col h-full font-sans text-sm shrink-0">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-subtle shrink-0">
        <h2 className="font-semibold text-main flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted" />
          Layers
        </h2>
        <button
          onClick={() => setIsSidebarCollapsed(true)}
          title="Collapse panel"
          className="w-6 h-6 flex items-center justify-center text-muted hover:text-main hover:bg-surface-active rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 border-b border-subtle shrink-0">
        <div className="space-y-1">
          <LayerToggle
            name="Components"
            isVisible={layerVisibility.components}
            onToggle={() => setLayerVisibility('components', !layerVisibility.components)}
          />
          <LayerToggle
            name="Labels"
            isVisible={layerVisibility.labels}
            onToggle={() => setLayerVisibility('labels', !layerVisibility.labels)}
          />
          <LayerToggle
            name="Solder Traces"
            isVisible={layerVisibility.solderTraces}
            onToggle={() => setLayerVisibility('solderTraces', !layerVisibility.solderTraces)}
          />
          <LayerToggle
            name="Wire Jumps"
            isVisible={layerVisibility.wireJumps}
            onToggle={() => setLayerVisibility('wireJumps', !layerVisibility.wireJumps)}
          />
        </div>
      </div>

      {/* Component Library header */}
      <div className="px-4 py-3 border-b border-subtle shrink-0 bg-surface-base flex items-center gap-2">
        <Package className="w-4 h-4 text-muted" />
        <h2 className="font-semibold text-main">Components</h2>
      </div>

      {/* Search box */}
      <div className="px-3 py-2 border-b border-subtle shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components…"
            className="w-full bg-surface-hover border border-subtle rounded pl-8 pr-7 py-1.5 text-xs text-main placeholder-[#4b5563] focus:border-blue-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-muted hover:text-main transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Component list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-center">
            <Search className="w-5 h-5 text-muted" />
            <p className="text-xs text-muted">No components match "{searchQuery}"</p>
          </div>
        ) : (
          filteredCategories.map(category => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {filteredLibrary.filter(c => c.category === category).map(comp => (
                  <div
                    key={comp.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, comp)}
                    className="p-2 bg-surface-hover border border-subtle rounded flex items-center cursor-grab hover:border-blue-500 active:cursor-grabbing transition-colors group"
                  >
                    <div
                      className="w-4 h-4 rounded mr-3 shrink-0"
                      style={{ backgroundColor: comp.color }}
                    />
                    <span className="text-main font-medium group-hover:text-main transition-colors">{comp.type}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
