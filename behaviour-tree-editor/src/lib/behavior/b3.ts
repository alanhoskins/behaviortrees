import { v4 as uuidv4 } from 'uuid';
import { Block, Connection, Node, NodeCategory, Project, Tree } from '../../types';
import { DEFAULT_NODES } from './defaults';
import { organizeTree } from './organize';
import { deserializeProject } from './serializer';

// The behavior3 interchange format, as produced/consumed by the original
// behavior3editor (see src/editor ExportManager.js / ImportManager.js in the
// old app). This is the on-disk format for trees, projects and custom nodes —
// files must round-trip with the old editor and load in behavior3 runtimes.

export const B3_VERSION = '0.3.0';

export type B3NodeTemplate = {
  version?: string;
  scope?: 'node';
  name: string;
  category: NodeCategory;
  title?: string;
  description?: string;
  properties?: Record<string, unknown>;
};

export type B3NodeSpec = {
  id: string;
  name: string;
  title?: string;
  description?: string;
  properties?: Record<string, unknown>;
  display?: { x: number; y: number };
  children?: string[];
  child?: string;
};

export type B3Tree = {
  version?: string;
  scope?: 'tree';
  id?: string;
  title?: string;
  description?: string;
  root: string | null;
  properties?: Record<string, unknown>;
  nodes: Record<string, B3NodeSpec>;
  display?: {
    camera_x: number;
    camera_y: number;
    camera_z: number;
    x: number;
    y: number;
  };
  custom_nodes?: B3NodeTemplate[];
};

