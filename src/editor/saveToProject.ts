import type { EditorLevel } from './types';
import { exportLevelToTS } from './exportLevel';

interface SaveResult {
  ok: boolean;
  file: string;
  levelsRegistered: string[];
}

/**
 * Save a level directly to the project's src/data/ folder
 * and auto-update levels.ts via the Vite dev server API.
 */
export async function saveToProject(level: EditorLevel, filename?: string): Promise<SaveResult> {
  const code = exportLevelToTS(level);
  const safeName = filename || `level${sanitizeId(level.id)}.ts`;
  const exportName = `LEVEL_${level.id.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;

  const res = await fetch('/api/save-level', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: safeName,
      content: code,
      exportName,
      levelId: level.id,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/** Fetch list of currently registered levels from the project */
export async function fetchRegisteredLevels(): Promise<{ file: string; exportName: string; levelId: string }[]> {
  const res = await fetch('/api/levels');
  if (!res.ok) return [];
  const data = await res.json();
  return data.levels || [];
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}
