import React from 'react';
import { Group, Rect, Circle, Text } from 'react-konva';
import type { PlacedComponent } from '../types';
import { COMPONENT_LIBRARY } from '../types/componentLibrary';

import { useBoardStore, useUIStore } from '../store';
import type { KonvaEventObject } from 'konva/lib/Node';

interface Props {
  component: PlacedComponent;
  isSelected: boolean;
  onSelect: () => void;
  gridSpacing: number;
  margin: number;
}

export const ComponentRenderer: React.FC<Props> = ({ component, isSelected, onSelect, gridSpacing, margin }) => {
  const { updateComponent, commitHistory } = useBoardStore();
  const { activeTool } = useUIStore();
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
    commitHistory();
    
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
      draggable={activeTool === 'select'}
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
      {(() => {
        const pins = [];
        const w = def.width;
        const h = def.height;

        const addPin = (xIdx: number, yIdx: number, key: string) => {
          const pxX = isVert ? yIdx * gridSpacing : xIdx * gridSpacing;
          const pxY = isVert ? xIdx * gridSpacing : yIdx * gridSpacing;
          pins.push(<Circle key={key} x={pxX} y={pxY} radius={4} fill="#e5e7eb" />);
        };

        if (def.category === 'ICs' || def.category === 'Microcontrollers') {
          // Pins on top and bottom edges
          for (let i = 0; i < w; i++) {
            addPin(i, 0, `top-${i}`);
            addPin(i, h - 1, `bot-${i}`);
          }
        } else if (def.category === 'Connectors' || def.type === 'to92' || def.type === 'to220') {
          // Pins along one edge (bottom edge for to220, top for others)
          const yIdx = def.type === 'to220' ? h - 1 : 0;
          for (let i = 0; i < w; i++) {
            addPin(i, yIdx, `pin-${i}`);
          }
        } else {
          // Passives, Opto (default: 2 pins at ends)
          addPin(0, 0, 'pin-1');
          addPin(w - 1, 0, 'pin-2');
        }

        return pins;
      })()}

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
      {(() => {
        let labelX = rectX;
        let labelY = rectY + rectH / 2 - 6;
        let labelW = rectW;
        let labelAlign: "left" | "center" = "center";
        let labelColor = "white";
        
        if (widthHoles <= 1) {
          // Vertical narrow component: place label to the right
          labelX = rectX + rectW + 4;
          labelY = rectY + rectH / 2 - 6;
          labelW = 100;
          labelAlign = "left";
          labelColor = "black";
        } else if (heightHoles <= 1) {
          // Horizontal narrow component: place label below
          labelX = rectX;
          labelY = rectY + rectH + 4;
          labelW = rectW;
          labelAlign = "center";
          labelColor = "black";
        }

        return (
          <Text
            x={labelX}
            y={labelY}
            width={labelW}
            text={component.name}
            fontSize={12}
            fill={labelColor}
            stroke={labelColor === 'black' ? 'white' : '#1f2937'}
            strokeWidth={3}
            fillAfterStrokeEnabled={true}
            align={labelAlign}
            fontFamily="sans-serif"
            fontStyle="bold"
          />
        );
      })()}
    </Group>
  );
};
