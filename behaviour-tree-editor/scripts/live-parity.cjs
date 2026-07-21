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
const OLD = 'https://www.behaviortrees.com';
const NEW = 'https://new.behaviortrees.com';

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

  console.log('old editor page errors:', JSON.stringify(oldErrors));
  console.log('new editor page errors:', JSON.stringify(newErrors));
  if (oldErrors.length || newErrors.length) ok = false;

  console.log(ok ? '\nRESULT: ✅ LIVE PARITY CONFIRMED' : '\nRESULT: ❌ PARITY FAILURES — see diffs');
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
