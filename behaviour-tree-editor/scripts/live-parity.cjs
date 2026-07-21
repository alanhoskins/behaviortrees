#!/usr/bin/env node
// Live bidirectional parity check between the production old editor and the
// deployed new editor. Captures a genuine export from behaviortrees.com,
// imports it into new.behaviortrees.com through the real UI, then feeds the
// new editor's persisted output back into the old editor and compares.
//
// Usage (needs a Chromium binary; playwright-core is a devDependency):
//   CHROMIUM_PATH=/path/to/Chromium node scripts/live-parity.cjs

const { chromium } = require('playwright-core');
const os = require('os');
const path = require('path');
const fs = require('fs');

const exe = process.env.CHROMIUM_PATH || path.join(
  os.homedir(),
  'Library/Caches/ms-playwright/chromium-1193/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
);
// Default to production; override to run against local builds before deploying:
//   OLD_EDITOR_URL=http://127.0.0.1:8123 NEW_EDITOR_URL=http://127.0.0.1:5173
const OLD = process.env.OLD_EDITOR_URL || 'https://www.behaviortrees.com';
const NEW = process.env.NEW_EDITOR_URL || 'https://new.behaviortrees.com';

function semantics(tree) {
  return {
    title: tree.title,
    root: tree.root,
    nodes: Object.fromEntries(
      Object.entries(tree.nodes).map(([id, s]) => [
        id,
        {
          name: s.name,
          title: s.title,
          properties: s.properties ?? {},
          children: s.children ?? (s.child ? [s.child] : []),
        },
      ])
    ),
  };
}

function diff(a, b, label) {
  const sa = JSON.stringify(a, null, 2);
  const sb = JSON.stringify(b, null, 2);
  if (sa === sb) {
    console.log(`✅ ${label}: identical semantics`);
    return true;
  }
  console.log(`❌ ${label}: MISMATCH`);
  fs.writeFileSync(path.join(require('os').tmpdir(), `diff-${label.replace(/\W+/g, '-')}-a.json`), sa);
  fs.writeFileSync(path.join(require('os').tmpdir(), `diff-${label.replace(/\W+/g, '-')}-b.json`), sb);
  return false;
}

