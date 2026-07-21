// @vitest-environment jsdom
//
// Boot-parity suite: the startup contract encoded in the classic editor's
// src/app/app.js, asserted against this app's equivalent boot path.
//
// app.js is not tree logic — it is what happens between page load and a
// usable editor: restore the open recent project, tolerate a corrupt one,
// honour the ?example= deep link, land in the editor. Each test below cites
// the app.js lines it mirrors. Format-level parity lives in
// src/lib/behavior/parity.test.ts; this file covers only boot.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from './app-base';
import { useProjectStore } from './stores/useProjectStore';
import type { Project } from './types';

const EXAMPLES_DIR = join(__dirname, '../../src/examples');
const PROJECT_KEY_PREFIX = 'bt-project-';
const CURRENT_PROJECT_KEY = 'bt-current-project';
const EXAMPLES_PROJECT_ID = 'examples';

const store = () => useProjectStore.getState();

const readExample = (name: string) =>
  JSON.parse(readFileSync(join(EXAMPLES_DIR, `${name}.json`), 'utf8'));

// Serve /examples/<name>.json off disk, exactly as vite.config.ts's
// examplesPlugin does in dev and as dist/examples does in production.
function stubFetch(overrides: Record<string, unknown> = {}) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const match = /\/examples\/([\w-]+)\.json$/.exec(url);
    if (!match) return new Response('not found', { status: 404 });

    const name = match[1];
    if (name in overrides) {
      const body = overrides[name];
      if (body === undefined) return new Response('not found', { status: 404 });
      return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      return new Response(readFileSync(join(EXAMPLES_DIR, `${name}.json`), 'utf8'), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response('not found', { status: 404 });
    }
  });
}

function boot(url = '/') {
  window.history.replaceState(null, '', url);
  return render(<App />);
}

/** Seed localStorage with a saved project, as a prior session would have. */
function seedSavedProject(name: string): Project {
  store().createProject(name);
  const project = store().project!;
  store().saveProject();
  useProjectStore.setState({ project: null, undoStack: [], redoStack: [], clipboard: null });
  return project;
}

