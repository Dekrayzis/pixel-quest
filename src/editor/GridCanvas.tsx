import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { EditorZone, EditorLevel, Tool } from './types';
import { TILE_TYPES, ENEMY_TYPES } from './types';

const CELL = 28; // px per cell in editor view
const GRID_COLOR = 'rgba(0,0,0,0.15)';

interface Props {
  zone: EditorZone;
  level: EditorLevel;
  activeZoneId: string;
  tool: Tool;
  selectedTile: number;
  onCellClick: (col: number, row: number) => void;
}

function tileColor(type: number): string {
  return TILE_TYPES.find((t) => t.value === type)?.color ?? '#87CEEB';
}

function enemyColor(type: string): string {
  return ENEMY_TYPES.find((e) => e.value === type)?.color ?? '#FF0000';
}

export function GridCanvas({ zone, level, activeZoneId, tool, onCellClick }: Props): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const lastPaintCell = useRef<{ col: number; row: number } | null>(null);

  const width = zone.cols * CELL;
  const height = zone.rows * CELL;

  // ---------- Drawing ----------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw tiles
    for (let r = 0; r < zone.rows; r++) {
      for (let c = 0; c < zone.cols; c++) {
        const type = zone.map[r][c];
        ctx.fillStyle = tileColor(type);
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);

        // Tile number overlay for non-empty
        if (type > 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(type), c * CELL + CELL / 2, r * CELL + CELL / 2);
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= zone.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, height);
      ctx.stroke();
    }
    for (let r = 0; r <= zone.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(width, r * CELL);
      ctx.stroke();
    }

    // Coins
    for (const coin of zone.coins) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(coin.col * CELL + CELL / 2, coin.row * CELL + CELL / 2, CELL * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Enemies
    for (const enemy of zone.enemies) {
      ctx.fillStyle = enemyColor(enemy.type);
      const ex = enemy.col * CELL + 2;
      const ey = enemy.row * CELL + 2;
      const es = CELL - 4;
      ctx.fillRect(ex, ey, es, es);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(enemy.type[0].toUpperCase(), ex + es / 2, ey + es / 2);
    }

    // Player start (only on overworld)
    if (activeZoneId === 'overworld') {
      const px = level.playerStartCol * CELL;
      const py = level.playerStartRow * CELL;
      ctx.fillStyle = 'rgba(0,120,255,0.6)';
      ctx.fillRect(px + 4, py + 4, CELL - 8, CELL - 8);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', px + CELL / 2, py + CELL / 2);
    }

    // Flag (only on overworld)
    if (activeZoneId === 'overworld') {
      const fx = level.flagCol * CELL;
      const fy = level.flagRow * CELL;
      ctx.fillStyle = 'rgba(255,0,0,0.6)';
      ctx.fillRect(fx + 4, fy + 4, CELL - 8, CELL - 8);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('F', fx + CELL / 2, fy + CELL / 2);
    }

    // Warp pipe markers
    for (const wp of level.warpPipes) {
      if (wp.entryZone === activeZoneId) {
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 2;
        ctx.strokeRect(wp.entryCol * CELL + 1, wp.entryRow * CELL + 1, CELL - 2, CELL - 2);
        ctx.fillStyle = '#FF00FF';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('IN', wp.entryCol * CELL + CELL / 2, wp.entryRow * CELL + 2);
      }
      if (wp.exitZone === activeZoneId) {
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(wp.exitCol * CELL + 1, wp.exitRow * CELL + 1, CELL - 2, CELL - 2);
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('OUT', wp.exitCol * CELL + CELL / 2, wp.exitRow * CELL + 2);
      }
    }
  }, [zone, level, activeZoneId, width, height]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ---------- Interaction ----------
  const cellFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { col: number; row: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor((e.clientX - rect.left) / CELL);
      const row = Math.floor((e.clientY - rect.top) / CELL);
      if (col < 0 || col >= zone.cols || row < 0 || row >= zone.rows) return null;
      return { col, row };
    },
    [zone.cols, zone.rows]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const cell = cellFromEvent(e);
      if (!cell) return;
      setIsPainting(true);
      lastPaintCell.current = cell;
      onCellClick(cell.col, cell.row);
    },
    [cellFromEvent, onCellClick]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isPainting) return;
      // Only continuous painting for tile and eraser tools
      if (tool !== 'tile' && tool !== 'eraser') return;
      const cell = cellFromEvent(e);
      if (!cell) return;
      if (lastPaintCell.current && lastPaintCell.current.col === cell.col && lastPaintCell.current.row === cell.row) return;
      lastPaintCell.current = cell;
      onCellClick(cell.col, cell.row);
    },
    [isPainting, tool, cellFromEvent, onCellClick]
  );

  const handleMouseUp = useCallback(() => {
    setIsPainting(false);
    lastPaintCell.current = null;
  }, []);

  // Cursor style based on tool
  const cursorClass = tool === 'eraser' ? 'canvas--eraser' : tool === 'tile' ? 'canvas--paint' : 'canvas--crosshair';

  return (
    <div className="grid-canvas-container" ref={containerRef}>
      <div className="grid-canvas-info">
        <span>{activeZoneId}</span>
        <span>{zone.cols} × {zone.rows}</span>
        <span>({zone.kind})</span>
      </div>
      <div className="grid-canvas-scroll">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`grid-canvas ${cursorClass}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}
