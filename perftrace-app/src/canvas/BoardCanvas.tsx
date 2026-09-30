import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Circle, Rect, Text, Group, Line, Path, Shape } from 'react-konva';
import { useBoardStore, useUIStore } from '../store';
import { usePreferencesStore } from '../store/preferencesStore';
import type { KonvaEventObject } from 'konva/lib/Node';
import { ComponentRenderer } from './ComponentRenderer';
import type { ComponentDefinition } from '../types/componentLibrary';
import { COMPONENT_LIBRARY } from '../types/componentLibrary';
import type { HoleCoord, SignalType, AdvisorWarning } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { TraceCompletionPopup } from '../components/TraceCompletionPopup';

const GRID_SPACING = 20;
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

interface TooltipState {
  x: number;
  y: number;
  warning: AdvisorWarning;
}

interface PopupState {
  visible: boolean;
  traceId: string;
  x: number;
  y: number;
}

export const BoardCanvas: React.FC = () => {
  const { rows, cols, components, traces, addComponent, removeComponent, updateComponent, addTrace, removeTrace, updateTrace, commitHistory } = useBoardStore();
  const { zoom, setZoom, setCursorHole, cursorHole, pan, setPan, selectedComponentId, setSelectedComponentId, activeTool, activeSignalType, selectedTraceId, setSelectedTraceId, boardSide, layerVisibility, scrubberValue, advisorWarnings, highlightedWarningId, advisorHighlightsEnabled, isSidebarCollapsed, isRightPanelCollapsed } = useUIStore();
  const { gridDotSize, xrayOpacity } = usePreferencesStore();

  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drawing State
  const [drawingStartHole, setDrawingStartHole] = useState<HoleCoord | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Middle-mouse pan state
  const [isMiddlePanning, setIsMiddlePanning] = useState(false);
  const middlePanStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Tooltip for warning overlays
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // HF trace completion popup
  const [popup, setPopup] = useState<PopupState | null>(null);

  // Drag-with-traces state
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [draggingOrigPos, setDraggingOrigPos] = useState<HoleCoord | null>(null);
  const [draggingDelta, setDraggingDelta] = useState<{ dcol: number; drow: number }>({ dcol: 0, drow: 0 });

  // Pulsing animation for High-severity overlays — driven by a ref, NOT React state,
  // so it never causes a React re-render.
  const pulseOpacityRef = useRef(0.6);
  const pulseRisingRef = useRef(true);
  const pulseRafRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = 0;
    const step = (time: number) => {
      if (time - lastTime >= 50) {
        lastTime = time;
        if (pulseRisingRef.current) {
          if (pulseOpacityRef.current >= 0.9) pulseRisingRef.current = false;
          else pulseOpacityRef.current = Math.min(0.9, pulseOpacityRef.current + 0.05);
        } else {
          if (pulseOpacityRef.current <= 0.25) pulseRisingRef.current = true;
          else pulseOpacityRef.current = Math.max(0.25, pulseOpacityRef.current - 0.05);
        }
      }
      pulseRafRef.current = requestAnimationFrame(step);
    };
    pulseRafRef.current = requestAnimationFrame(step);
    return () => { if (pulseRafRef.current !== null) cancelAnimationFrame(pulseRafRef.current); };
  }, []);

  // --- Helpers for trace-drag ---
  function isPinOf(compId: string, hole: HoleCoord, overridePos?: HoleCoord): boolean {
    const comp = components.find(c => c.id === compId);
    if (!comp) return false;
    const def = COMPONENT_LIBRARY.find(d => d.type === comp.type);
    if (!def) return false;

    const checkComp = overridePos ? { ...comp, position: overridePos } : comp;
    const isVert = checkComp.orientation === 'vertical';
    const widthHoles = isVert ? def.height : def.width;
    const heightHoles = isVert ? def.width : def.height;

    const dCol = hole.col - checkComp.position.col;
    const dRow = hole.row - checkComp.position.row;

    if (dCol < 0 || dCol >= widthHoles || dRow < 0 || dRow >= heightHoles) return false;

    if (def.type.startsWith('header') || def.type.startsWith('to')) return true;

    if (def.type === 'resistor' || def.type === 'capacitor' || def.type === 'led') {
      if (isVert) {
        return (dCol === 0 && dRow === 0) || (dCol === 0 && dRow === heightHoles - 1);
      } else {
        return (dRow === 0 && dCol === 0) || (dRow === 0 && dCol === widthHoles - 1);
      }
    }

    if (def.type.startsWith('dip') || def.type === 'arduino_nano') {
      if (isVert) {
        return dCol === 0 || dCol === widthHoles - 1;
      } else {
        return dRow === 0 || dRow === heightHoles - 1;
      }
    }

    return true;
  }

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
    // On solder side, use x-ray opacity from preferences (default 30%)
    return isBottom ? Math.min(baseOp, xrayOpacity / 100) : baseOp;
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

    stage.setPointersPositions(e);
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const gridX = (pointer.x - stage.x()) / zoom - MARGIN;
    const gridY = (pointer.y - stage.y()) / zoom - MARGIN;

    const col = Math.round(gridX / GRID_SPACING);
    const row = Math.round(gridY / GRID_SPACING);

    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      const compData = e.dataTransfer.getData('application/json');
      if (compData) {
        const def: ComponentDefinition = JSON.parse(compData);
        const prefixCount = components.filter(c => c.name.startsWith(def.namePrefix)).length + 1;
        const name = `${def.namePrefix}${prefixCount}`;

        addComponent({
          id: uuidv4(),
          name,
          type: def.type,
          position: { col, row },
          orientation: 'horizontal',
          pinMap: {},
          value: def.defaultLabel,
          locked: false
        });
        commitHistory();
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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

    if (newCursorHole?.col !== cursorHole?.col || newCursorHole?.row !== cursorHole?.row) {
      setCursorHole(newCursorHole);

      if (isDrawing && activeTool === 'freehand' && newCursorHole && drawingStartHole) {
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

  // Helper: get viewport coords from a board hole
  const holeToViewport = useCallback((hole: HoleCoord): { x: number; y: number } => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const bx = MARGIN + hole.col * GRID_SPACING;
    const by = MARGIN + hole.row * GRID_SPACING;
    return {
      x: bx * zoom + pan.x,
      y: by * zoom + pan.y,
    };
  }, [zoom, pan]);

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;

    if (activeTool === 'select' && e.target !== stageRef.current) {
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
          const newTrace = {
            id: uuidv4(),
            from: drawingStartHole,
            to: cursorHole,
            signalType: activeSignalType,
            material: 'solder' as const,
            locked: false
          };
          addTrace(newTrace);
          setDrawingStartHole(cursorHole);
          commitHistory();

          // HF solder trace popup
          if (activeSignalType === 'hf_data') {
            const vp = holeToViewport(cursorHole);
            setPopup({ visible: true, traceId: newTrace.id, x: vp.x, y: vp.y });
          }
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
          setDrawingStartHole(null);
          commitHistory();
        }
      }
    }
  };

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
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
        fill="#1a4f2c"
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
          fill="#9ca3af"
          align="center"
        />
      );
    }

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

  // Render ALL grid holes in a single canvas draw pass — one Konva node instead of rows*cols*2 nodes.
  const renderGridDots = () => {
    const holeRadius = Math.max(1, gridDotSize * 0.6);
    const padRadius  = Math.max(2, gridDotSize);
    return (
      <Shape
        listening={false}
        perfectDrawEnabled={false}
        sceneFunc={(ctx) => {
          // Outer pad rings (green with gold stroke)
          ctx.beginPath();
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const x = MARGIN + c * GRID_SPACING;
              const y = MARGIN + r * GRID_SPACING;
              ctx.moveTo(x + padRadius, y);
              ctx.arc(x, y, padRadius, 0, Math.PI * 2);
            }
          }
          ctx.fillStyle = '#1f5d34';
          ctx.fill();
          ctx.strokeStyle = '#d4af37';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Inner holes (dark)
          ctx.beginPath();
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const x = MARGIN + c * GRID_SPACING;
              const y = MARGIN + r * GRID_SPACING;
              ctx.moveTo(x + holeRadius, y);
              ctx.arc(x, y, holeRadius, 0, Math.PI * 2);
            }
          }
          ctx.fillStyle = '#0f111a';
          ctx.fill();
        }}
      />
    );
  };

  const getSignalColor = (type: SignalType) => {
    switch (type) {
      case 'power': return '#ef4444';
      case 'ground': return '#000000';
      case 'hf_data': return '#3b82f6';
      case 'lf_data': return '#22c55e';
      default: return '#9ca3af';
    }
  };

  const renderTraces = () => {
    // When a component is being dragged, offset endpoints that sit on its pins
    const applyDelta = (hole: HoleCoord): HoleCoord => {
      if (!draggingCompId || !draggingOrigPos) return hole;
      if (!isPinOf(draggingCompId, hole, draggingOrigPos)) return hole;
      return { col: hole.col + draggingDelta.dcol, row: hole.row + draggingDelta.drow };
    };

    const rendered = traces.map(trace => {
      const from = applyDelta(trace.from);
      const to = applyDelta(trace.to);

      const x1 = MARGIN + from.col * GRID_SPACING;
      const y1 = MARGIN + from.row * GRID_SPACING;
      const x2 = MARGIN + to.col * GRID_SPACING;
      const y2 = MARGIN + to.row * GRID_SPACING;
      const isSelected = trace.id === selectedTraceId;
      const color = isSelected ? '#f59e0b' : getSignalColor(trace.signalType);

      const handleTraceClick = (e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        if (activeTool === 'eraser') {
          removeTrace(trace.id);
          commitHistory();
        } else if (activeTool === 'select') {
          setSelectedTraceId(trace.id);
        }
      };

      if (trace.material === 'solder') {
        const dcol = to.col - from.col;
        const drow = to.row - from.row;

        let points = [x1, y1, x2, y2];

        // If the trace isn't purely horizontal, vertical, or exactly 45-degrees,
        // route it as a 45-degree segment followed by an orthogonal segment
        // so it perfectly follows the grid holes.
        if (dcol !== 0 && drow !== 0 && Math.abs(dcol) !== Math.abs(drow)) {
          const step = Math.min(Math.abs(dcol), Math.abs(drow));
          const cx = from.col + Math.sign(dcol) * step;
          const cy = from.row + Math.sign(drow) * step;
          const pxC = MARGIN + cx * GRID_SPACING;
          const pyC = MARGIN + cy * GRID_SPACING;
          points = [x1, y1, pxC, pyC, x2, y2];
        }

        return (
          <Group key={trace.id} onClick={handleTraceClick} opacity={getTraceOpacity()}>
            <Line
              points={points}
              stroke={color}
              strokeWidth={isSelected ? 6 : 4}
              lineCap="round"
              lineJoin="round"
              hitStrokeWidth={12}
            />
          </Group>
        );
      } else {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
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
              shadowOffset={{ x: 2, y: 2 }}
              shadowOpacity={0.4}
            />
          </Group>
        );
      }
    });

    // In-progress trace preview
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
        const dist = Math.sqrt(dx * dx + dy * dy);
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

  /**
   * Renders Konva warning overlays for Critical and High severity warnings.
   * Warning/Suggestion are panel-only.
   */
  const renderAdvisorOverlays = () => {
    // If highlights are disabled, render nothing
    if (!advisorHighlightsEnabled) return [];

    const overlays: React.ReactNode[] = [];

    for (const warning of advisorWarnings) {
      if (warning.severity !== 'critical' && warning.severity !== 'high') continue;

      const isHighlighted = highlightedWarningId === warning.id;

      for (const hole of warning.affectedHoles) {
        const x = MARGIN + hole.col * GRID_SPACING;
        const y = MARGIN + hole.row * GRID_SPACING;
        const key = `${warning.id}-${hole.col}-${hole.row}`;

        if (warning.severity === 'critical') {
          overlays.push(
            <Group key={key}>
              {/* Solid red fill */}
              <Rect
                x={x - GRID_SPACING / 2}
                y={y - GRID_SPACING / 2}
                width={GRID_SPACING}
                height={GRID_SPACING}
                fill="#ef4444"
                opacity={0.45}
                cornerRadius={3}
                onMouseEnter={() => {
                  const stage = stageRef.current;
                  if (!stage) return;
                  const pos = stage.getPointerPosition();
                  if (pos) setTooltip({ x: pos.x, y: pos.y, warning });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
              {/* Highlight halo when selected in panel */}
              {isHighlighted && (
                <Circle
                  x={x} y={y}
                  radius={GRID_SPACING * 0.8}
                  stroke="#facc15"
                  strokeWidth={2}
                  opacity={0.9}
                />
              )}
            </Group>
          );
        } else {
          // High severity — pulsing ring
          overlays.push(
            <Group key={key}>
              <Circle
                x={x} y={y}
                radius={GRID_SPACING * 0.7}
                stroke="#f97316"
                strokeWidth={2.5}
                opacity={pulseOpacityRef.current}
                onMouseEnter={() => {
                  const stage = stageRef.current;
                  if (!stage) return;
                  const pos = stage.getPointerPosition();
                  if (pos) setTooltip({ x: pos.x, y: pos.y, warning });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
              {isHighlighted && (
                <Circle
                  x={x} y={y}
                  radius={GRID_SPACING * 1.1}
                  stroke="#facc15"
                  strokeWidth={2}
                  opacity={0.85}
                />
              )}
            </Group>
          );
        }
      }
    }

    // Yellow halo for highlighted warning/suggestion (panel-visible warnings)
    const highlighted = advisorWarnings.find(w => w.id === highlightedWarningId);
    if (highlighted && (highlighted.severity === 'warning' || highlighted.severity === 'suggestion')) {
      for (const hole of highlighted.affectedHoles) {
        const x = MARGIN + hole.col * GRID_SPACING;
        const y = MARGIN + hole.row * GRID_SPACING;
        overlays.push(
          <Circle
            key={`hl-${highlighted.id}-${hole.col}-${hole.row}`}
            x={x} y={y}
            radius={GRID_SPACING * 0.8}
            stroke="#facc15"
            strokeWidth={2}
            opacity={0.85}
          />
        );
      }
    }

    return overlays;
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 bg-surface-base overflow-hidden w-full h-full relative ${isMiddlePanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
    >
      <Stage
        width={window.innerWidth - (isSidebarCollapsed ? 32 : 256) - (isRightPanelCollapsed ? 32 : 256)}
        height={window.innerHeight - 88}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setCursorHole(null); setTooltip(null); }}
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
        <Layer listening={true}>
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
                  onDragStartGrid={(origPos) => {
                    setDraggingCompId(comp.id);
                    setDraggingOrigPos(origPos);
                    setDraggingDelta({ dcol: 0, drow: 0 });
                  }}
                  onDragMoveGrid={(delta) => {
                    setDraggingDelta(delta);
                  }}
                  onDragEndGrid={() => {
                    // Commit all connected trace endpoints to their new positions
                    if (!draggingCompId || !draggingOrigPos) return;

                    for (const trace of traces) {
                      const fromMoved = isPinOf(draggingCompId, trace.from, draggingOrigPos);
                      const toMoved = isPinOf(draggingCompId, trace.to, draggingOrigPos);

                      if (fromMoved || toMoved) {
                        updateTrace(trace.id, {
                          from: fromMoved
                            ? { col: trace.from.col + draggingDelta.dcol, row: trace.from.row + draggingDelta.drow }
                            : trace.from,
                          to: toMoved
                            ? { col: trace.to.col + draggingDelta.dcol, row: trace.to.row + draggingDelta.drow }
                            : trace.to,
                        });
                      }
                    }
                    setDraggingCompId(null);
                    setDraggingOrigPos(null);
                    setDraggingDelta({ dcol: 0, drow: 0 });
                  }}
                />
              ))}
            </Group>

            {/* Warning overlays — rendered last so they appear on top */}
            <Group>{renderAdvisorOverlays()}</Group>
          </Group>
        </Layer>
      </Stage>

      {/* SOLDER SIDE banner */}
      {isBottom && (
        <div className="absolute top-4 right-4 pointer-events-none bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg font-bold tracking-widest text-sm flex items-center gap-2 backdrop-blur-sm z-10 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          SOLDER SIDE — MIRRORED VIEW
        </div>
      )}

      {/* Warning hover tooltip */}
      {tooltip && (
        <div
          className="absolute z-40 pointer-events-none max-w-[220px]"
          style={{
            left: Math.min(tooltip.x + 12, window.innerWidth - 240),
            top: Math.max(tooltip.y - 10, 4),
          }}
        >
          <div className={`rounded-lg shadow-xl px-3 py-2 text-[11px] leading-snug border ${tooltip.warning.severity === 'critical'
            ? 'bg-red-950 border-red-700 text-red-200'
            : 'bg-orange-950 border-orange-700 text-orange-200'
            }`}>
            <div className="font-bold uppercase tracking-wider text-[9px] mb-1 opacity-70">
              {tooltip.warning.severity} · {tooltip.warning.ruleId}
            </div>
            {tooltip.warning.message}
          </div>
        </div>
      )}

      {/* HF solder-trace completion popup */}
      {popup?.visible && (
        <TraceCompletionPopup
          x={popup.x}
          y={popup.y}
          onKeep={() => setPopup(null)}
          onSwitch={() => {
            updateTrace(popup.traceId, { material: 'wire' });
            commitHistory();
            setPopup(null);
          }}
        />
      )}
    </div>
  );
};