beforeEach(() => {
  localStorage.clear();
  useProjectStore.setState({ project: null, undoStack: [], redoStack: [], clipboard: null });
  vi.stubGlobal('fetch', stubFetch());
  // ReactFlow measures its container; jsdom has no layout engine
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  // app-base reads the system colour-scheme preference on mount
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('startup without a deep link (app.js:79-92)', () => {
  it('cold start with empty storage renders home and opens no project', async () => {
    boot('/');

    expect(await screen.findByRole('banner')).toBeTruthy();
    expect(store().project).toBeNull();
    expect(window.location.pathname).toBe('/');
  });

  it('reopens the project left open by the previous session (app.js:79-88)', async () => {
    const saved = seedSavedProject('Previous Session');

    boot('/');

    await waitFor(() => expect(store().project).not.toBeNull());
    expect(store().project!.id).toBe(saved.id);
    expect(store().project!.name).toBe('Previous Session');
  });

  it('a corrupt recent project does not block startup (app.js:82-84)', async () => {
    localStorage.setItem(CURRENT_PROJECT_KEY, 'busted');
    localStorage.setItem(`${PROJECT_KEY_PREFIX}busted`, '{ this is not json');

    boot('/');

    expect(await screen.findByRole('banner')).toBeTruthy();
    expect(store().project).toBeNull();
  });

  it('a recent project pointing at a missing record does not block startup', async () => {
    localStorage.setItem(CURRENT_PROJECT_KEY, 'gone');

    boot('/');

    expect(await screen.findByRole('banner')).toBeTruthy();
    expect(store().project).toBeNull();
  });
});

describe('?example= deep link (app.js:53-77)', () => {
  it('loads the example into an "Examples" project and lands in the editor', async () => {
    boot('/?example=enemy-patrol');

    await waitFor(() => expect(store().project).not.toBeNull());
    const project = store().project!;
    expect(project.id).toBe(EXAMPLES_PROJECT_ID);
    expect(project.name).toBe('Examples');

    const source = readExample('enemy-patrol');
    const tree = project.trees[project.selectedTreeId!];
    expect(tree.title).toBe(source.title);
    // Every node in the file, plus the editor's own Root block — the classic
    // editor draws the same extra root that the behavior3 format leaves implicit
    expect(Object.keys(tree.blocks)).toHaveLength(Object.keys(source.nodes).length + 1);
    expect(tree.blocks[tree.rootId!].category).toBe('root');

    // app.js:74 does $state.go('editor'); the query string is dropped first
    await waitFor(() => expect(window.location.pathname).toBe('/editor'));
    expect(window.location.search).toBe('');
  });

  it('auto-organizes an example that carries no camera/display info (b3.ts:269-271)', async () => {
    // The shipped examples store every node at 0,0 and omit tree-level display.
    // The classic editor auto-organizes in that case rather than stacking the
    // nodes on top of each other, so a deep link must never land on a pile.
    // (Position *preservation*, for files that do carry display data, is
    // covered by src/lib/behavior/parity.test.ts against a real old export.)
    const source = readExample('enemy-patrol');
    expect(source.display).toBeUndefined();
    expect(
      Object.values(source.nodes as Record<string, { display: { x: number; y: number } }>)
        .every(spec => spec.display.x === 0 && spec.display.y === 0),
    ).toBe(true);

    boot('/?example=enemy-patrol');

    await waitFor(() => expect(store().project).not.toBeNull());
    const project = store().project!;
    const tree = project.trees[project.selectedTreeId!];

    const positions = Object.values(tree.blocks).map(b => `${b.position.x},${b.position.y}`);
    expect(new Set(positions).size).toBe(positions.length);
  });

  it('the example wins over a restored recent project (app.js sequences :79-88 then :53-77)', async () => {
    // app.js awaits the recent-project restore before calling loadExample(),
    // so the example always ends up as the open project. Here the two are
    // independent effects; this pins the same end state.
    seedSavedProject('Previous Session');

    boot('/?example=enemy-patrol');

    await waitFor(() => expect(store().project?.id).toBe(EXAMPLES_PROJECT_ID));
    expect(store().project!.name).toBe('Examples');
  });

  it('re-opening an example reuses the Examples project instead of duplicating it (app.js:60-66)', async () => {
    boot('/?example=enemy-patrol');
    await waitFor(() => expect(store().project?.id).toBe(EXAMPLES_PROJECT_ID));
    const firstTreeCount = Object.keys(store().project!.trees).length;
    cleanup();

    // Second visit: the Examples project is already in storage
    useProjectStore.setState({ project: null, undoStack: [], redoStack: [], clipboard: null });
    boot('/?example=enemy-patrol');

    await waitFor(() => expect(store().project?.id).toBe(EXAMPLES_PROJECT_ID));
    await waitFor(() =>
      expect(Object.keys(store().project!.trees)).toHaveLength(firstTreeCount),
    );
    expect(
      Object.keys(localStorage).filter(k => k.startsWith(PROJECT_KEY_PREFIX)),
    ).toEqual([`${PROJECT_KEY_PREFIX}${EXAMPLES_PROJECT_ID}`]);
  });

  it('loading a second example adds it alongside the first', async () => {
    boot('/?example=enemy-patrol');
    await waitFor(() => expect(store().project?.id).toBe(EXAMPLES_PROJECT_ID));
    cleanup();

    useProjectStore.setState({ project: null, undoStack: [], redoStack: [], clipboard: null });
    boot('/?example=open-the-door');

    await waitFor(() => expect(Object.keys(store().project!.trees)).toHaveLength(2));
    const titles = Object.values(store().project!.trees).map(t => t.title).sort();
    expect(titles).toEqual(
      [readExample('enemy-patrol').title, readExample('open-the-door').title].sort(),
    );
  });

  it('imports a project-shaped example file (app.js:68-70 branches on data.trees)', async () => {
    // app.js: if (data.trees) editor.import.projectAsData(data) else treeAsData(data)
    const first = readExample('enemy-patrol');
    const second = readExample('open-the-door');
    const bundle = {
      name: 'Bundled Examples',
      trees: [first, second],
      selectedTree: second.id,
      custom_nodes: [],
    };
    vi.stubGlobal('fetch', stubFetch({ bundle }));

    boot('/?example=bundle');

    await waitFor(() => expect(store().project).not.toBeNull());
    await waitFor(() => expect(Object.keys(store().project!.trees)).toHaveLength(2));

    const titles = Object.values(store().project!.trees).map(t => t.title).sort();
    expect(titles).toEqual([first.title, second.title].sort());

    // ImportManager.js:10-12 honours the file's selectedTree
    expect(store().project!.trees[store().project!.selectedTreeId!].title).toBe(second.title);
    await waitFor(() => expect(window.location.pathname).toBe('/editor'));
  });

  it('an unknown example surfaces an error without crashing', async () => {
    vi.stubGlobal('fetch', stubFetch({ nope: undefined }));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    boot('/?example=nope');

    expect(await screen.findByRole('banner')).toBeTruthy();
    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(store().project).toBeNull();
    expect(window.location.pathname).toBe('/');
  });

  it('a malformed example file surfaces an error without crashing', async () => {
    vi.stubGlobal('fetch', stubFetch({ broken: '{ not json' }));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    boot('/?example=broken');

    expect(await screen.findByRole('banner')).toBeTruthy();
    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(store().project).toBeNull();
  });

  it('ignores a malformed example parameter', async () => {
    boot('/?example=');

    expect(await screen.findByRole('banner')).toBeTruthy();
    expect(store().project).toBeNull();
    expect(window.location.pathname).toBe('/');
  });
});
