import { jsPDF } from 'jspdf';
import type { PlacedComponent, Trace } from '../types';
import { COMPONENT_LIBRARY } from '../types/componentLibrary';

export interface PrintOptions {
  paperFormat: 'a4' | 'letter';
  orientation: 'auto' | 'portrait' | 'landscape';
  side: 'top' | 'bottom';
  mirrorBottom: boolean;
  style: 'color' | 'bw' | 'drill';
  includeComponents: boolean;
  includeLabels: boolean;
  includeTraces: boolean;
  includeHoleMarks: boolean;
  includeGridCoordinates: boolean;
  includeRuler: boolean;
  includeMetadata: boolean;
}

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  paperFormat: 'a4',
  orientation: 'auto',
  side: 'top',
  mirrorBottom: true,
  style: 'color',
  includeComponents: true,
  includeLabels: true,
  includeTraces: true,
  includeHoleMarks: true,
  includeGridCoordinates: true,
  includeRuler: true,
  includeMetadata: true,
};

// Standard perfboard pitch
export const PITCH_MM = 2.54; // 0.1 inch = 2.54 mm
export const PITCH_PX = 30;   // 30 pixels per 2.54mm = ~300 DPI high resolution
export const PX_PER_MM = PITCH_PX / PITCH_MM; // ~11.811 px per mm

