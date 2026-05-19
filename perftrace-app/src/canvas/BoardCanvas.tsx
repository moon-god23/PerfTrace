import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Circle, Rect, Text, Group } from 'react-konva';
import { useBoardStore, useUIStore } from '../store';
import type { KonvaEventObject } from 'konva/lib/Node';
import { ComponentRenderer } from './ComponentRenderer';
import type { ComponentDefinition } from '../types/componentLibrary';
import { v4 as uuidv4 } from 'uuid';

const GRID_SPACING = 20;
const HOLE_RADIUS = 3;
const PAD_RADIUS = 5;
const MARGIN = 40; // Margin around the grid for labels and board edge

const columnToLetter = (col: number) => {
  let letter = '';
  let temp = col;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

export const BoardCanvas: React.FC = () => {
  const { rows, cols, components, addComponent, removeComponent, updateComponent } = useBoardStore();
  const { zoom, setZoom, setCursorHole, pan, setPan, selectedComponentId, setSelectedComponentId } = useUIStore();
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedComponentId) return;

      if (e.key === 'Delete') {
        removeComponent(selectedComponentId);
        setSelectedComponentId(null);
      } else if (e.key === 'r' || e.key === 'R') {
        const comp = components.find(c => c.id === selectedComponentId);
        if (comp) {
          const newOrientation = comp.orientation === 'horizontal' ? 'vertical' : 'horizontal';
          updateComponent(selectedComponentId, { orientation: newOrientation });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, components, removeComponent, updateComponent, setSelectedComponentId]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    // Get pointer position relative to the container
    stage.setPointersPositions(e);
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert to grid coordinates
    const gridX = (pointer.x - stage.x()) / zoom - MARGIN;
    const gridY = (pointer.y - stage.y()) / zoom - MARGIN;

    const col = Math.round(gridX / GRID_SPACING);
    const row = Math.round(gridY / GRID_SPACING);

    // Validate bounds
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      const compData = e.dataTransfer.getData('application/json');
      if (compData) {
        const def: ComponentDefinition = JSON.parse(compData);
        
        // Count existing components of this prefix to generate a name (e.g., R1, R2)
        const prefixCount = components.filter(c => c.name.startsWith(def.namePrefix)).length + 1;
        const name = `${def.namePrefix}${prefixCount}`;

        addComponent({
          id: uuidv4(),
          name,
          type: def.type,
          position: { col, row },
          orientation: 'horizontal',
          pinMap: {}, // Will implement dynamic pin mapping later
          value: def.defaultLabel,
          locked: false
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.2, Math.min(newScale, 5));
    
    setZoom(clampedScale);
    setPan({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  const handleMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Calculate position relative to the grid start (margin)
    const gridX = (pointer.x - stage.x()) / zoom - MARGIN;
    const gridY = (pointer.y - stage.y()) / zoom - MARGIN;

    // Snap to nearest hole
    const col = Math.round(gridX / GRID_SPACING);
    const row = Math.round(gridY / GRID_SPACING);

    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      setCursorHole({ col, row });
    } else {
      setCursorHole(null);
    }
  };

  const renderBoardBackground = () => {
    const boardWidth = (cols - 1) * GRID_SPACING + MARGIN * 2;
    const boardHeight = (rows - 1) * GRID_SPACING + MARGIN * 2;
    
    return (
      <Rect
        x={0}
        y={0}
        width={boardWidth}
        height={boardHeight}
        fill="#1a4f2c" // Deep green perfboard color
        cornerRadius={8}
        shadowColor="#000"
        shadowBlur={10}
        shadowOpacity={0.5}
        shadowOffset={{ x: 0, y: 5 }}
      />
    );
  };

  const renderGridLabels = () => {
    const labels = [];
    
    // Column labels (A, B, C...)
    for (let c = 0; c < cols; c++) {
      labels.push(
        <Text
          key={`col-${c}`}
          x={MARGIN + c * GRID_SPACING - 10}
          y={MARGIN / 2 - 5}
          width={20}
          text={columnToLetter(c)}
          fontSize={10}
          fontFamily="monospace"
          fill="#9ca3af" // subtle gray
          align="center"
        />
      );
    }

    // Row labels (1, 2, 3...)
    for (let r = 0; r < rows; r++) {
      labels.push(
        <Text
          key={`row-${r}`}
          x={MARGIN / 4}
          y={MARGIN + r * GRID_SPACING - 5}
          width={20}
          text={(r + 1).toString()}
          fontSize={10}
          fontFamily="monospace"
          fill="#9ca3af"
          align="right"
        />
      );
    }
    
    return labels;
  };

  const renderGridDots = () => {
    const dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = MARGIN + c * GRID_SPACING;
        const y = MARGIN + r * GRID_SPACING;
        
        dots.push(
          <Group key={`hole-${c}-${r}`} x={x} y={y}>
            {/* Outer copper pad */}
            <Circle
              radius={PAD_RADIUS}
              stroke="#d4af37" // Golden copper
              strokeWidth={1.5}
              fill="#1f5d34" // Slightly lighter green inside ring
              perfectDrawEnabled={false}
            />
            {/* Inner empty hole */}
            <Circle
              radius={HOLE_RADIUS}
              fill="#0f111a" // Deep background color (shows through)
              perfectDrawEnabled={false}
            />
          </Group>
        );
      }
    }
    return dots;
  };

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    // If we click on the empty stage (not a component), deselect
    if (e.target === stageRef.current) {
      setSelectedComponentId(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-[#0f111a] cursor-crosshair overflow-hidden w-full h-full relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Stage
        width={window.innerWidth - 512} // Subtracting both sidebars (256 * 2)
        height={window.innerHeight - 88} // 56px toolbar + 32px statusbar
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCursorHole(null)}
        onClick={handleStageClick}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        draggable
        onDragEnd={(e) => {
          setPan({ x: e.target.x(), y: e.target.y() });
        }}
        ref={stageRef}
      >
        <Layer>
          {renderBoardBackground()}
          {renderGridLabels()}
          {renderGridDots()}
          
          {components.map(comp => (
            <ComponentRenderer
              key={comp.id}
              component={comp}
              isSelected={comp.id === selectedComponentId}
              onSelect={() => setSelectedComponentId(comp.id)}
              gridSpacing={GRID_SPACING}
              margin={MARGIN}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
