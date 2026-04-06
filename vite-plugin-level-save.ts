/**
 * Vite plugin: Level Editor Save API
 *
 * Exposes a POST /api/save-level endpoint during dev that:
 * 1. Writes the level .ts file to src/data/
 * 2. Scans src/data/ for all level files and regenerates levels.ts imports/registry
 *
 * This means saving from the editor auto-registers levels in the game.
 */
import type { Plugin, ViteDevServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

interface SaveLevelBody {
  filename: string;
  content: string;
  exportName: string;
  levelId: string;
}

function discoverLevels(dataDir: string): { file: string; exportName: string }[] {
  const files = fs.readdirSync(dataDir).filter(
    (f: string) => /^level\d+\.ts$/.test(f)
  );

  const results: { file: string; exportName: string }[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    const match = content.match(/export\s+const\s+(\w+)\s*:\s*LevelDefinition/);
    if (match) {
      results.push({ file: file.replace('.ts', ''), exportName: match[1] });
    }
  }
  return results;
}

function regenerateLevelsRegistry(dataDir: string, levels: { file: string; exportName: string }[]): void {
  const levelsPath = path.join(dataDir, 'levels.ts');
  const existing = fs.readFileSync(levelsPath, 'utf-8');
  const lines = existing.split('\n');

  // Find the end of the LevelDefinition interface
  let cutIndex = -1;
  let braceCount = 0;
  let inLevelDef = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export interface LevelDefinition')) {
      inLevelDef = true;
    }
    if (inLevelDef) {
      if (lines[i].includes('{')) braceCount++;
      if (lines[i].includes('}')) braceCount--;
      if (braceCount === 0 && inLevelDef) {
        cutIndex = i;
        break;
      }
    }
  }

  if (cutIndex === -1) {
    console.error('[level-save] Could not find LevelDefinition interface end in levels.ts');
    return;
  }

  const header = lines.slice(0, cutIndex + 1).join('\n');
  const imports = levels.map((l) => `import { ${l.exportName} } from './${l.file}';`).join('\n');
  const orderEntries = levels.map((l) => `${l.exportName}.id`).join(', ');
  const levelsEntries = levels.map((l) => `  [${l.exportName}.id]: ${l.exportName},`).join('\n');

  const newContent = `${header}

${imports}

export const LEVEL_ORDER = [${orderEntries}];

export const LEVELS: Record<string, LevelDefinition> = {
${levelsEntries}
};

export function getLevel(id: string): LevelDefinition {
  const level = LEVELS[id];
  if (!level) throw new Error(\`Unknown level: \${id}\`);
  return level;
}

export function getZone(levelId: string, zoneId: string): ZoneDefinition {
  const level = getLevel(levelId);
  const zone = level.zones[zoneId];
  if (!zone) throw new Error(\`Unknown zone: \${zoneId} (level: \${levelId})\`);
  return zone;
}

export function getZoneDims(levelId: string, zoneId: string): { cols: number; rows: number; w: number; h: number } {
  const zone = getZone(levelId, zoneId);
  const rows = zone.map.length;
  const cols = zone.map[0]?.length ?? 0;
  return { cols, rows, w: cols * 48, h: rows * 48 };
}
`;

  fs.writeFileSync(levelsPath, newContent, 'utf-8');
  console.log(`[level-save] Regenerated levels.ts with ${levels.length} levels`);
}

/** Read the full request body as a string */
function readBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export default function levelSavePlugin(): Plugin {
  let dataDir = '';

  return {
    name: 'level-save',
    configureServer(server: ViteDevServer) {
      dataDir = path.resolve(server.config.root, 'src/data');
      console.log(`[level-save] Data dir: ${dataDir}`);

      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';

        // POST /api/save-level
        if (url === '/api/save-level' && req.method === 'POST') {
          try {
            const raw = await readBody(req);
            const data: SaveLevelBody = JSON.parse(raw);

            if (!data.filename || !data.content) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing filename or content' }));
              return;
            }

            const safeName = data.filename.replace(/[^a-zA-Z0-9_.\-]/g, '');
            if (!safeName.endsWith('.ts')) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Filename must end with .ts' }));
              return;
            }

            const filePath = path.join(dataDir, safeName);
            fs.writeFileSync(filePath, data.content, 'utf-8');
            console.log(`[level-save] Wrote ${filePath}`);

            const levels = discoverLevels(dataDir);
            regenerateLevelsRegistry(dataDir, levels);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              ok: true,
              file: safeName,
              levelsRegistered: levels.map((l: any) => l.exportName),
            }));
          } catch (err: any) {
            console.error('[level-save] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(err.message || err) }));
          }
          return;
        }

        // GET /api/levels
        if (url === '/api/levels' && req.method === 'GET') {
          try {
            const levels = discoverLevels(dataDir);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ levels }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(err.message || err) }));
          }
          return;
        }

        next();
      });
    },
  };
}