const columnToLetter = (col: number) => {
  let letter = '';
  let temp = col;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

export interface RenderBoardParams {
  rows: number;
  cols: number;
  components: PlacedComponent[];
  traces: Trace[];
  projectName: string;
  options: PrintOptions;
}

/**
 * Renders the perfboard layout at 300 DPI into an off-screen HTML5 Canvas.
 * Can be used for live preview in the modal or exported to PDF.
 */
export function renderBoardToCanvas(params: RenderBoardParams): HTMLCanvasElement {
  const { rows, cols, components, traces, projectName, options } = params;

  const isMirrored = options.side === 'bottom' && options.mirrorBottom;
  const isBw = options.style === 'bw';
  const isDrill = options.style === 'drill';

  // Margins in pixels
  const coordMargin = options.includeGridCoordinates ? 36 : 16;
  const headerMargin = options.includeMetadata ? 48 : 16;
  const footerMargin = options.includeRuler ? 56 : 16;

  const gridWidthPx = cols * PITCH_PX;
  const gridHeightPx = rows * PITCH_PX;

  const totalWidthPx = gridWidthPx + coordMargin * 2;
  const totalHeightPx = gridHeightPx + headerMargin + footerMargin;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidthPx;
  canvas.height = totalHeightPx;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return canvas;

  // 1. Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalWidthPx, totalHeightPx);

  // Board substrate area
  const boardX = coordMargin;
  const boardY = headerMargin;

  if (options.style === 'color') {
    // Subtle realistic FR4 / Phenolic board color
    ctx.fillStyle = '#eef3eb'; // light green-tinted FR4
    ctx.fillRect(boardX, boardY, gridWidthPx, gridHeightPx);
  } else {
    // Crisp white for BW and Drill templates (saves ink)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(boardX, boardY, gridWidthPx, gridHeightPx);
  }

  // Board outer border
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.strokeRect(boardX, boardY, gridWidthPx, gridHeightPx);

  // Helper: map (col, row) hole coordinate to canvas pixel coordinate
  const holeToPixel = (col: number, row: number): { x: number; y: number } => {
    const effectiveCol = isMirrored ? (cols - 1 - col) : col;
    const x = boardX + effectiveCol * PITCH_PX + PITCH_PX / 2;
    const y = boardY + row * PITCH_PX + PITCH_PX / 2;
    return { x, y };
  };

  // 2. Perfboard Holes (Annular copper pads & drill holes)
  const padRadius = 8;
  const holeRadius = 3.5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const { x, y } = holeToPixel(c, r);

      if (isDrill) {
        // Drill template: crosshairs or registration dot
        ctx.strokeStyle = '#777777';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x - 5, y);
        ctx.lineTo(x + 5, y);
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y + 5);
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (isBw) {
        // B&W Solder guide: simple pad ring and white center
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, padRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, holeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      } else {
        // Full color: copper pad ring
        ctx.fillStyle = '#c58342'; // warm copper
        ctx.beginPath();
        ctx.arc(x, y, padRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner hole
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, holeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#9d632e';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  // 3. Traces & Solder Bridges
  if (options.includeTraces && !isDrill) {
    traces.forEach((trace) => {
      const p1 = holeToPixel(trace.from.col, trace.from.row);
      const p2 = holeToPixel(trace.to.col, trace.to.row);

      const isWire = trace.material === 'wire';

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (isBw) {
        if (isWire) {
          // Wire jump in B&W: dashed line
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.5;
        } else {
          // Solder bridge in B&W: solid bold line
          ctx.setLineDash([]);
          ctx.strokeStyle = '#111111';
          ctx.lineWidth = 6;
        }
      } else {
        // Full color traces
        if (isWire) {
          // Top-side wire jumper
          ctx.setLineDash([5, 3]);
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#eab308'; // bright yellow wire jumper
        } else {
          // Copper solder trace
          ctx.setLineDash([]);
          ctx.lineWidth = 7;
          switch (trace.signalType) {
            case 'power':
              ctx.strokeStyle = '#ef4444'; // Red
              break;
            case 'ground':
              ctx.strokeStyle = '#1e293b'; // Dark blue/black
              break;
            case 'hf_data':
              ctx.strokeStyle = '#3b82f6'; // Blue
              break;
            case 'lf_data':
              ctx.strokeStyle = '#10b981'; // Green
              break;
            default:
              ctx.strokeStyle = '#64748b'; // Gray
              break;
          }
        }
      }

      ctx.stroke();

      // Draw solder joints on pads
      if (!isWire) {
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, padRadius + 0.5, 0, Math.PI * 2);
        ctx.arc(p2.x, p2.y, padRadius + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // 4. Components
  if (options.includeComponents && !isDrill) {
    components.forEach((comp) => {
      const def = COMPONENT_LIBRARY.find((d) => d.type === comp.type);
      const isVert = comp.orientation === 'vertical';
      const widthHoles = isVert ? (def?.height ?? 1) : (def?.width ?? 1);
      const heightHoles = isVert ? (def?.width ?? 1) : (def?.height ?? 1);

      // In mirrored view: the top-left hole col becomes the top-right
      const effectiveCol = isMirrored
        ? (cols - 1 - comp.position.col - (widthHoles - 1))
        : comp.position.col;

      const compX = boardX + effectiveCol * PITCH_PX + 2;
      const compY = boardY + comp.position.row * PITCH_PX + 2;
      const compW = widthHoles * PITCH_PX - 4;
      const compH = heightHoles * PITCH_PX - 4;

      ctx.save();

      if (options.side === 'bottom') {
        // Bottom (solder) view: components are on the other side, so draw as dashed "ghost" outlines
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = isBw ? '#777777' : '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.fillStyle = isBw ? 'rgba(255, 255, 255, 0.4)' : 'rgba(241, 245, 249, 0.4)';
        ctx.beginPath();
        ctx.roundRect(compX, compY, compW, compH, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        // Top view: normal component bodies
        ctx.setLineDash([]);
        ctx.strokeStyle = isBw ? '#000000' : '#334155';
        ctx.lineWidth = 1.5;

        if (isBw) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = def?.color ? `${def.color}33` : '#e2e8f0'; // translucent fill
        }

        ctx.beginPath();
        ctx.roundRect(compX, compY, compW, compH, 4);
        ctx.fill();
        ctx.stroke();
      }

      // Component Labels
      if (options.includeLabels) {
        ctx.fillStyle = isBw ? '#111111' : '#0f172a';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const labelText = comp.value ? `${comp.name} (${comp.value})` : comp.name;
        // Clip text to avoid spilling over
        ctx.fillText(labelText, compX + compW / 2, compY + compH / 2, compW - 4);
      }

      ctx.restore();
    });
  }

  // 5. Grid Coordinate Markers (Letters & Numbers)
  if (options.includeGridCoordinates) {
    ctx.save();
    ctx.fillStyle = '#475569';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Columns (Top and Bottom edges)
    for (let c = 0; c < cols; c++) {
      const effectiveCol = isMirrored ? (cols - 1 - c) : c;
      const letter = columnToLetter(c);
      const x = boardX + effectiveCol * PITCH_PX + PITCH_PX / 2;

      // Top label
      ctx.fillText(letter, x, boardY - 10);
      // Bottom label
      ctx.fillText(letter, x, boardY + gridHeightPx + 10);
    }

    // Rows (Left and Right edges)
    ctx.textAlign = 'right';
    for (let r = 0; r < rows; r++) {
      const y = boardY + r * PITCH_PX + PITCH_PX / 2;
      const num = String(r + 1);

      // Left label
      ctx.fillText(num, boardX - 8, y);
    }

    ctx.textAlign = 'left';
    for (let r = 0; r < rows; r++) {
      const y = boardY + r * PITCH_PX + PITCH_PX / 2;
      const num = String(r + 1);

      // Right label
      ctx.fillText(num, boardX + gridWidthPx + 8, y);
    }

    ctx.restore();
  }

  // 6. Header Metadata
  if (options.includeMetadata) {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const sideName = options.side === 'top'
      ? 'TOP VIEW (Component Side)'
      : `BOTTOM VIEW (Solder Side${isMirrored ? ' - MIRRORED' : ''})`;

    ctx.fillText(`${projectName} — ${sideName}`, boardX, 10);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const boardDimMm = `${(cols * PITCH_MM).toFixed(1)} mm × ${(rows * PITCH_MM).toFixed(1)} mm`;
    ctx.fillText(
      `Grid: ${cols}×${rows} holes (${boardDimMm}) | Pitch: 2.54 mm (0.10") | Scale: 1:1 Actual Size | Date: ${dateStr}`,
      boardX,
      26
    );
    ctx.restore();
  }

  // 7. Footer Calibration Scale Ruler
  if (options.includeRuler) {
    ctx.save();
    const rulerY = boardY + gridHeightPx + (options.includeGridCoordinates ? 26 : 14);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('1:1 SCALE CALIBRATION CHECK:', boardX, rulerY);

    // 1.00 inch ruler bar (exactly 10 holes = 10 * 30px = 300px)
    const inchBarLength = 10 * PITCH_PX; // 300px = 1 inch
    const barY = rulerY + 14;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(boardX, barY, inchBarLength, 4);

    // Draw 0.1 inch tick marks
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const tickX = boardX + i * PITCH_PX;
      const tickH = (i === 0 || i === 5 || i === 10) ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(tickX, barY);
      ctx.lineTo(tickX, barY - tickH);
      ctx.stroke();
    }

    ctx.font = '8px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText('0', boardX - 2, barY - 14);
    ctx.fillText('0.5"', boardX + 5 * PITCH_PX - 8, barY - 14);
    ctx.fillText('1.00" (10 holes = 25.4mm)', boardX + inchBarLength - 60, barY - 14);

    // Verification prompt text
    ctx.font = 'italic 8px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(
      'Verify 10 holes match exactly 25.4 mm (1.00 inch) on paper. Ensure printer dialog is set to "100% / Actual Size" (DO NOT use "Fit to Printable Area").',
      boardX + inchBarLength + 20,
      barY - 2
    );

    ctx.restore();
  }

  return canvas;
}

/**
 * Generates an exact 1:1 physical scale PDF document using jsPDF.
 */
export function generatePdfDocument(params: RenderBoardParams): jsPDF {
  const { rows, cols, options } = params;

  // Board dimensions in mm
  const boardWidthMm = cols * PITCH_MM;
  const boardHeightMm = rows * PITCH_MM;

  // Additional margins for coordinates, header and calibration ruler
  const marginExtraX = options.includeGridCoordinates ? 8 : 4;
  const marginExtraY = (options.includeMetadata ? 12 : 4) + (options.includeRuler ? 14 : 4);

  const totalContentWidthMm = boardWidthMm + marginExtraX * 2;
  const totalContentHeightMm = boardHeightMm + marginExtraY;

  // Determine page format and orientation
  const paperFormat = options.paperFormat; // 'a4' or 'letter'
  
  // Page sizes in mm
  const a4Size = { w: 210, h: 297 };
  const letterSize = { w: 215.9, h: 279.4 };
  const baseSize = paperFormat === 'letter' ? letterSize : a4Size;

  const orientation: 'portrait' | 'landscape' =
    options.orientation === 'auto'
      ? (totalContentWidthMm > totalContentHeightMm ? 'landscape' : 'portrait')
      : options.orientation;

  const pageWidthMm = orientation === 'landscape' ? baseSize.h : baseSize.w;
  const pageHeightMm = orientation === 'landscape' ? baseSize.w : baseSize.h;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperFormat,
    compress: true,
  });

  // Render board to high-DPI canvas
  const canvas = renderBoardToCanvas(params);
  const imgData = canvas.toDataURL('image/png', 1.0);

  // Exact 1:1 scale mm dimensions of the rendered canvas
  const imgWidthMm = (canvas.width / PITCH_PX) * PITCH_MM;
  const imgHeightMm = (canvas.height / PITCH_PX) * PITCH_MM;

  // Center the layout on the physical paper page
  const posX = Math.max(5, (pageWidthMm - imgWidthMm) / 2);
  const posY = Math.max(5, (pageHeightMm - imgHeightMm) / 2);

  doc.addImage(imgData, 'PNG', posX, posY, imgWidthMm, imgHeightMm, undefined, 'FAST');

  return doc;
}

/**
 * Downloads the 1:1 scale PDF file.
 */
export function downloadBoardPdf(params: RenderBoardParams): void {
  const { projectName, options } = params;
  const doc = generatePdfDocument(params);
  const sanitizedName = (projectName || 'PerfTrace').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${sanitizedName}_1-1_${options.side}_${options.style}_v1.1.pdf`;
  doc.save(filename);
}

/**
 * Opens the native browser print dialog with the exact 1:1 millimeter layout.
 */
export function printBoardDirectly(params: RenderBoardParams): void {
  const canvas = renderBoardToCanvas(params);
  const dataUrl = canvas.toDataURL('image/png', 1.0);

  const imgWidthMm = (canvas.width / PITCH_PX) * PITCH_MM;
  const imgHeightMm = (canvas.height / PITCH_PX) * PITCH_MM;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the print dialog.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print 1:1 Scale — ${params.projectName}</title>
        <style>
          @page {
            size: ${params.options.paperFormat};
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #ffffff;
          }
          img {
            width: ${imgWidthMm.toFixed(2)}mm;
            height: ${imgHeightMm.toFixed(2)}mm;
            display: block;
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" onload="window.focus(); window.print(); window.close();" />
      </body>
    </html>
  `);
  printWindow.document.close();
}
