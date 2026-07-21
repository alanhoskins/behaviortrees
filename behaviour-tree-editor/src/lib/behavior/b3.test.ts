import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  B3Project,
  B3Tree,
  b3ToProject,
  b3ToTree,
  parseImportedJson,
  projectToB3,
  treeToB3,
} from './b3';
import { DEFAULT_NODES } from './defaults';

// The real example files shipped by the old editor at /examples/*.json —
// the parity fixtures. Any behavior3 file the old editor wrote must load.
const EXAMPLES_DIR = join(__dirname, '../../../../src/examples');
const load = (name: string): B3Tree =>
  JSON.parse(readFileSync(join(EXAMPLES_DIR, name), 'utf8'));

const EXAMPLES = ['enemy-patrol.json', 'open-the-door.json', 'robot-pick-and-place.json'];

// Everything except layout/display information must survive a round trip
function semantics(data: B3Tree) {
  return {
    title: data.title,
    description: data.description,
    root: data.root,
    properties: data.properties ?? {},
    nodes: Object.fromEntries(
      Object.entries(data.nodes).map(([id, spec]) => [
        id,
        {
          id: spec.id,
          name: spec.name,
          title: spec.title,
          properties: spec.properties ?? {},
          children: spec.children ?? (spec.child ? [spec.child] : []),
        },
      ]),
    ),
  };
}

describe('b3ToTree', () => {
  EXAMPLES.forEach((file) => {
    it(`imports ${file}`, () => {
      const data = load(file);
      const { tree, nodes } = b3ToTree(data, DEFAULT_NODES);

      // every spec node plus the synthesized root block
      expect(Object.keys(tree.blocks)).toHaveLength(Object.keys(data.nodes).length + 1);
      expect(tree.rootId).toBeTruthy();
      expect(tree.title).toBe(data.title);

      // root connects to the tree's entry node
      const rootConnection = Object.values(tree.connections).find(
        (c) => c.source === tree.rootId,
      );
      expect(rootConnection?.target).toBe(data.root);

      // custom nodes registered with categories from the file
      data.custom_nodes!.forEach((t) => {
        expect(nodes[t.name]?.category).toBe(t.category);
      });

      // auto-layout ran (no top-level display in fixtures): positions spread out
      const positions = new Set(
        Object.values(tree.blocks).map((b) => `${b.position.x},${b.position.y}`),
      );
      expect(positions.size).toBe(Object.keys(tree.blocks).length);
    });
  });

  it('assigns decorator/composite categories so re-export uses child vs children', () => {
    const data = load('robot-pick-and-place.json');
    const { tree } = b3ToTree(data, DEFAULT_NODES);
    const retry = tree.blocks['n6'];
    expect(retry.category).toBe('decorator');
    const out = treeToB3(tree, null, false);
    expect(out.nodes['n6'].child).toBe('n6a');
    expect(out.nodes['n6'].children).toBeUndefined();
    expect(out.nodes['n1'].children).toEqual(['n2', 'n7', 'n8']);
  });
});

describe('round trip', () => {
  EXAMPLES.forEach((file) => {
    it(`${file}: import -> export preserves semantics`, () => {
      const original = load(file);
      const { tree } = b3ToTree(original, DEFAULT_NODES);
      const exported = treeToB3(tree, null, false);
      expect(semantics(exported)).toEqual(semantics(original));
    });

    it(`${file}: export -> import -> export is stable`, () => {
      const { tree } = b3ToTree(load(file), DEFAULT_NODES);
      const first = treeToB3(tree, null, false);
      const { tree: reimported } = b3ToTree(first, DEFAULT_NODES);
      const second = treeToB3(reimported, null, false);
      // ids of synthesized root blocks differ; compare full b3 payloads,
      // which exclude the root block by design
      expect(second).toEqual(first);
    });
  });

  it('projects round trip through the b3 project format', () => {
    const trees = EXAMPLES.map((f) => load(f));
    const project = b3ToProject({
      trees,
      custom_nodes: trees.flatMap((t) => t.custom_nodes ?? []),
      name: 'Fixture Project',
    });

    const exported = projectToB3(project);
    expect(exported.scope).toBe('project');
    expect(Array.isArray(exported.trees)).toBe(true);
    expect(exported.trees).toHaveLength(3);
    expect(exported.selectedTree).toBe(project.selectedTreeId);

    const reimported = b3ToProject(exported);
    const again = projectToB3(reimported);
    expect(again.trees.map(semantics)).toEqual(exported.trees.map(semantics));
    expect(again.custom_nodes).toEqual(exported.custom_nodes);
  });
});

describe('old-editor format guarantees', () => {
  it('emits behavior3 shape, not the legacy React schema', () => {
    const { tree } = b3ToTree(load('enemy-patrol.json'), DEFAULT_NODES);
    const out = treeToB3(tree, null, false) as Record<string, unknown>;

    expect(out.nodes).toBeDefined();
    expect(out.blocks).toBeUndefined();
    expect(out.rootId).toBeUndefined();
    expect(out.viewport).toBeUndefined();
    expect(out.display).toMatchObject({ camera_x: 0, camera_y: 0, camera_z: 1 });

    const specs = Object.values(out.nodes as Record<string, any>);
    specs.forEach((spec) => {
      expect(spec.display).toHaveProperty('x');
      expect(spec.display).toHaveProperty('y');
      expect(spec.position).toBeUndefined();
    });

    // root block excluded, referenced via `root`
    expect(out.root).toBe('n1');
    expect((out.nodes as Record<string, unknown>)[tree.rootId!]).toBeUndefined();
  });
});

describe('parseImportedJson', () => {
  it('detects tree, project and node files', () => {
    const tree = load('enemy-patrol.json');
    expect(parseImportedJson(tree).kind).toBe('tree');

    const project: B3Project = { trees: [tree], custom_nodes: tree.custom_nodes };
    expect(parseImportedJson(project).kind).toBe('project');

    expect(parseImportedJson(tree.custom_nodes!).kind).toBe('nodes');
  });

  it('converts legacy React-schema projects', () => {
    const legacy = {
      version: '1.0.0',
      scope: 'project',
      id: 'p1',
      name: 'Legacy',
      trees: {
        t1: {
          id: 't1',
          title: 'Main Tree',
          rootId: 'r1',
          blocks: {
            r1: { id: 'r1', name: 'root', category: 'root', properties: {}, position: { x: 0, y: 0 } },
            b1: { id: 'b1', name: 'sequence', category: 'composite', properties: {}, position: { x: 200, y: 0 }, children: ['b2'] },
            b2: { id: 'b2', name: 'wait', category: 'action', properties: {}, position: { x: 400, y: 0 } },
          },
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      },
      customNodes: {},
      createdAt: '2025-01-01', updatedAt: '2025-01-01',
    };

    const imported = parseImportedJson(legacy);
    expect(imported.kind).toBe('project');
    if (imported.kind === 'project') {
      const tree = Object.values(imported.project.trees)[0];
      const names = Object.values(tree.blocks).map((b) => b.name).sort();
      expect(names).toEqual(['Root', 'Sequence', 'Wait']);
    }
  });
});