(async () => {
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  let ok = true;

  // ---- Step 1: capture a genuine export from LIVE production old editor ----
  const oldPage = await browser.newPage();
  const oldErrors = [];
  oldPage.on('pageerror', (e) => oldErrors.push(e.message));
  await oldPage.goto(`${OLD}/?example=enemy-patrol`);
  await oldPage.waitForFunction(
    () => {
      const p = window.editor && window.editor.project.get();
      if (!p) return false;
      const trees = [];
      p.trees.each((t) => trees.push(t));
      return trees.length >= 2;
    },
    undefined,
    { timeout: 20000 }
  );
  const liveOldExport = await oldPage.evaluate(() => {
    const p = window.editor.project.get();
    const trees = [];
    p.trees.each((t) => trees.push(t));
    p.trees.select(trees[trees.length - 1]);
    return window.editor.export.treeToData();
  });
  console.log(
    `Step 1: captured live old-editor export ("${liveOldExport.title}", ${Object.keys(liveOldExport.nodes).length} nodes, ${liveOldExport.custom_nodes.length} custom)`
  );
  const exportFile = path.join(require('os').tmpdir(), 'live-old-export.json');
  fs.writeFileSync(exportFile, JSON.stringify(liveOldExport, null, 2));

  // ---- Step 2: import that file into LIVE new editor through its UI ----
  const newPage = await browser.newPage();
  const newErrors = [];
  newPage.on('pageerror', (e) => newErrors.push(e.message));
  await newPage.goto(NEW); await newPage.getByRole('link', { name: 'Projects', exact: true }).click();
  await newPage.getByRole('button', { name: /new project/i }).first().click();
  await newPage.getByPlaceholder('My Behavior Tree Project').fill('Live Parity');
  await newPage.getByRole('button', { name: 'Create Project' }).click();
  await newPage.waitForURL('**/editor');
  await newPage.waitForTimeout(500);

  // Deployment freshness: the behavior3 palette only exists post-parity work
  const hasMemSequence = await newPage.evaluate(() => document.body.innerText.includes('MemSequence'));
  console.log(`Step 2: new editor deploy is ${hasMemSequence ? 'current (behavior3 palette present)' : 'STALE — MemSequence missing'}`);
  if (!hasMemSequence) ok = false;

  await newPage.setInputFiles('#bt-file-import', exportFile);
  await newPage.waitForTimeout(1200);
  const canvas = await newPage.evaluate(() => ({
    nodes: document.querySelectorAll('.react-flow__node').length,
    edges: document.querySelectorAll('.react-flow__edge').length,
  }));
  console.log(`Step 2: imported into new editor — ${canvas.nodes} nodes, ${canvas.edges} edges on canvas`);

  await newPage.getByRole('button', { name: 'Save' }).click();
  await newPage.waitForTimeout(600);
  const newProjectExport = await newPage.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bt-project-')) {
        return JSON.parse(localStorage.getItem(key));
      }
    }
    return null;
  });
  const newExport = newProjectExport
    ? newProjectExport.trees.find((t) => t.id === liveOldExport.id) || null
    : null;

  if (!newExport) {
    console.log('❌ Step 2: could not find imported tree in new editor persistence');
    ok = false;
  } else {
    ok = diff(semantics(liveOldExport), semantics(newExport), 'old-to-new') && ok;
    // display must be preserved exactly too (no auto-layout: file had display)
    const posOk = Object.values(liveOldExport.nodes).every((s) => {
      const n = newExport.nodes[s.id];
      return n && n.display.x === s.display.x && n.display.y === s.display.y;
    });
    console.log(posOk ? '✅ positions preserved exactly' : '❌ positions changed');
    ok = posOk && ok;
  }

  // ---- Step 3: feed the new editor's export back into LIVE old editor ----
  if (newExport) {
    const reExported = await oldPage.evaluate(({ project, treeId }) => {
      // Full project import: registers custom_nodes, then loads all trees
      window.editor.project.open(project);
      const p = window.editor.project.get();
      let target = null;
      p.trees.each((t) => { if (t._id === treeId) target = t; });
      p.trees.select(target);
      return window.editor.export.treeToData();
    }, { project: newProjectExport, treeId: liveOldExport.id });
    ok = diff(semantics(newExport), semantics(reExported), 'new-to-old') && ok;
  }

  // ---- Step 4: boot parity — the same ?example= deep link on both editors ----
  // app.js:53-77 wires ?example= to open/create an "Examples" project and land
  // in the editor. Steps 1-3 compared file round-trips; this compares what each
  // editor produces from an identical cold boot, which is the app.js contract.
  const bootPage = await browser.newPage();
  const bootErrors = [];
  bootPage.on('pageerror', (e) => bootErrors.push(e.message));
  await bootPage.goto(`${NEW}/?example=enemy-patrol`);

  const booted = await bootPage
    .waitForFunction(
      () => {
        if (!location.pathname.startsWith('/editor')) return false;
        const raw = localStorage.getItem('bt-project-examples');
        if (!raw) return false;
        const p = JSON.parse(raw);
        return p.trees && p.trees.length > 0 ? p : false;
      },
      undefined,
      { timeout: 20000 }
    )
    .then((handle) => handle.jsonValue())
    .catch(() => null);

  if (!booted) {
    console.log('❌ Step 4: new editor did not complete the ?example= boot');
    ok = false;
  } else {
    const bootTree = booted.trees.find((t) => t.id === liveOldExport.id) || booted.trees[0];
    console.log(
      `Step 4: new editor booted from ?example= into "${booted.name}" (${booted.trees.length} tree(s))`
    );
    ok = diff(semantics(liveOldExport), semantics(bootTree), 'boot-deep-link') && ok;
  }

  // ---- Step 5: palette drag-and-drop (app.js:33-35 canvas drop wiring) ----
  // The classic editor tags the canvas b3-drop-node so palette entries can be
  // dropped onto it. This is the one boot obligation jsdom cannot cover, since
  // ReactFlow needs real layout measurement to place the dropped block.
  if (booted) {
    const before = await bootPage.evaluate(() => document.querySelectorAll('.react-flow__node').length);
    // Whatever the palette shows on its default tab — the point is the drop
    // wiring, not any particular node type
    const source = bootPage.locator('[data-palette-node]:visible').first();
    const canvas = bootPage.locator('.react-flow__pane').first();

    try {
      await source.waitFor({ timeout: 5000 });
      await source.dragTo(canvas);
      await bootPage.waitForFunction(
        (n) => document.querySelectorAll('.react-flow__node').length > n,
        before,
        { timeout: 5000 }
      );
      const after = await bootPage.evaluate(() => document.querySelectorAll('.react-flow__node').length);
      console.log(`✅ palette drag-and-drop adds a block to the canvas (${before} → ${after})`);
    } catch {
      console.log(`❌ palette drag-and-drop did not add a block (still ${before} nodes)`);
      ok = false;
    }
  }

  console.log('old editor page errors:', JSON.stringify(oldErrors));
  console.log('new editor page errors:', JSON.stringify(newErrors));
  console.log('boot page errors:', JSON.stringify(bootErrors));
  if (bootErrors.length) ok = false;
  if (oldErrors.length || newErrors.length) ok = false;

  console.log(ok ? '\nRESULT: ✅ LIVE PARITY CONFIRMED' : '\nRESULT: ❌ PARITY FAILURES — see diffs');
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
