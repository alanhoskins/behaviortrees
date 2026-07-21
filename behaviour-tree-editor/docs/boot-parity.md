# Boot parity with the classic editor

The classic editor's [`src/app/app.js`](../../src/app/app.js) is not tree logic — it is the
**boot contract**: everything that happens between page load and a usable editor. Format-level
parity is covered elsewhere (see [Related coverage](#related-coverage)); this document tracks
the startup obligations specifically, and which of them this app is expected to honour.

Automated coverage lives in [`src/boot-parity.test.tsx`](../src/boot-parity.test.tsx) (headless,
runs with `pnpm test`) and steps 4–5 of [`scripts/live-parity.cjs`](../scripts/live-parity.cjs)
(real browser, driving the new editor and comparing against the classic editor's step-1 export).

## The contract

| `app.js` | Obligation | Here | Status |
|---|---|---|---|
| :10 | `isDesktop` from Electron globals | — | **Non-goal** — this app is web-only |
| :12-14 | `$rootScope.go` navigation helper | `react-router-dom` | Equivalent by construction |
| :30 | `$location.path('/')` — always boot at home | `BrowserRouter` honours the real URL | **Intentional divergence** — deep links are a feature here |
| :33-35 | Tag the canvas `b3-drop-node` so palette nodes can be dropped | `behavior-tree-editor.tsx` `onDragOver`/`onDrop` | Covered (live harness step 5) |
| :38 | `settingsModel.getSettings()` applies settings to the editor singleton | `behavior-tree-editor.tsx` reads `bt-show-grid`/`bt-auto-save` at editor mount; `app-base.tsx` applies `bt-theme` | Equivalent by different means — there is no global editor singleton to configure |
| :39-93 | Reopen the project the last session left open | `app-base.tsx` → `useProjectStore.restoreLastProject` | Covered |
| :82-84 | A corrupt recent project must not block startup | `restoreLastProject` returns `false` on parse failure | Covered |
| :43-51 | Fade out and remove `#page-preload` | — | **Non-goal** — Vite ships no splash screen |
| :53-77 | `?example=` → open/create the `Examples` project → import → go to the editor | `components/example-loader.tsx` | Covered |
| :68-72 | Branch on `data.trees`: project files import via `projectAsData`, tree files via `treeAsData` | `example-loader.tsx` branches on `parseImportedJson`'s `kind` | Covered (was a real gap — see below) |
| :73 | `editor.clearDirty()` so the leave-guard does not fire | — | **Non-goal** — this app has no `beforeunload` guard to clear |

## Deliberate additions

Behaviour this app has that `app.js` does not. These are choices, not drift, and the tests
pin them so they stay choices:

- **Errors are surfaced.** A missing or malformed `?example=` file fails silently in the
  classic editor; here it logs and raises a toast without disturbing startup.
- **A starter project on first visit.** `pages/editor/editor-page.tsx` creates a "Demo Project"
  when someone reaches `/editor` with no project *and* no stored projects. The classic editor
  shows an empty editor instead. Anyone who closed their project on purpose still gets the
  "No Project Open" screen.
- **Bundles without `selectedTree` select the first tree, not the last.** `b3ToProject` defaults
  `selectedTreeId` to the first tree when the file omits `selectedTree`, so the example loader
  always selects it; the classic editor only selects when the file says to, leaving the
  last-added tree active. Visible only for multi-tree bundles with no `selectedTree`, and
  first-tree feels like the saner landing spot.

## Gaps found and closed

- **Project-shaped example files were rejected.** `example-loader.tsx` required
  `kind === 'tree'` and threw on anything else, while `app.js:68-72` has always branched on
  `data.trees`. Latent — all three files in `src/examples/` are tree-shaped — but it would
  have broken silently the moment a bundled example was added. The loader now mirrors
  `ImportManager.projectAsData`: merge the file's custom nodes and every tree into the open
  `Examples` project, then honour its `selectedTree`.

## Notes on ordering

`app.js` *sequences* the restore and the deep link: the recent project resolves, then
`loadExample()` runs, so the example always ends up as the open project. Here they are two
independent effects, and the same end state depends on `ExampleLoader`'s effect running before
`app-base`'s plus `restoreLastProject`'s "already have a project" guard. That is not obvious
from reading either file, so `boot-parity.test.tsx` pins the outcome directly.

## Running the checks

```bash
pnpm test                    # boot-parity suite plus the format-level tests
```

Against real browsers and the real classic editor:

```bash
# new editor local, classic editor from production
npm run build && npm run preview -- --port 5199 &
CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  NEW_EDITOR_URL=http://localhost:5199 node scripts/live-parity.cjs
```

Both editors local (needs Node <23 for the classic gulp build):

```bash
./build-deploy.sh && python3 -m http.server 8123 -d deploy &
OLD_EDITOR_URL=http://127.0.0.1:8123 NEW_EDITOR_URL=http://localhost:5199 \
  CHROMIUM_PATH=... node scripts/live-parity.cjs
```

## Related coverage

- `src/lib/behavior/parity.test.ts` — round-trips real classic-editor exports; asserts the
  16-node behavior3 palette
- `src/lib/behavior/cross-editor.e2e.test.ts` — feeds this app's exports through the real
  classic editor's `ImportManager` and re-exports
- `scripts/live-parity.cjs` steps 1–3 — bidirectional file parity between the two live sites
