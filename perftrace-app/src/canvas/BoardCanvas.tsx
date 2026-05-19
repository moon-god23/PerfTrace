import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Circle, Rect, Text, Group, Line, Path } from 'react-konva';
import { useBoardStore, useUIStore } from '../store';
import type { KonvaEventObject } from 'konva/lib/Node';
import { ComponentRenderer } from './ComponentRenderer';
import type { ComponentDefinition } from '../types/componentLibrary';
import type { HoleCoord, SignalType } from '../types';
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
  const { rows, cols, components, traces, addComponent, removeComponent, updateComponent, addTrace, removeTrace, commitHistory } = useBoardStore();
  const { zoom, setZoom, setCursorHole, cursorHole, pan, setPan, selectedComponentId, setSelectedComponentId, activeTool, activeSignalType, selectedTraceId, setSelectedTraceId, boardSide, layerVisibility, scrubberValue } = useUIStore();
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drawing State
  const [drawingStartHole, setDrawingStartHole] = React.useState<HoleCoord | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  // Middle-mouse pan state
  const [isMiddlePanning, setIsMiddlePanning] = React.useState(false);
  const middlePanStart = React.useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawingStartHole(null);
        setIsDrawing(false);
        return;
      }

      if (selectedComponentId || selectedTraceId) {
        if (e.key === 'Delete') {
          if (selectedComponentId) {
            removeComponent(selectedComponentId);
            setSelectedComponentId(null);
          } else if (selectedTraceId) {
            removeTrace(selectedTraceId);
            setSelectedTraceId(null);
          }
          commitHistory();
        } else if ((e.key === 'r' || e.key === 'R') && selectedComponentId) {
          const comp = components.find(c => c.id === selectedComponentId);
          if (comp) {
            const newOrientation = comp.orientation === 'horizontal' ? 'vertical' : 'horizontal';
            updateComponent(selectedComponentId, { orientation: newOrientation });
            commitHistory();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, selectedTraceId, components, removeComponent, removeTrace, updateComponent, setSelectedComponentId, setSelectedTraceId, commitHistory]);

  const boardCenterX = MARGIN + (cols * GRID_SPACING) / 2;
  const isBottom = boardSide === 'bottom';

  // Opacity Calculations
  const getTraceOpacity = () => {
    if (!layerVisibility.solderTraces) return 0;
    if (scrubberValue < 20) return scrubberValue / 20;
    return 1;
  };

  const getJumperOpacity = () => {
    if (!layerVisibility.wireJumps) return 0;
    if (scrubberValue < 40) return Math.max(0, (scrubberValue - 20) / 20);
    return 1;
  };

  const getComponentOpacity = () => {
    if (!layerVisibility.components) return 0;
    let baseOp = 1;
    if (scrubberValue < 60) baseOp = Math.max(0, (scrubberValue - 40) / 20);
    return isBottom ? Math.min(baseOp, 0.3) : baseOp;
  };

  const getLabelOpacity = () => {
    if (!layerVisibility.labels) return 0;
    if (scrubberValue < 80) return Math.max(0, (scrubberValue - 60) / 20);
    return 1;
  };

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
        commitHistory();
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

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Middle-mouse panning
    if (isMiddlePanning && middlePanStart.current) {
      const dx = e.evt.clientX - middlePanStart.current.x;
      const dy = e.evt.clientY - middlePanStart.current.y;
      setPan({
        x: middlePanStart.current.panX + dx,
        y: middlePanStart.current.panY + dy,
      });
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const gridX = (pointer.x - stage.x()) / zoom - MARGIN;
    const gridY = (pointer.y - stage.y()) / zoom - MARGIN;

    const col = Math.round(gridX / GRID_SPACING);
    const row = Math.round(gridY / GRID_SPACING);

    let newCursorHole: HoleCoord | null = null;
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      newCursorHole = { col, row };
    }
    
    // Only update if changed to avoid excessive re-renders
    if (newCursorHole?.col !== cursorHole?.col || newCursorHole?.row !== cursorHole?.row) {
      setCursorHole(newCursorHole);
      
      // Freehand drawing logic during move
      if (isDrawing && activeTool === 'freehand' && newCursorHole && drawingStartHole) {
        // Prevent drawing a 0-length trace
        if (newCursorHole.col !== drawingStartHole.col || newCursorHole.row !== drawingStartHole.row) {
          addTrace({
            id: uuidv4(),
            from: drawingStartHole,
            to: newCursorHole,
            signalType: activeSignalType,
            material: 'solder',
            locked: false
          });
          setDrawingStartHole(newCursorHole);
        }
      }
    }
  };

  const areAdjacent = (h1: HoleCoord, h2: HoleCoord) => {
    const dc = Math.abs(h1.col - h2.col);
    const dr = Math.abs(h1.row - h2.row);
    return (dc === 1 && dr === 0) || (dc === 0 && dr === 1) || (dc === 1 && dr === 1);
  };

  const handleStageContextMenu = (e: KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();
    if (isDrawing || drawingStartHole) {
      setIsDrawing(false);
      setDrawingStartHole(null);
    }
  };

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    // Left click only
    if (e.evt.button !== 0) return;

    // Handle component selection clicks
    if (activeTool === 'select' && e.target !== stageRef.current) {
      // Handled by ComponentRenderer onClick
      return;
    }

    if (activeTool === 'select') {
      setSelectedComponentId(null);
      setSelectedTraceId(null);
      return;
    }

    if (!cursorHole) return;

    if (activeTool === 'pen') {
      if (!drawingStartHole) {
        setDrawingStartHole(cursorHole);
      } else {
        if (cursorHole.col !== drawingStartHole.col || cursorHole.row !== drawingStartHole.row) {
          addTrace({
            id: uuidv4(),
            from: drawingStartHole,
            to: cursorHole,
            signalType: activeSignalType,
            material: 'solder',
            locked: false
          });
          setDrawingStartHole(cursorHole); // Continue pen tool
          commitHistory();
        }
      }
    } else if (activeTool === 'wire') {
      if (!drawingStartHole) {
        setDrawingStartHole(cursorHole);
      } else {
        if (cursorHole.col !== drawingStartHole.col || cursorHole.row !== drawingStartHole.row) {
          addTrace({
            id: uuidv4(),
            from: drawingStartHole,
            to: cursorHole,
            signalType: activeSignalType,
            material: 'wire',
            locked: false
          });
          setDrawingStartHole(null); // Wire jump is one-off
          commitHistory();
        }
      }
    }
  };

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    // Middle mouse button — start panning
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      setIsMiddlePanning(true);
      middlePanStart.current = { x: e.evt.clientX, y: e.evt.clientY, panX: pan.x, panY: pan.y };
      return;
    }

    if (e.evt.button !== 0) return;
    if (!cursorHole) return;

    if (activeTool === 'freehand') {
      setIsDrawing(true);
      setDrawingStartHole(cursorHole);
    } else if (activeTool === 'solder_bridge') {
      setIsDrawing(true);
      setDrawingStartHole(cursorHole);
    }
  };

  const handleStageMouseUp = (e: KonvaEventObject<MouseEvent>) => {
    // Middle mouse button — stop panning
    if (e.evt.button === 1) {
      setIsMiddlePanning(false);
      middlePanStart.current = null;
      return;
    }

    if (e.evt.button !== 0) return;

    if (activeTool === 'freehand' && isDrawing) {
      setIsDrawing(false);
      setDrawingStartHole(null);
      commitHistory();
    } else if (activeTool === 'solder_bridge' && isDrawing && drawingStartHole && cursorHole) {
      if ((cursorHole.col !== drawingStartHole.col || cursorHole.row !== drawingStartHole.row) && areAdjacent(drawingStartHole, cursorHole)) {
        addTrace({
          id: uuidv4(),
          from: drawingStartHole,
          to: cursorHole,
          signalType: activeSignalType,
          material: 'solder',
          locked: false
        });
        commitHistory();
      }
      setIsDrawing(false);
      setDrawingStartHole(null);
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

  const getSignalColor = (type: SignalType) => {
    switch (type) {
      case 'power': return '#ef4444'; // Red
      case 'ground': return '#000000'; // Black
      case 'hf_data': return '#3b82f6'; // Blue
      case 'lf_data': return '#22c55e'; // Green
      default: return '#9ca3af'; // Gray
    }
  };

  const renderTraces = () => {
    const rendered = traces.map(trace => {
      const x1 = MARGIN + trace.from.col * GRID_SPACING;
      const y1 = MARGIN + trace.from.row * GRID_SPACING;
      const x2 = MARGIN + trace.to.col * GRID_SPACING;
      const y2 = MARGIN + trace.to.row * GRID_SPACING;
      const isSelected = trace.id === selectedTraceId;
      const color = isSelected ? '#f59e0b' : getSignalColor(trace.signalType);

      const handleTraceClick = (e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true; // Prevent stage click
        if (activeTool === 'eraser') {
          removeTrace(trace.id);
          commitHistory();
        } else if (activeTool === 'select') {
          setSelectedTraceId(trace.id);
        }
      };

      if (trace.material === 'solder') {
        return (
          <Group key={trace.id} onClick={handleTraceClick} opacity={getTraceOpacity()}>
            <Line
              points={[x1, y1, x2, y2]}
              stroke={color}
              strokeWidth={isSelected ? 6 : 4}
              lineCap="round"
              hitStrokeWidth={12}
            />
          </Group>
        );
      } else {
        // Wire Jump -> Quadratic Bezier Arc
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const nx = -dy / dist;
        const ny = dx / dist;
        const arcHeight = Math.min(dist * 0.4, 60);
        const cx = mx + nx * arcHeight;
        const cy = my + ny * arcHeight;

        return (
          <Group key={trace.id} onClick={handleTraceClick} opacity={getJumperOpacity()}>
            <Path
              data={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
              stroke={color}
              strokeWidth={isSelected ? 4 : 2}
              hitStrokeWidth={12}
              shadowColor="#000"
              shadowBlur={3}
              shadowOffset={{x: 2, y: 2}}
              shadowOpacity={0.4}
            />
          </Group>
        );
      }
    });

    // Render in-progress trace
    if (drawingStartHole && cursorHole && (activeTool === 'pen' || activeTool === 'wire' || activeTool === 'solder_bridge')) {
      const x1 = MARGIN + drawingStartHole.col * GRID_SPACING;
      const y1 = MARGIN + drawingStartHole.row * GRID_SPACING;
      const x2 = MARGIN + cursorHole.col * GRID_SPACING;
      const y2 = MARGIN + cursorHole.row * GRID_SPACING;

      if (activeTool === 'pen' || activeTool === 'solder_bridge') {
        rendered.push(
          <Line
            key="in-progress"
            points={[x1, y1, x2, y2]}
            stroke={getSignalColor(activeSignalType)}
            strokeWidth={4}
            dash={[8, 4]}
            opacity={getTraceOpacity() * 0.6}
            lineCap="round"
          />
        );
      } else if (activeTool === 'wire') {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0) {
          const nx = -dy / dist;
          const ny = dx / dist;
          const arcHeight = Math.min(dist * 0.4, 60);
          const cx = mx + nx * arcHeight;
          const cy = my + ny * arcHeight;
          rendered.push(
            <Path
              key="in-progress-wire"
              data={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
              stroke={getSignalColor(activeSignalType)}
              strokeWidth={2}
              dash={[6, 4]}
              opacity={getJumperOpacity() * 0.6}
            />
          );
        }
      }
    }

    return rendered;
  };

  return (
    <div 
      ref={containerRef}
      className={`flex-1 bg-[#0f111a] overflow-hidden w-full h-full relative ${isMiddlePanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
    >
      <Stage
        width={window.innerWidth - 512} // Subtracting both sidebars (256 * 2)
        height={window.innerHeight - 88} // 56px toolbar + 32px statusbar
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCursorHole(null)}
        onClick={handleStageClick}
        onContextMenu={handleStageContextMenu}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        draggable={activeTool === 'select'}
        onDragEnd={(e) => {
          if (activeTool === 'select' && e.target === stageRef.current) {
            setPan({ x: e.target.x(), y: e.target.y() });
          }
        }}
        ref={stageRef}
      >
        <Layer>
          <Group
            x={isBottom ? boardCenterX : 0}
            offsetX={isBottom ? boardCenterX : 0}
            scaleX={isBottom ? -1 : 1}
          >
            {renderBoardBackground()}
            {renderGridLabels()}
            {renderGridDots()}
            {renderTraces()}
            
            <Group>
              {components.map(comp => (
                <ComponentRenderer
                  key={comp.id}
                  component={comp}
                  isSelected={comp.id === selectedComponentId}
                  onSelect={() => setSelectedComponentId(comp.id)}
                  gridSpacing={GRID_SPACING}
                  margin={MARGIN}
                  bodyOpacity={getComponentOpacity()}
                  labelOpacity={getLabelOpacity()}
                />
              ))}
            </Group>
          </Group>
        </Layer>
      </Stage>
      {isBottom && (
        <div className="absolute top-4 right-4 pointer-events-none bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg font-bold tracking-widest text-sm flex items-center gap-2 backdrop-blur-sm z-10 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          SOLDER SIDE — MIRRORED VIEW
        </div>
      )}
    </div>
  );
};
