import React from 'react';
import { Group, Rect, Circle, Text } from 'react-konva';
import type { PlacedComponent } from '../types';
import { COMPONENT_LIBRARY } from '../types/componentLibrary';

import { useBoardStore } from '../store';
import type { KonvaEventObject } from 'konva/lib/Node';

interface Props {
  component: PlacedComponent;
  isSelected: boolean;
  onSelect: () => void;
  gridSpacing: number;
  margin: number;
}

export const ComponentRenderer: React.FC<Props> = ({ component, isSelected, onSelect, gridSpacing, margin }) => {
  const updateComponent = useBoardStore(s => s.updateComponent);
  const def = COMPONENT_LIBRARY.find(c => c.type === component.type);
  if (!def) return null;

  // Calculate base group position
  const groupX = margin + component.position.col * gridSpacing;
  const groupY = margin + component.position.row * gridSpacing;

  // Swap width and height if vertical
  const isVert = component.orientation === 'vertical';
  const widthHoles = isVert ? def.height : def.width;
  const heightHoles = isVert ? def.width : def.height;

  // Pixel dimensions
  const pxWidth = widthHoles * gridSpacing;
  const pxHeight = heightHoles * gridSpacing;

  // Body bounds relative to group (0,0)
  const rectX = -gridSpacing / 2;
  const rectY = -gridSpacing / 2;
  const rectW = pxWidth;
  const rectH = pxHeight;

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const newX = e.target.x() - margin;
    const newY = e.target.y() - margin;
    const col = Math.round(newX / gridSpacing);
    const row = Math.round(newY / gridSpacing);
    
    updateComponent(component.id, { position: { col, row } });
    
    // Snap visually immediately
    e.target.position({
      x: margin + col * gridSpacing,
      y: margin + row * gridSpacing
    });
  };

  return (
    <Group 
      x={groupX} 
      y={groupY} 
      onClick={onSelect} 
      onTap={onSelect}
      draggable
      onDragEnd={handleDragEnd}
      onDragStart={onSelect}
    >
      {/* Selection Highlight */}
      {isSelected && (
        <Rect
          x={rectX - 2}
          y={rectY - 2}
          width={rectW + 4}
          height={rectH + 4}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[4, 4]}
        />
      )}

      {/* Component Body */}
      <Rect
        x={rectX + 2}
        y={rectY + 2}
        width={rectW - 4}
        height={rectH - 4}
        fill={def.color}
        cornerRadius={3}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.4}
        shadowOffset={{ x: 2, y: 2 }}
      />

      {/* Pins */}
      <Circle x={0} y={0} radius={4} fill="#e5e7eb" />
      <Circle x={isVert ? 0 : (def.width - 1) * gridSpacing} y={isVert ? (def.width - 1) * gridSpacing : 0} radius={4} fill="#e5e7eb" />

      {/* Polarity Markers (e.g. LED) */}
      {(def.type === 'led' || def.type === 'capacitor') && isSelected && (
        <>
          <Text
            x={isVert ? 8 : 0}
            y={isVert ? -6 : -14}
            text="+"
            fontSize={14}
            fill="#10b981"
            fontStyle="bold"
            align="center"
          />
          <Text
            x={isVert ? 8 : (def.width - 1) * gridSpacing}
            y={isVert ? (def.width - 1) * gridSpacing - 6 : -14}
            text="-"
            fontSize={14}
            fill="#ef4444"
            fontStyle="bold"
            align="center"
          />
        </>
      )}

      {/* Label */}
      <Text
        x={rectX}
        y={rectY + rectH / 2 - 6}
        width={rectW}
        text={component.name}
        fontSize={12}
        fill="white"
        align="center"
        fontFamily="sans-serif"
      />
    </Group>
  );
};
