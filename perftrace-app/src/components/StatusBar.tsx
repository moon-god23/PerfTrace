import React from 'react';
import { useUIStore } from '../store';

const columnToLetter = (col: number) => {
  let letter = '';
  let temp = col;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

export const StatusBar: React.FC = () => {
  const { cursorHole, zoom } = useUIStore();

  let coordinateDisplay = "-";
  if (cursorHole) {
    const colStr = columnToLetter(cursorHole.col);
    const rowStr = cursorHole.row + 1;
    coordinateDisplay = `${colStr}${rowStr}`;
  }

  return (
    <div className="h-8 bg-[#0f111a] border-t border-[#2a2d3e] flex items-center justify-between px-6 text-[11px] text-[#4b5563] select-none z-10 w-full shrink-0 font-sans tracking-wide">
      <div className="flex items-center space-x-6">
        <span>Hole: <strong className="text-[#10b981] font-medium ml-1">{coordinateDisplay}</strong></span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
      
      <div className="flex items-center">
        <span>Drag to pan • Scroll to zoom</span>
      </div>
    </div>
  );
};
