import { beforeEach, describe, expect, it } from 'vitest';
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
