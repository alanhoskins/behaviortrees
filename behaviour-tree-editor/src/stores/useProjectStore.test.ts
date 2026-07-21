import { beforeEach, describe, expect, it } from 'vitest';

// Minimal localStorage stub — vitest runs in node, and the store's
// persistence actions consult localStorage lazily
const memory = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, String(v)),
  removeItem: (k: string) => void memory.delete(k),
  clear: () => memory.clear(),
  key: (i: number) => [...memory.keys()][i] ?? null,
  get length() {
    return memory.size;
  },
} as Storage;

import { useProjectStore } from './useProjectStore';

// The store is a singleton; each test starts from a fresh project
const store = () => useProjectStore.getState();

function treeId(): string {
  return store().project!.selectedTreeId!;
}

function rootId(): string {
  return store().project!.trees[treeId()].rootId!;
}

function connections() {
  return Object.values(store().project!.trees[treeId()].connections);
}

function addBlock(nodeName: string): string {
  return store().createBlock(treeId(), nodeName, { x: 0, y: 0 });
}

beforeEach(() => {
  memory.clear();
  store().createProject('Connection Rules');
});

describe('createConnection arity rules', () => {
  it('composites accept multiple children', () => {
    const seq = addBlock('Sequence');
    const a = addBlock('Wait');
    const b = addBlock('Failer');

    expect(store().createConnection(treeId(), seq, a)).toBeTruthy();
    expect(store().createConnection(treeId(), seq, b)).toBeTruthy();
    expect(connections().filter((c) => c.source === seq)).toHaveLength(2);
  });

  it('decorators keep exactly one child: a new connection replaces the old', () => {
    const inverter = addBlock('Inverter');
    const a = addBlock('Wait');
    const b = addBlock('Failer');

    store().createConnection(treeId(), inverter, a);
    store().createConnection(treeId(), inverter, b);

    const out = connections().filter((c) => c.source === inverter);
    expect(out).toHaveLength(1);
    expect(out[0].target).toBe(b);
  });

  it('root keeps exactly one child: a new connection replaces the old', () => {
    const a = addBlock('Sequence');
    const b = addBlock('Priority');

    store().createConnection(treeId(), rootId(), a);
    store().createConnection(treeId(), rootId(), b);

    const out = connections().filter((c) => c.source === rootId());
    expect(out).toHaveLength(1);
    expect(out[0].target).toBe(b);
  });

  it('a block keeps a single parent: connecting re-parents it', () => {
    const seq = addBlock('Sequence');
    const pri = addBlock('Priority');
    const child = addBlock('Wait');

    store().createConnection(treeId(), seq, child);
    store().createConnection(treeId(), pri, child);

    const incoming = connections().filter((c) => c.target === child);
    expect(incoming).toHaveLength(1);
    expect(incoming[0].source).toBe(pri);
  });

  it('rejects connections into a root block', () => {
    const seq = addBlock('Sequence');
    expect(store().createConnection(treeId(), seq, rootId())).toBeNull();
    expect(connections()).toHaveLength(0);
  });

  it('rejects actions and conditions as parents', () => {
    const wait = addBlock('Wait');
    const target = addBlock('Failer');
    expect(store().createConnection(treeId(), wait, target)).toBeNull();
    expect(connections()).toHaveLength(0);
  });

  it('rejects self-connections', () => {
    const seq = addBlock('Sequence');
    expect(store().createConnection(treeId(), seq, seq)).toBeNull();
    expect(connections()).toHaveLength(0);
  });

  it('a rejected connection does not pollute the undo stack', () => {
    const seq = addBlock('Sequence');
    const before = store().undoStack.length;
    store().createConnection(treeId(), seq, rootId());
    expect(store().undoStack.length).toBe(before);
  });
});

describe('copy/cut/paste/duplicate', () => {
  function makeSubtree() {
    const seq = addBlock('Sequence');
    const wait = addBlock('Wait');
    store().createConnection(treeId(), seq, wait);
    return { seq, wait };
  }

  it('copy + paste clones blocks and their internal connections with new ids', () => {
    const { seq, wait } = makeSubtree();
    store().copyBlocks(treeId(), [seq, wait]);
    const pasted = store().pasteClipboard(treeId());

    expect(pasted).toHaveLength(2);
    expect(pasted).not.toContain(seq);
    const tree = store().project!.trees[treeId()];
    expect(Object.keys(tree.blocks)).toHaveLength(5); // root + 2 original + 2 pasted

    const pastedConn = Object.values(tree.connections).filter(
      (c) => pasted.includes(c.source) && pasted.includes(c.target),
    );
    expect(pastedConn).toHaveLength(1);
  });

  it('paste offsets positions', () => {
    const { seq } = makeSubtree();
    store().copyBlocks(treeId(), [seq]);
    const [pasted] = store().pasteClipboard(treeId());
    const tree = store().project!.trees[treeId()];
    expect(tree.blocks[pasted].position.x).toBe(tree.blocks[seq].position.x + 40);
  });

  it('root blocks are never copied', () => {
    store().copyBlocks(treeId(), [rootId()]);
    expect(store().clipboard).toBeNull();
    expect(store().pasteClipboard(treeId())).toHaveLength(0);
  });

  it('cut removes originals and their connections but keeps them pasteable', () => {
    const { seq, wait } = makeSubtree();
    store().cutBlocks(treeId(), [seq, wait]);

    let tree = store().project!.trees[treeId()];
    expect(Object.keys(tree.blocks)).toHaveLength(1); // root only
    expect(Object.keys(tree.connections)).toHaveLength(0);

    const pasted = store().pasteClipboard(treeId());
    tree = store().project!.trees[treeId()];
    expect(pasted).toHaveLength(2);
    expect(Object.keys(tree.blocks)).toHaveLength(3);
  });

  it('duplicate clones in place without touching the clipboard', () => {
    const { seq } = makeSubtree();
    store().copyBlocks(treeId(), [seq]);
    const clipBefore = store().clipboard;

    const created = store().duplicateBlocks(treeId(), [seq]);
    expect(created).toHaveLength(1);
    expect(store().clipboard).toBe(clipBefore);
  });

  it('cut then undo restores the original blocks', () => {
    const { seq, wait } = makeSubtree();
    store().cutBlocks(treeId(), [seq, wait]);
    store().undo();
    const tree = store().project!.trees[treeId()];
    expect(Object.keys(tree.blocks)).toHaveLength(3);
  });
});