export type B3Project = {
  version?: string;
  scope?: 'project';
  selectedTree?: string | null;
  trees: B3Tree[];
  custom_nodes?: B3NodeTemplate[];
  // Extra metadata the old editor ignores but this app preserves
  id?: string;
  name?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ---------------------------------------------------------------------------
// Export: internal model -> behavior3
// ---------------------------------------------------------------------------

// Children are ordered top-to-bottom, matching the old editor's horizontal
// layout export ordering.
function childIdsOf(tree: Tree, blockId: string): string[] {
  return Object.values(tree.connections)
    .filter((c) => c.source === blockId)
    .map((c) => tree.blocks[c.target])
    .filter((b): b is Block => !!b)
    .sort((a, b) => a.position.y - b.position.y)
    .map((b) => b.id);
}

export function treeToB3(tree: Tree, project: Project | null, includeCustomNodes: boolean): B3Tree {
  const root = tree.rootId ? tree.blocks[tree.rootId] : undefined;
  const rootChildren = root ? childIdsOf(tree, root.id) : [];

  const data: B3Tree = {
    version: B3_VERSION,
    scope: 'tree',
    id: tree.id,
    title: tree.title,
    description: tree.description ?? '',
    root: rootChildren[0] ?? null,
    properties: { ...(tree.properties ?? {}) },
    nodes: {},
    display: {
      camera_x: tree.viewport.x,
      camera_y: tree.viewport.y,
      camera_z: tree.viewport.zoom,
      x: root?.position.x ?? 0,
      y: root?.position.y ?? 0,
    },
  };

  Object.values(tree.blocks).forEach((block) => {
    if (block.category === 'root') return;

    const spec: B3NodeSpec = {
      id: block.id,
      name: block.name,
      title: block.title ?? block.name,
      description: block.description ?? '',
      properties: { ...block.properties },
      display: { x: block.position.x, y: block.position.y },
    };

    const children = childIdsOf(tree, block.id);
    if (block.category === 'composite') {
      spec.children = children;
    } else if (block.category === 'decorator') {
      spec.child = children[0];
    }

    data.nodes[block.id] = spec;
  });

  if (includeCustomNodes && project) {
    data.custom_nodes = customNodesToB3(project);
  }

  return data;
}

export function customNodesToB3(project: Project): B3NodeTemplate[] {
  return Object.values(project.nodes)
    .filter((node) => !node.isDefault)
    .map((node) => ({
      version: B3_VERSION,
      scope: 'node' as const,
      name: node.name,
      category: node.category,
      title: node.title,
      description: node.description,
      properties: { ...node.properties },
    }));
}

export function projectToB3(project: Project): B3Project {
  return {
    version: B3_VERSION,
    scope: 'project',
    selectedTree: project.selectedTreeId ?? null,
    trees: Object.values(project.trees).map((tree) => treeToB3(tree, null, false)),
    custom_nodes: customNodesToB3(project),
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Import: behavior3 -> internal model
// ---------------------------------------------------------------------------

function inferCategory(spec: B3NodeSpec): NodeCategory {
  if (spec.children) return 'composite';
  if (spec.child !== undefined) return 'decorator';
  return 'action';
}

// Registers any node names used by the tree that aren't already known, so
// files whose custom_nodes list is incomplete still import.
function collectNodeTemplates(data: B3Tree, known: Record<string, Node>): Record<string, Node> {
  const nodes: Record<string, Node> = {};

  (data.custom_nodes ?? []).forEach((t) => {
    if (!known[t.name] && !nodes[t.name]) {
      nodes[t.name] = {
        name: t.name,
        category: t.category,
        title: t.title,
        description: t.description,
        properties: { ...(t.properties ?? {}) },
        isDefault: false,
      };
    }
  });

  Object.values(data.nodes ?? {}).forEach((spec) => {
    if (!known[spec.name] && !nodes[spec.name]) {
      nodes[spec.name] = {
        name: spec.name,
        category: inferCategory(spec),
        title: spec.title,
        description: '',
        properties: {},
        isDefault: false,
      };
    }
  });

  return nodes;
}

export function b3ToTree(data: B3Tree, knownNodes: Record<string, Node>): { tree: Tree; nodes: Record<string, Node> } {
  const treeId = data.id ?? uuidv4();
  const rootId = uuidv4();

  const rootBlock: Block = {
    id: rootId,
    name: 'Root',
    title: data.title ?? 'A behavior tree',
    description: data.description ?? '',
    category: 'root',
    properties: { ...(data.properties ?? {}) },
    position: { x: data.display?.x ?? 0, y: data.display?.y ?? 0 },
  };

  const tree: Tree = {
    id: treeId,
    title: data.title ?? 'A behavior tree',
    description: data.description ?? '',
    blocks: { [rootId]: rootBlock },
    connections: {},
    rootId,
    properties: { ...(data.properties ?? {}) },
    viewport: {
      x: data.display?.camera_x ?? 0,
      y: data.display?.camera_y ?? 0,
      zoom: data.display?.camera_z ?? 1,
    },
  };

  const nodes = collectNodeTemplates(data, knownNodes);
  const templateOf = (name: string): Node | undefined => knownNodes[name] ?? nodes[name];

  Object.values(data.nodes ?? {}).forEach((spec) => {
    const template = templateOf(spec.name);
    const block: Block = {
      id: spec.id,
      name: spec.name,
      title: spec.title ?? template?.title ?? spec.name,
      description: spec.description ?? '',
      category: template?.category ?? inferCategory(spec),
      properties: { ...(template?.properties ?? {}), ...(spec.properties ?? {}) },
      position: spec.display ? { x: spec.display.x, y: spec.display.y } : { x: 0, y: 0 },
    };
    tree.blocks[block.id] = block;
  });

  // Connections are inserted in the file's children order, which organize
  // honors below via byIndex
  const connect = (source: string, target: string) => {
    if (!tree.blocks[source] || !tree.blocks[target]) return;
    const connection: Connection = { id: uuidv4(), source, target };
    tree.connections[connection.id] = connection;
  };

  if (data.root && tree.blocks[data.root]) {
    connect(rootId, data.root);
  }
  Object.values(data.nodes ?? {}).forEach((spec) => {
    const children = spec.children ?? (spec.child ? [spec.child] : []);
    children.forEach((childId) => connect(spec.id, childId));
  });

  // The old editor auto-organizes when the file has no display info
  if (!data.display) {
    organizeTree(tree, 'horizontal', true);
  }

  return { tree, nodes };
}

export function b3ToProject(data: B3Project): Project {
  const project: Project = {
    id: data.id ?? uuidv4(),
    name: data.name ?? 'Imported Project',
    description: data.description ?? '',
    trees: {},
    nodes: { ...DEFAULT_NODES },
    selectedTreeId: undefined,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };

  (data.custom_nodes ?? []).forEach((t) => {
    if (!project.nodes[t.name]) {
      project.nodes[t.name] = {
        name: t.name,
        category: t.category,
        title: t.title,
        description: t.description,
        properties: { ...(t.properties ?? {}) },
        isDefault: false,
      };
    }
  });

  (data.trees ?? []).forEach((treeData) => {
    const { tree, nodes } = b3ToTree(treeData, project.nodes);
    Object.assign(project.nodes, nodes);
    project.trees[tree.id] = tree;
  });

  const treeIds = Object.keys(project.trees);
  project.selectedTreeId =
    data.selectedTree && project.trees[data.selectedTree] ? data.selectedTree : treeIds[0];

  return project;
}

export function b3ToNodes(data: B3NodeTemplate[]): Record<string, Node> {
  const nodes: Record<string, Node> = {};
  data.forEach((t) => {
    if (t.name) {
      nodes[t.name] = {
        name: t.name,
        category: t.category ?? 'action',
        title: t.title,
        description: t.description,
        properties: { ...(t.properties ?? {}) },
        isDefault: false,
      };
    }
  });
  return nodes;
}

// ---------------------------------------------------------------------------
// File import entry point: detects what a parsed JSON file contains
// ---------------------------------------------------------------------------

export type ImportedData =
  | { kind: 'project'; project: Project }
  | { kind: 'tree'; tree: B3Tree }
  | { kind: 'nodes'; nodes: Record<string, Node> };

// Pre-behavior3 saves from earlier versions of this app used a different
// schema ({trees: {id: {blocks, rootId, viewport}}}). Recognize and convert.
function isLegacyReactProject(data: unknown): boolean {
  const d = data as { trees?: unknown } | null;
  if (!d || typeof d !== 'object' || Array.isArray(d.trees)) return false;
  if (!d.trees || typeof d.trees !== 'object') return false;
  const trees = Object.values(d.trees) as Array<{ blocks?: unknown }>;
  return trees.length > 0 && !!trees[0].blocks;
}

const LEGACY_NAME_MAP: Record<string, string> = {
  root: 'Root',
  sequence: 'Sequence',
  selector: 'Priority',
  priority: 'Priority',
  inverter: 'Inverter',
  repeater: 'Repeater',
  wait: 'Wait',
  succeeder: 'Succeeder',
  failer: 'Failer',
};

function convertLegacyProject(data: unknown): Project {
  const project = deserializeProject(data as Parameters<typeof deserializeProject>[0]);
  project.nodes = { ...DEFAULT_NODES, ...project.nodes };
  Object.values(project.trees).forEach((tree) => {
    Object.values(tree.blocks).forEach((block) => {
      const mapped = LEGACY_NAME_MAP[block.name];
      if (mapped) block.name = mapped;
      if (!project.nodes[block.name]) {
        project.nodes[block.name] = {
          name: block.name,
          category: block.category,
          title: block.title,
          description: block.description,
          properties: {},
          isDefault: false,
        };
      }
    });
  });
  return project;
}

export function parseImportedJson(data: unknown): ImportedData {
  if (Array.isArray(data)) {
    return { kind: 'nodes', nodes: b3ToNodes(data as B3NodeTemplate[]) };
  }
  if (!data || typeof data !== 'object') {
    throw new Error('Not a behavior tree file');
  }
  const d = data as Record<string, unknown>;
  if (isLegacyReactProject(d)) {
    return { kind: 'project', project: convertLegacyProject(d) };
  }
  if (Array.isArray(d.trees)) {
    return { kind: 'project', project: b3ToProject(d as B3Project) };
  }
  if (d.nodes && 'root' in d) {
    return { kind: 'tree', tree: d as B3Tree };
  }
  if (d.scope === 'node' && d.name) {
    return { kind: 'nodes', nodes: b3ToNodes([d as B3NodeTemplate]) };
  }
  throw new Error('Unrecognized behavior tree file format');
}
