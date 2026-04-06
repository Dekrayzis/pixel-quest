import React, { useState, useCallback } from 'react';
import {
  type EditorLevel,
  type EditorZone,
  type EditorWarpPipe,
  type Tool,
  type EnemyType,
  type ZoneKind,
  TILE_TYPES,
  ENEMY_TYPES,
  createDefaultLevel,
  createEmptyZone,
  uid,
} from './types';
import { GridCanvas } from './GridCanvas';
import { exportLevelToTS, downloadFile } from './exportLevel';
import { importLevelFromGame, getAvailableLevels } from './importLevel';
import { saveToProject, fetchRegisteredLevels } from './saveToProject';

export function LevelEditor(): React.ReactElement {
  const [level, setLevel] = useState<EditorLevel>(createDefaultLevel);
  const [activeZoneId, setActiveZoneId] = useState('overworld');
  const [tool, setTool] = useState<Tool>('tile');
  const [selectedTile, setSelectedTile] = useState(1);
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyType>('goomba');
  const [showExport, setShowExport] = useState(false);
  const [exportCode, setExportCode] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveFilename, setSaveFilename] = useState('');

  // Warp pipe editing state
  const [editingWarp, setEditingWarp] = useState<Partial<EditorWarpPipe> | null>(null);

  // New zone dialog
  const [showNewZone, setShowNewZone] = useState(false);
  const [newZoneId, setNewZoneId] = useState('');
  const [newZoneKind, setNewZoneKind] = useState<ZoneKind>('underground');
  const [newZoneCols, setNewZoneCols] = useState(20);
  const [newZoneRows, setNewZoneRows] = useState(12);

  const activeZone = level.zones[activeZoneId];
  const zoneIds = Object.keys(level.zones);

  // ---------- Level metadata ----------
  const updateLevelMeta = useCallback((patch: Partial<EditorLevel>) => {
    setLevel((prev) => ({ ...prev, ...patch }));
  }, []);

  // ---------- Zone mutations ----------
  const updateZone = useCallback(
    (zoneId: string, updater: (z: EditorZone) => EditorZone) => {
      setLevel((prev) => ({
        ...prev,
        zones: {
          ...prev.zones,
          [zoneId]: updater(prev.zones[zoneId]),
        },
      }));
    },
    []
  );

  const addZone = useCallback(() => {
    if (!newZoneId.trim() || level.zones[newZoneId]) return;
    const zone = createEmptyZone(newZoneId, newZoneKind, newZoneCols, newZoneRows);
    // Add ground on bottom two rows
    for (let c = 0; c < newZoneCols; c++) {
      zone.map[newZoneRows - 2][c] = 1;
      zone.map[newZoneRows - 1][c] = 1;
    }
    setLevel((prev) => ({
      ...prev,
      zones: { ...prev.zones, [newZoneId]: zone },
    }));
    setActiveZoneId(newZoneId);
    setShowNewZone(false);
    setNewZoneId('');
  }, [level.zones, newZoneId, newZoneKind, newZoneCols, newZoneRows]);

  const deleteZone = useCallback(
    (zoneId: string) => {
      if (zoneId === 'overworld') return; // Can't delete overworld
      const { [zoneId]: _, ...rest } = level.zones;
      setLevel((prev) => ({
        ...prev,
        zones: rest,
        warpPipes: prev.warpPipes.filter(
          (wp) => wp.entryZone !== zoneId && wp.exitZone !== zoneId
        ),
      }));
      if (activeZoneId === zoneId) setActiveZoneId('overworld');
    },
    [level.zones, activeZoneId]
  );

  // ---------- Grid click handler ----------
  const handleCellClick = useCallback(
    (col: number, row: number) => {
      if (!activeZone) return;

      switch (tool) {
        case 'tile':
          updateZone(activeZoneId, (z) => {
            const newMap = z.map.map((r) => [...r]);
            newMap[row][col] = selectedTile;
            return { ...z, map: newMap };
          });
          break;

        case 'eraser':
          updateZone(activeZoneId, (z) => {
            const newMap = z.map.map((r) => [...r]);
            newMap[row][col] = 0;
            // Also remove any enemies/coins at this cell
            return {
              ...z,
              map: newMap,
              enemies: z.enemies.filter((e) => !(e.col === col && e.row === row)),
              coins: z.coins.filter((c) => !(c.col === col && c.row === row)),
            };
          });
          break;

        case 'enemy':
          updateZone(activeZoneId, (z) => {
            // Remove existing enemy at same cell, then add
            const filtered = z.enemies.filter((e) => !(e.col === col && e.row === row));
            return {
              ...z,
              enemies: [...filtered, { id: uid(), type: selectedEnemy, col, row }],
            };
          });
          break;

        case 'coin':
          updateZone(activeZoneId, (z) => {
            const exists = z.coins.some((c) => c.col === col && c.row === row);
            if (exists) {
              return { ...z, coins: z.coins.filter((c) => !(c.col === col && c.row === row)) };
            }
            return { ...z, coins: [...z.coins, { id: uid(), col, row }] };
          });
          break;

        case 'playerStart':
          if (activeZoneId === 'overworld') {
            updateLevelMeta({ playerStartCol: col, playerStartRow: row });
          }
          break;

        case 'flag':
          if (activeZoneId === 'overworld') {
            updateLevelMeta({ flagCol: col, flagRow: row });
          }
          break;

        case 'warpEntry':
          setEditingWarp((prev) => ({
            ...prev,
            id: prev?.id || `warp-${uid()}`,
            entryZone: activeZoneId,
            entryCol: col,
            entryRow: row,
          }));
          break;

        case 'warpExit':
          if (editingWarp) {
            const completed: EditorWarpPipe = {
              id: editingWarp.id || `warp-${uid()}`,
              entryZone: editingWarp.entryZone || activeZoneId,
              entryCol: editingWarp.entryCol || 0,
              entryRow: editingWarp.entryRow || 0,
              exitZone: activeZoneId,
              exitCol: col,
              exitRow: row,
              exitPlayerCol: col,
              exitPlayerRow: row - 1,
              emergeDirection: 'up',
            };
            setLevel((prev) => ({
              ...prev,
              warpPipes: [...prev.warpPipes, completed],
            }));
            setEditingWarp(null);
            setTool('tile');
          }
          break;
      }
    },
    [tool, selectedTile, selectedEnemy, activeZoneId, activeZone, updateZone, updateLevelMeta, editingWarp]
  );

  // ---------- Resize zone ----------
  const resizeZone = useCallback(
    (zoneId: string, newCols: number, newRows: number) => {
      updateZone(zoneId, (z) => {
        const map: number[][] = [];
        for (let r = 0; r < newRows; r++) {
          const row: number[] = [];
          for (let c = 0; c < newCols; c++) {
            row.push(r < z.rows && c < z.cols ? z.map[r][c] : 0);
          }
          map.push(row);
        }
        return {
          ...z,
          cols: newCols,
          rows: newRows,
          map,
          enemies: z.enemies.filter((e) => e.col < newCols && e.row < newRows),
          coins: z.coins.filter((c) => c.col < newCols && c.row < newRows),
        };
      });
    },
    [updateZone]
  );

  // ---------- Export ----------
  const handleExport = useCallback(() => {
    const code = exportLevelToTS(level);
    setExportCode(code);
    setShowExport(true);
  }, [level]);

  const handleDownload = useCallback(() => {
    const code = exportLevelToTS(level);
    const filename = `level_${level.id.replace(/[^a-zA-Z0-9]/g, '_')}.ts`;
    downloadFile(code, filename);
  }, [level]);

  // ---------- Import ----------
  const handleImportBuiltin = useCallback(async (levelId: string) => {
    const imported = importLevelFromGame(levelId);
    if (imported) {
      setLevel(imported);
      setActiveZoneId('overworld');
      // Look up the actual source filename so Save to Project works immediately
      try {
        const registered = await fetchRegisteredLevels();
        const match = registered.find((l) => l.levelId === levelId);
        setSaveFilename(match ? `${match.file}.ts` : `level${levelId.replace(/[^a-zA-Z0-9]/g, '_')}.ts`);
      } catch {
        setSaveFilename(`level${levelId.replace(/[^a-zA-Z0-9]/g, '_')}.ts`);
      }
      setSaveStatus('idle');
    }
  }, []);

  // ---------- Delete warp pipe ----------
  const deleteWarp = useCallback((warpId: string) => {
    setLevel((prev) => ({
      ...prev,
      warpPipes: prev.warpPipes.filter((wp) => wp.id !== warpId),
    }));
  }, []);

  // ---------- Save/Load JSON ----------
  const handleSaveJSON = useCallback(() => {
    const json = JSON.stringify(level, null, 2);
    downloadFile(json, `level_${level.id.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
  }, [level]);

  const handleLoadJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as EditorLevel;
          setLevel(data);
          setActiveZoneId('overworld');
          // Auto-populate save filename from the level ID
          setSaveFilename(`level${data.id.replace(/[^a-zA-Z0-9]/g, '_')}.ts`);
          setSaveStatus('idle');
        } catch {
          alert('Failed to parse level JSON.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // ---------- Save to Project ----------
  const handleSaveToProject = useCallback(async () => {
    const fname = saveFilename.trim() || `level_${level.id.replace(/[^a-zA-Z0-9]/g, '_')}.ts`;
    setSaveStatus('saving');
    try {
      const result = await saveToProject(level, fname);
      setSaveStatus('saved');
      setSaveFilename(result.file);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      alert(`Save failed: ${err.message}`);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [level, saveFilename]);

  return (
    <div className="editor">
      {/* ─── Header ─── */}
      <header className="editor__header">
        <h1 className="editor__title">Pixel Quest - Level Editor</h1>
        <div className="editor__header-actions">
          <button onClick={() => { setLevel(createDefaultLevel()); setActiveZoneId('overworld'); setSaveFilename(''); setSaveStatus('idle'); }} className="btn btn--new">New Level</button>
          <span className="save-divider">|</span>
          <button onClick={handleSaveJSON} className="btn btn--secondary">Save JSON</button>
          <button onClick={handleLoadJSON} className="btn btn--secondary">Load JSON</button>
          <button onClick={handleExport} className="btn btn--primary">Export .ts</button>
          <button onClick={handleDownload} className="btn btn--accent">Download .ts</button>
          <span className="save-divider">|</span>
          <input
            className="save-filename"
            type="text"
            placeholder="filename.ts"
            value={saveFilename}
            onChange={(e) => setSaveFilename(e.target.value)}
          />
          <button
            onClick={handleSaveToProject}
            className={`btn btn--save ${saveStatus === 'saved' ? 'btn--saved' : saveStatus === 'saving' ? 'btn--saving' : ''}`}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save to Project'}
          </button>
        </div>
      </header>

      <div className="editor__body">
        {/* ─── Left Sidebar ─── */}
        <aside className="editor__sidebar">
          {/* Level Info */}
          <section className="panel">
            <h3 className="panel__title">Level Info</h3>
            <label className="field">
              <span>ID</span>
              <input
                type="text"
                value={level.id}
                onChange={(e) => updateLevelMeta({ id: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Display Name</span>
              <input
                type="text"
                value={level.displayName}
                onChange={(e) => updateLevelMeta({ displayName: e.target.value })}
              />
            </label>
          </section>

          {/* Import */}
          <section className="panel">
            <h3 className="panel__title">Import Existing</h3>
            <div className="import-list">
              {getAvailableLevels().map((l) => (
                <button
                  key={l.id}
                  className="import-list__item"
                  onClick={() => handleImportBuiltin(l.id)}
                >
                  <span className="import-list__id">{l.id}</span>
                  <span className="import-list__name">{l.displayName}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Zones */}
          <section className="panel">
            <h3 className="panel__title">Zones</h3>
            <div className="zone-tabs">
              {zoneIds.map((zId) => (
                <div key={zId} className={`zone-tab ${zId === activeZoneId ? 'zone-tab--active' : ''}`}>
                  <button className="zone-tab__btn" onClick={() => setActiveZoneId(zId)}>
                    {zId} ({level.zones[zId].cols}x{level.zones[zId].rows})
                  </button>
                  {zId !== 'overworld' && (
                    <button className="zone-tab__del" onClick={() => deleteZone(zId)} title="Delete zone">
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setShowNewZone(true)} className="btn btn--small btn--accent">
              + Add Zone
            </button>

            {activeZone && (
              <div className="zone-resize">
                <label className="field field--inline">
                  <span>Cols</span>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={activeZone.cols}
                    onChange={(e) => resizeZone(activeZoneId, Number(e.target.value), activeZone.rows)}
                  />
                </label>
                <label className="field field--inline">
                  <span>Rows</span>
                  <input
                    type="number"
                    min={5}
                    max={30}
                    value={activeZone.rows}
                    onChange={(e) => resizeZone(activeZoneId, activeZone.cols, Number(e.target.value))}
                  />
                </label>
              </div>
            )}
          </section>

          {/* Tools */}
          <section className="panel">
            <h3 className="panel__title">Tools</h3>
            <div className="tool-grid">
              {([
                ['tile', 'Tile Paint'],
                ['eraser', 'Eraser'],
                ['enemy', 'Enemy'],
                ['coin', 'Coin'],
                ['playerStart', 'Player Start'],
                ['flag', 'Flag'],
                ['warpEntry', 'Warp Entry'],
                ['warpExit', 'Warp Exit'],
              ] as [Tool, string][]).map(([t, label]) => (
                <button
                  key={t}
                  className={`tool-btn ${tool === t ? 'tool-btn--active' : ''}`}
                  onClick={() => setTool(t)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Tile Palette */}
          {tool === 'tile' && (
            <section className="panel">
              <h3 className="panel__title">Tile Palette</h3>
              <div className="palette">
                {TILE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    className={`palette__swatch ${selectedTile === t.value ? 'palette__swatch--active' : ''}`}
                    style={{ backgroundColor: t.color }}
                    onClick={() => setSelectedTile(t.value)}
                    title={t.label}
                  >
                    {t.value}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Enemy Selector */}
          {tool === 'enemy' && (
            <section className="panel">
              <h3 className="panel__title">Enemy Type</h3>
              <div className="palette">
                {ENEMY_TYPES.map((e) => (
                  <button
                    key={e.value}
                    className={`palette__swatch palette__swatch--wide ${selectedEnemy === e.value ? 'palette__swatch--active' : ''}`}
                    style={{ backgroundColor: e.color }}
                    onClick={() => setSelectedEnemy(e.value)}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Warp Pipes */}
          <section className="panel">
            <h3 className="panel__title">Warp Pipes ({level.warpPipes.length})</h3>
            {editingWarp && (
              <div className="warp-editing">
                Defining warp... Entry: {editingWarp.entryZone} ({editingWarp.entryCol},{editingWarp.entryRow})
                <br />
                Switch to exit zone and use "Warp Exit" tool to place the exit.
              </div>
            )}
            <div className="warp-list">
              {level.warpPipes.map((wp) => (
                <div key={wp.id} className="warp-item">
                  <span>
                    {wp.entryZone}[{wp.entryCol},{wp.entryRow}] → {wp.exitZone}[{wp.exitCol},{wp.exitRow}] ({wp.emergeDirection})
                  </span>
                  <button className="zone-tab__del" onClick={() => deleteWarp(wp.id)}>
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* ─── Canvas area ─── */}
        <main className="editor__canvas-area">
          {activeZone ? (
            <GridCanvas
              zone={activeZone}
              level={level}
              activeZoneId={activeZoneId}
              tool={tool}
              selectedTile={selectedTile}
              onCellClick={handleCellClick}
            />
          ) : (
            <div className="editor__empty">No zone selected</div>
          )}
        </main>
      </div>

      {/* ─── New Zone Dialog ─── */}
      {showNewZone && (
        <div className="modal-overlay" onClick={() => setShowNewZone(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Zone</h3>
            <label className="field">
              <span>Zone ID (e.g. "underground", "coin_vault")</span>
              <input value={newZoneId} onChange={(e) => setNewZoneId(e.target.value)} />
            </label>
            <label className="field">
              <span>Kind</span>
              <select value={newZoneKind} onChange={(e) => setNewZoneKind(e.target.value as ZoneKind)}>
                <option value="overworld">Overworld</option>
                <option value="underground">Underground</option>
              </select>
            </label>
            <label className="field">
              <span>Columns</span>
              <input type="number" min={5} max={200} value={newZoneCols} onChange={(e) => setNewZoneCols(Number(e.target.value))} />
            </label>
            <label className="field">
              <span>Rows</span>
              <input type="number" min={5} max={30} value={newZoneRows} onChange={(e) => setNewZoneRows(Number(e.target.value))} />
            </label>
            <div className="modal__actions">
              <button onClick={() => setShowNewZone(false)} className="btn btn--secondary">Cancel</button>
              <button onClick={addZone} className="btn btn--primary">Add Zone</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Export Preview ─── */}
      {showExport && (
        <div className="modal-overlay" onClick={() => setShowExport(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <h3>Exported TypeScript</h3>
            <textarea
              className="export-preview"
              readOnly
              value={exportCode}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <div className="modal__actions">
              <button onClick={() => setShowExport(false)} className="btn btn--secondary">Close</button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportCode);
                }}
                className="btn btn--primary"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
