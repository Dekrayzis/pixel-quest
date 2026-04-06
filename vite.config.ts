import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function discoverLevels(dataDir: string) {
  const files = fs.readdirSync(dataDir).filter((f: string) => /^level\d+\.ts$/.test(f));
  const results: { file: string; exportName: string; levelId: string }[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    const match = content.match(/export\s+const\s+(\w+)\s*:\s*LevelDefinition/);
    if (match) {
      // Try to extract level id from the file (e.g. id: '1-4')
      const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
      results.push({ file: file.replace('.ts', ''), exportName: match[1], levelId: idMatch?.[1] ?? '' });
    }
  }
  return results;
}

function regenerateRegistry(dataDir: string, levels: { file: string; exportName: string }[]) {
  const levelsPath = path.join(dataDir, 'levels.ts');
  const existing = fs.readFileSync(levelsPath, 'utf-8');
  const lines = existing.split('\n');
  let cutIndex = -1, braceCount = 0, inLevelDef = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export interface LevelDefinition')) inLevelDef = true;
    if (inLevelDef) {
      if (lines[i].includes('{')) braceCount++;
      if (lines[i].includes('}')) braceCount--;
      if (braceCount === 0 && inLevelDef) { cutIndex = i; break; }
    }
  }
  if (cutIndex === -1) { console.error('[level-save] Could not find LevelDefinition end'); return; }
  const header = lines.slice(0, cutIndex + 1).join('\n');
  const imports = levels.map(l => `import { ${l.exportName} } from './${l.file}';`).join('\n');
  const order = levels.map(l => `${l.exportName}.id`).join(', ');
  const entries = levels.map(l => `  [${l.exportName}.id]: ${l.exportName},`).join('\n');
  const out = [
    header, '', imports, '',
    `export const LEVEL_ORDER = [${order}];`, '',
    'export const LEVELS: Record<string, LevelDefinition> = {', entries, '};', '',
    'export function getLevel(id: string): LevelDefinition {',
    '  const level = LEVELS[id];',
    '  if (!level) throw new Error(`Unknown level: ${id}`);',
    '  return level;',
    '}', '',
    'export function getZone(levelId: string, zoneId: string): ZoneDefinition {',
    '  const level = getLevel(levelId);',
    '  const zone = level.zones[zoneId];',
    '  if (!zone) throw new Error(`Unknown zone: ${zoneId} (level: ${levelId})`);',
    '  return zone;',
    '}', '',
    'export function getZoneDims(levelId: string, zoneId: string): { cols: number; rows: number; w: number; h: number } {',
    '  const zone = getZone(levelId, zoneId);',
    '  const rows = zone.map.length;',
    '  const cols = zone.map[0]?.length ?? 0;',
    '  return { cols, rows, w: cols * 48, h: rows * 48 };',
    '}', '',
  ].join('\n');
  fs.writeFileSync(levelsPath, out, 'utf-8');
  console.log(`[level-save] Regenerated levels.ts with ${levels.length} levels`);
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'level-save',
      configureServer(server) {
        const dataDir = path.resolve(server.config.root, 'src', 'data');
        console.log('[level-save] Plugin loaded. Data dir:', dataDir);

        server.middlewares.use((req: any, res: any, next: any) => {
          // POST /api/save-level — write level file + regenerate levels.ts
          if (req.url === '/api/save-level' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
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

                // Write level file
                fs.writeFileSync(path.join(dataDir, safeName), data.content, 'utf-8');
                console.log('[level-save] Wrote', safeName);

                // Discover all level files and regenerate levels.ts
                const levels = discoverLevels(dataDir);
                regenerateRegistry(dataDir, levels);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true, file: safeName, levelsRegistered: levels.map((l: any) => l.exportName) }));
              } catch (err: any) {
                console.error('[level-save] Error:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: String(err.message || err) }));
              }
            });
            return;
          }

          // GET /api/levels — list registered levels
          if (req.url === '/api/levels' && req.method === 'GET') {
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
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        editor: 'editor.html',
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/_variables";\n@import "./src/styles/_mixins";\n`,
        silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions'],
      },
    },
  },
});