describe('organize', () => {
  it('lays out blocks and centers parents on children', () => {
    const seq = addBlock('Sequence');
    const a = addBlock('Wait');
    const b = addBlock('Failer');
    store().createConnection(treeId(), rootId(), seq);
    store().createConnection(treeId(), seq, a);
    store().createConnection(treeId(), seq, b);

    store().organize(treeId(), 'horizontal');
    const tree = store().project!.trees[treeId()];

    // root keeps its position; depth increases along x
    expect(tree.blocks[rootId()].position).toEqual({ x: 0, y: 0 });
    expect(tree.blocks[seq].position.x).toBeGreaterThan(0);
    expect(tree.blocks[a].position.x).toBeGreaterThan(tree.blocks[seq].position.x);
    // leaves spread on y; parent centered between them
    expect(tree.blocks[a].position.y).not.toBe(tree.blocks[b].position.y);
    expect(tree.blocks[seq].position.y).toBe(
      (tree.blocks[a].position.y + tree.blocks[b].position.y) / 2,
    );
  });

  it('vertical layout puts depth on the y axis', () => {
    const seq = addBlock('Sequence');
    const a = addBlock('Wait');
    store().createConnection(treeId(), rootId(), seq);
    store().createConnection(treeId(), seq, a);

    store().organize(treeId(), 'vertical');
    const tree = store().project!.trees[treeId()];
    expect(tree.blocks[seq].position.y).toBeGreaterThan(tree.blocks[rootId()].position.y);
    expect(tree.blocks[a].position.y).toBeGreaterThan(tree.blocks[seq].position.y);
  });
});

describe('project lifecycle persistence', () => {
  it('createProject and saveProject persist behavior3 JSON and the current pointer', () => {
    const id = store().project!.id;
    expect(memory.get('bt-current-project')).toBe(id);

    const raw = memory.get(`bt-project-${id}`);
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw!);
    expect(data.scope).toBe('project');
    expect(Array.isArray(data.trees)).toBe(true);
  });

  it('saveProject reflects later mutations', () => {
    const id = store().project!.id;
    addBlock('Sequence');
    expect(store().saveProject()).toBe(true);

    const data = JSON.parse(memory.get(`bt-project-${id}`)!);
    expect(Object.keys(data.trees[0].nodes)).toHaveLength(1);
  });

  it('renameProject updates, persists, and is undoable', () => {
    const id = store().project!.id;
    store().renameProject('Renamed Project');
    expect(store().project!.name).toBe('Renamed Project');
    expect(JSON.parse(memory.get(`bt-project-${id}`)!).name).toBe('Renamed Project');

    store().undo();
    expect(store().project!.name).toBe('Connection Rules');
  });

  it('renameTree updates the tree and its root block', () => {
    store().renameTree(treeId(), 'Main Brain');
    const tree = store().project!.trees[treeId()];
    expect(tree.title).toBe('Main Brain');
    expect(tree.blocks[rootId()].title).toBe('Main Brain');
  });

  it('closeProject clears state and the current pointer', () => {
    store().closeProject();
    expect(store().project).toBeNull();
    expect(memory.get('bt-current-project')).toBeUndefined();
  });

  it('restoreLastProject reloads the saved project after a "reload"', () => {
    const id = store().project!.id;
    const block = addBlock('Wait');
    store().saveProject();

    // Simulate a page reload: state gone, localStorage intact
    useProjectStore.setState({ project: null, undoStack: [], redoStack: [], clipboard: null });

    expect(store().restoreLastProject()).toBe(true);
    expect(store().project!.id).toBe(id);
    expect(store().project!.trees[treeId()].blocks[block]).toBeDefined();
    expect(store().project!.trees[treeId()].blocks[block].name).toBe('Wait');
  });

  it('restoreLastProject returns false with no pointer', () => {
    store().closeProject();
    expect(store().restoreLastProject()).toBe(false);
  });
});

describe('updateNode rename', () => {
  it('re-keys the template and updates blocks in all trees', () => {
    store().createNode({ name: 'OldName', category: 'action', properties: {} });
    const block = addBlock('OldName');

    store().updateNode('OldName', { name: 'NewName', title: 'Renamed' });

    expect(store().project!.nodes.OldName).toBeUndefined();
    expect(store().project!.nodes.NewName.title).toBe('Renamed');
    expect(store().project!.trees[treeId()].blocks[block].name).toBe('NewName');
  });

  it('refuses renames that collide with an existing node', () => {
    store().createNode({ name: 'A', category: 'action', properties: {} });
    store().updateNode('A', { name: 'Wait' });
    expect(store().project!.nodes.A).toBeDefined();
    expect(store().project!.nodes.Wait.isDefault).toBe(true);
  });
});
