import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { B3Project, B3Tree, b3ToProject, b3ToTree, projectToB3, treeToB3 } from './b3';
import { DEFAULT_NODES } from './defaults';
import { Project } from '../../types';

// Fixtures captured from the REAL old editor (deploy build driven headlessly:
// load /?example=enemy-patrol, then editor.export.treeToData()/projectToData()).
// These are the ground truth for "a file the old editor wrote".
const FIXTURES = join(__dirname, '__fixtures__');
const oldTree: B3Tree = JSON.parse(
  readFileSync(join(FIXTURES, 'old-editor-tree-export.json'), 'utf8'),
);
const oldProject: B3Project = JSON.parse(
  readFileSync(join(FIXTURES, 'old-editor-project-export.json'), 'utf8'),
);

describe('old-editor export fixtures', () => {
  it('tree import preserves every node position exactly (no auto-layout)', () => {
    const { tree } = b3ToTree(oldTree, DEFAULT_NODES);

    Object.values(oldTree.nodes).forEach((spec) => {
      const block = tree.blocks[spec.id];
      expect(block, `block ${spec.id}`).toBeDefined();
      expect(block.position).toEqual({ x: spec.display!.x, y: spec.display!.y });
    });

    expect(tree.viewport).toEqual({
      x: oldTree.display!.camera_x,
      y: oldTree.display!.camera_y,
      zoom: oldTree.display!.camera_z,
    });
  });

  it('tree re-export reproduces the old editor payload field-for-field', () => {
    const { tree, nodes } = b3ToTree(oldTree, DEFAULT_NODES);
    const project = {
      nodes: { ...DEFAULT_NODES, ...nodes },
    } as unknown as Project;

    const out = treeToB3(tree, project, true);

    expect(out.title).toBe(oldTree.title);
    expect(out.description).toBe(oldTree.description);
    expect(out.root).toBe(oldTree.root);
    expect(out.properties).toEqual(oldTree.properties);
    expect(out.display).toEqual(oldTree.display);
    expect(out.nodes).toEqual(oldTree.nodes);

    const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
    expect([...out.custom_nodes!].sort(byName)).toEqual([...oldTree.custom_nodes!].sort(byName));
  });

  it('project import/re-export preserves trees, custom nodes and selection', () => {
    const project = b3ToProject(oldProject);
    expect(Object.keys(project.trees)).toHaveLength(oldProject.trees.length);
    expect(project.selectedTreeId).toBe(oldProject.selectedTree);

    const out = projectToB3(project);
    expect(out.selectedTree).toBe(oldProject.selectedTree);

    const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
    expect([...out.custom_nodes!].sort(byName)).toEqual(
      [...oldProject.custom_nodes!].sort(byName),
    );

    out.trees.forEach((exported, i) => {
      const original = oldProject.trees[i];
      expect(exported.id).toBe(original.id);
      expect(exported.title).toBe(original.title);
      expect(exported.root).toBe(original.root);
      expect(exported.nodes).toEqual(original.nodes);
      expect(exported.display).toEqual(original.display);
    });
  });
});

describe('palette parity with the old editor', () => {
  // The exact registration list from the old editor's Project.js
  const OLD_PALETTE: Record<string, string> = {
    Root: 'root',
    Sequence: 'composite',
    Priority: 'composite',
    MemSequence: 'composite',
    MemPriority: 'composite',
    Repeater: 'decorator',
    RepeatUntilFailure: 'decorator',
    RepeatUntilSuccess: 'decorator',
    MaxTime: 'decorator',
    Inverter: 'decorator',
    Limiter: 'decorator',
    Failer: 'action',
    Succeeder: 'action',
    Runner: 'action',
    Error: 'action',
    Wait: 'action',
  };

  it('registers exactly the 16 behavior3 default nodes', () => {
    expect(Object.keys(DEFAULT_NODES).sort()).toEqual(Object.keys(OLD_PALETTE).sort());
  });

  it('every default node has the old editor category and name === key', () => {
    Object.entries(OLD_PALETTE).forEach(([name, category]) => {
      expect(DEFAULT_NODES[name].name, name).toBe(name);
      expect(DEFAULT_NODES[name].category, name).toBe(category);
      expect(DEFAULT_NODES[name].isDefault, name).toBe(true);
    });
  });

  it('parameterized defaults match behavior3js', () => {
    expect(DEFAULT_NODES.Repeater.properties).toEqual({ maxLoop: -1 });
    expect(DEFAULT_NODES.RepeatUntilFailure.properties).toEqual({ maxLoop: -1 });
    expect(DEFAULT_NODES.RepeatUntilSuccess.properties).toEqual({ maxLoop: -1 });
    expect(DEFAULT_NODES.MaxTime.properties).toEqual({ maxTime: 0 });
    expect(DEFAULT_NODES.Limiter.properties).toEqual({ maxLoop: 1 });
    expect(DEFAULT_NODES.Wait.properties).toEqual({ milliseconds: 0 });
  });
});
