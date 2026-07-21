import { Tree } from '../../types';

// Port of the old editor's OrganizeManager: leaves stack along the cross
// axis at their depth, internal nodes center on their children, and the
// whole layout is offset so the root keeps its current position.

export type TreeLayout = 'horizontal' | 'vertical';

const H_SPACING = 208;
const V_SPACING = 88;
const V_COMPENSATION = 42;

export function organizeTree(tree: Tree, layout: TreeLayout = 'horizontal', byIndex = false): void {
  if (!tree.rootId || !tree.blocks[tree.rootId]) return;

  const root = tree.blocks[tree.rootId];
  const offsetX = root.position.x;
  const offsetY = root.position.y;

  const childIdsOf = (blockId: string): string[] => {
    const children = Object.values(tree.connections)
      .filter((c) => c.source === blockId)
      .map((c) => tree.blocks[c.target])
      .filter((b) => !!b);
    if (!byIndex) {
      // Match on-screen order, like the old editor's non-indexed organize
      children.sort((a, b) =>
        layout === 'horizontal' ? a.position.y - b.position.y : a.position.x - b.position.x,
      );
    }
    return children.map((b) => b.id);
  };

  let leafCount = 0;
  const visited = new Set<string>();
  const placed: string[] = [];

  const step = (blockId: string, depth: number): number => {
    if (visited.has(blockId)) return 0;
    visited.add(blockId);
    placed.push(blockId);

    const block = tree.blocks[blockId];
    const children = childIdsOf(blockId);
    let cross: number;

    if (children.length === 0) {
      leafCount += 1;
      cross = leafCount * (layout === 'horizontal' ? V_SPACING : H_SPACING);
    } else {
      let sum = 0;
      children.forEach((childId) => {
        sum += step(childId, depth + 1);
      });
      cross = sum / children.length;
    }

    if (layout === 'horizontal') {
      block.position = { x: depth * H_SPACING, y: cross };
    } else {
      block.position = { x: cross, y: depth * (V_SPACING + V_COMPENSATION) };
    }
    return cross;
  };

  step(tree.rootId, 0);

  // Keep the root where it was; shift everything else with it
  const dx = offsetX - root.position.x;
  const dy = offsetY - root.position.y;
  placed.forEach((id) => {
    const block = tree.blocks[id];
    block.position = { x: block.position.x + dx, y: block.position.y + dy };
  });
}
