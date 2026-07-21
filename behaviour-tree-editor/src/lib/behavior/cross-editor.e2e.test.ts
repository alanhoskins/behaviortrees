import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { B3Tree, b3ToTree, projectToB3, treeToB3, b3ToProject } from './b3';
import { DEFAULT_NODES } from './defaults';
import { Project } from '../../types';

// True cross-editor round trip: what THIS app exports is loaded into the REAL
// old editor (running in a browser) through its own ImportManager, then
// re-exported through its ExportManager and compared.
//
// Requires the old editor to be built and served, plus a Chromium binary:
//   ./build-deploy.sh && python3 -m http.server 8123 -d deploy
//   OLD_EDITOR_URL=http://127.0.0.1:8123 \
//   CHROMIUM_PATH=~/Library/Caches/ms-playwright/chromium-*/chrome-mac/Chromium.app/Contents/MacOS/Chromium \
//     npx vitest run cross-editor
//
// Skipped automatically when OLD_EDITOR_URL is not set (normal unit runs, CI).
const OLD_EDITOR_URL = process.env.OLD_EDITOR_URL;
const CHROMIUM_PATH = process.env.CHROMIUM_PATH;

const EXAMPLES_DIR = join(__dirname, '../../../../src/examples');
const load = (name: string): B3Tree =>
  JSON.parse(readFileSync(join(EXAMPLES_DIR, name), 'utf8'));

function semantics(data: B3Tree) {
  return {
    title: data.title,
    root: data.root,
    nodes: Object.fromEntries(
      Object.entries(data.nodes).map(([id, spec]) => [
        id,
        {
          name: spec.name,
          title: spec.title,
          properties: spec.properties ?? {},
          children: spec.children ?? (spec.child ? [spec.child] : []),
        },
      ]),
    ),
  };
}

describe.skipIf(!OLD_EDITOR_URL || !CHROMIUM_PATH)('old editor accepts new-editor exports', () => {
  it('tree and project exports round-trip through the old editor', async () => {
    const { chromium } = await import('playwright-core');

    // Build this app's exports for all three examples
    const trees = ['enemy-patrol.json', 'open-the-door.json', 'robot-pick-and-place.json'].map(
      (f) => {
        const { tree, nodes } = b3ToTree(load(f), DEFAULT_NODES);
        const project = { nodes: { ...DEFAULT_NODES, ...nodes } } as unknown as Project;
        return treeToB3(tree, project, true);
      },
    );
    const projectExport = projectToB3(
      b3ToProject({ trees, custom_nodes: trees.flatMap((t) => t.custom_nodes ?? []) }),
    );

    const browser = await chromium.launch({ executablePath: CHROMIUM_PATH, headless: true });
    try {
      const page = await browser.newPage();
      const pageErrors: string[] = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));

      await page.goto(OLD_EDITOR_URL!);
      await page.waitForFunction(() => !!(window as any).editor, undefined, { timeout: 15000 });

      // Tree files: import each through the old ImportManager, re-export
      for (const treeExport of trees) {
        const reExported = await page.evaluate((data) => {
          const w = window as any;
          w.editor.project.create();
          w.editor.import.treeAsData(data);
          const project = w.editor.project.get();
          const all: any[] = [];
          project.trees.each((t: any) => all.push(t));
          project.trees.select(all[all.length - 1]);
          return w.editor.export.treeToData();
        }, treeExport as any);

        expect(semantics(reExported)).toEqual(semantics(treeExport));
      }

      // Project file: import through the old projectAsData path
      const projectReExported = await page.evaluate((data) => {
        const w = window as any;
        w.editor.project.open(data);
        return w.editor.export.projectToData();
      }, projectExport as any);

      expect(projectReExported.trees).toHaveLength(projectExport.trees.length);
      expect(projectReExported.trees.map(semantics)).toEqual(projectExport.trees.map(semantics));

      const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
      expect([...projectReExported.custom_nodes].sort(byName)).toEqual(
        [...(projectExport.custom_nodes ?? [])].sort(byName),
      );

      expect(pageErrors).toEqual([]);
    } finally {
      await browser.close();
    }
  }, 60000);
});
