import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { Block, Connection, Node, Project, Tree } from '../types';
import { DEFAULT_NODES } from '../lib/behavior/defaults';
import { organizeTree, TreeLayout } from '../lib/behavior/organize';
import { parseImportedJson, projectToB3 } from '../lib/behavior/b3';

const PROJECT_KEY_PREFIX = 'bt-project-';
const CURRENT_PROJECT_KEY = 'bt-current-project';

const storage = (): Storage | null =>
  typeof localStorage === 'undefined' ? null : localStorage;

type Clipboard = {
  blocks: Block[];
  connections: Connection[];
};

interface ProjectState {
  // Current project data
  project: Project | null;
  // History for undo/redo
  undoStack: Project[];
  redoStack: Project[];
  // Copy/cut buffer (blocks plus the connections between them)
  clipboard: Clipboard | null;

  // Actions
  createProject: (name: string, description?: string) => void;
  renameProject: (name: string, description?: string) => void;
  closeProject: () => void;
  createTree: (title: string, description?: string) => string;
  renameTree: (treeId: string, title: string, description?: string) => void;
  deleteTree: (treeId: string) => void;
  selectTree: (treeId: string) => void;
  
  // Node operations
  createNode: (node: Omit<Node, 'isDefault'>) => void;
  updateNode: (name: string, updates: Partial<Node>) => void;
  deleteNode: (name: string) => void;
  
  // Block operations
  createBlock: (treeId: string, nodeName: string, position: { x: number, y: number }) => string;
  updateBlock: (treeId: string, blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (treeId: string, blockId: string) => void;
  
  // Connection operations
  createConnection: (treeId: string, sourceId: string, targetId: string) => string | null;
  deleteConnection: (treeId: string, connectionId: string) => void;

  // Edit operations
  copyBlocks: (treeId: string, blockIds: string[]) => void;
  cutBlocks: (treeId: string, blockIds: string[]) => void;
  pasteClipboard: (treeId: string) => string[];
  duplicateBlocks: (treeId: string, blockIds: string[]) => string[];
  organize: (treeId: string, layout?: TreeLayout) => void;
  
  // Project operations
  saveProject: () => boolean;
  loadProject: (projectData: Project) => void;
  restoreLastProject: () => boolean;
  addImportedTree: (tree: Tree, nodes: Record<string, Node>) => void;
  addNodes: (nodes: Record<string, Node>) => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
}

// Helper to create a timestamp
const timestamp = () => new Date().toISOString();

const PASTE_OFFSET = 40;

// Deep-copy the given blocks (root excluded) and the connections linking them
const snapshotBlocks = (tree: Tree, blockIds: string[]): Clipboard => {
  const ids = new Set(
    blockIds.filter(id => tree.blocks[id] && tree.blocks[id].category !== 'root')
  );
  return {
    blocks: [...ids].map(id => JSON.parse(JSON.stringify(tree.blocks[id]))),
    connections: Object.values(tree.connections)
      .filter(c => ids.has(c.source) && ids.has(c.target))
      .map(c => ({ ...c })),
  };
};

// Insert clipboard contents into a tree with fresh ids, slightly offset
const cloneIntoTree = (tree: Tree, clip: Clipboard): string[] => {
  const idMap: Record<string, string> = {};
  clip.blocks.forEach(block => {
    const id = uuidv4();
    idMap[block.id] = id;
    tree.blocks[id] = {
      ...JSON.parse(JSON.stringify(block)),
      id,
      position: {
        x: block.position.x + PASTE_OFFSET,
        y: block.position.y + PASTE_OFFSET,
      },
    };
  });
  clip.connections.forEach(connection => {
    const source = idMap[connection.source];
    const target = idMap[connection.target];
    if (source && target) {
      const id = uuidv4();
      tree.connections[id] = { id, source, target };
    }
  });
  return Object.values(idMap);
};

// Initialize with default project
const createDefaultProject = (name: string, description?: string): Project => {
  const projectId = uuidv4();
  const treeId = uuidv4();
  
  // Create root block
  const rootId = uuidv4();
  const rootBlock: Block = {
    id: rootId,
    name: 'Root',
    category: 'root',
    properties: {},
    position: { x: 0, y: 0 }
  };
  
  // Create default tree
  const tree: Tree = {
    id: treeId,
    title: 'Main Tree',
    description: 'The main behavior tree',
    blocks: { [rootId]: rootBlock },
    connections: {},
    rootId,
    viewport: { x: 0, y: 0, zoom: 1 }
  };
  
  return {
    id: projectId,
    name,
    description,
    trees: { [treeId]: tree },
    nodes: { ...DEFAULT_NODES },
    selectedTreeId: treeId,
    createdAt: timestamp(),
    updatedAt: timestamp()
  };
};

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    project: null,
    undoStack: [],
    redoStack: [],
    clipboard: null,

    createProject: (name, description) => {
      const project = createDefaultProject(name, description);
      set(state => {
        state.project = project;
        state.undoStack = [];
        state.redoStack = [];
        state.clipboard = null;
      });
      get().saveProject();
    },

    renameProject: (name, description) => {
      set(state => {
        if (state.project && name.trim()) {
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];

          state.project.name = name.trim();
          if (description !== undefined) {
            state.project.description = description;
          }
          state.project.updatedAt = timestamp();
        }
      });
      get().saveProject();
    },

    closeProject: () => {
      set(state => {
        state.project = null;
        state.undoStack = [];
        state.redoStack = [];
        state.clipboard = null;
      });
      storage()?.removeItem(CURRENT_PROJECT_KEY);
    },
    
    createTree: (title, description) => {
      const treeId = uuidv4();
      
      // Create root block
      const rootId = uuidv4();
      const rootBlock: Block = {
        id: rootId,
        name: 'Root',
        category: 'root',
        properties: {},
        position: { x: 0, y: 0 }
      };
      
      // Create new tree
      const tree: Tree = {
        id: treeId,
        title,
        description,
        blocks: { [rootId]: rootBlock },
        connections: {},
        rootId,
        viewport: { x: 0, y: 0, zoom: 1 }
      };
      
      set(state => {
        if (state.project) {
          // Save current state to undo stack
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];
          
          // Add new tree
          state.project.trees[treeId] = tree;
          state.project.selectedTreeId = treeId;
          state.project.updatedAt = timestamp();
        }
      });
      
      return treeId;
    },
    
    renameTree: (treeId, title, description) => {
      set(state => {
        const tree = state.project?.trees[treeId];
        if (!state.project || !tree || !title.trim()) return;

        state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
        state.redoStack = [];

        tree.title = title.trim();
        if (description !== undefined) {
          tree.description = description;
        }
        // The root block mirrors the tree title/description in behavior3
        if (tree.rootId && tree.blocks[tree.rootId]) {
          tree.blocks[tree.rootId].title = tree.title;
          if (description !== undefined) {
            tree.blocks[tree.rootId].description = description;
          }
        }
        state.project.updatedAt = timestamp();
      });
    },

    deleteTree: (treeId) => {
      set(state => {
        if (state.project) {
          // Save current state to undo stack
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];
          
          // Delete tree
          delete state.project.trees[treeId];
          
          // If deleted tree was selected, select another tree
          if (state.project.selectedTreeId === treeId) {
            const treeIds = Object.keys(state.project.trees);
            state.project.selectedTreeId = treeIds.length > 0 ? treeIds[0] : undefined;
          }
          
          state.project.updatedAt = timestamp();
        }
      });
    },
    
    selectTree: (treeId) => {
      set(state => {
        if (state.project) {
          state.project.selectedTreeId = treeId;
        }
      });
    },
    
    createNode: (node) => {
      set(state => {
        if (state.project) {
          // Save current state to undo stack
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];
          
          // Add new node
          state.project.nodes[node.name] = {
            ...node,
            isDefault: false
          };
          
          state.project.updatedAt = timestamp();
        }
      });
    },
    
    updateNode: (name, updates) => {
      set(state => {
        if (state.project && state.project.nodes[name]) {
          const newName = updates.name;
          // A rename must not collide with an existing node
          if (newName && newName !== name && state.project.nodes[newName]) {
            return;
          }

          // Save current state to undo stack
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];

          const updated = {
            ...state.project.nodes[name],
            ...updates
          };

          if (newName && newName !== name) {
            // Re-key the template and update every block using it
            delete state.project.nodes[name];
            state.project.nodes[newName] = updated;
            Object.values(state.project.trees).forEach(tree => {
              Object.values(tree.blocks).forEach(block => {
                if (block.name === name) {
                  block.name = newName;
                }
              });
            });
          } else {
            state.project.nodes[name] = updated;
          }

          state.project.updatedAt = timestamp();
        }
      });
    },
    
    deleteNode: (name) => {
      set(state => {
        if (state.project && state.project.nodes[name]) {
          // Can't delete default nodes
          if (state.project.nodes[name].isDefault) {
            return;
          }
          
          // Save current state to undo stack
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];
          
          // Delete node
          delete state.project.nodes[name];
          
          state.project.updatedAt = timestamp();
        }
      });
    },
    
    createBlock: (treeId, nodeName, position) => {
      const blockId = uuidv4();
      
      set(state => {
        if (state.project && state.project.trees[treeId] && state.project.nodes[nodeName]) {
          // Save current state to undo stack
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];
          
          const node = state.project.nodes[nodeName];
          
          // Create new block
          const block: Block = {
            id: blockId,
            name: nodeName,
            title: node.title,
            category: node.category,
            description: node.description,
            properties: { ...node.properties },
            position
          };
          
          // Add block to tree
          state.project.trees[treeId].blocks[blockId] = block;
          
          state.project.updatedAt = timestamp();
        }
      });
      
      return blockId;
    },
    
    updateBlock: (treeId, blockId, updates) => {
      set(state => {
        try {
          if (state.project && state.project.trees[treeId] && state.project.trees[treeId].blocks[blockId]) {
            // Save current state to undo stack
            state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
            state.redoStack = [];
            
            // Update block - clone the updates to prevent reference issues
            const safeUpdates = JSON.parse(JSON.stringify(updates));
            
            // Check if position is valid to prevent NaN errors
            if (safeUpdates.position) {
              if (isNaN(safeUpdates.position.x) || isNaN(safeUpdates.position.y)) {
                console.warn('Invalid position update detected and prevented', safeUpdates.position);
                return; // Skip this update
              }
              
              // Limit position to reasonable bounds (-10000 to 10000)
              safeUpdates.position.x = Math.max(-10000, Math.min(10000, safeUpdates.position.x));
              safeUpdates.position.y = Math.max(-10000, Math.min(10000, safeUpdates.position.y));
            }
            
            // Update block
            state.project.trees[treeId].blocks[blockId] = {
              ...state.project.trees[treeId].blocks[blockId],
              ...safeUpdates
            };
            
            state.project.updatedAt = timestamp();
          }
        } catch (error) {
          console.error('Error updating block:', error);
        }
      });
    },
    
    deleteBlock: (treeId, blockId) => {
      set(state => {
        if (state.project && state.project.trees[treeId] && state.project.trees[treeId].blocks[blockId]) {
          // Can't delete root block
          if (state.project.trees[treeId].rootId === blockId) {
            return;
          }
          
          // Save current state to undo stack
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];
          
          // Find and delete connections to/from this block
          const connectionsToDelete: string[] = [];
          
          Object.entries(state.project.trees[treeId].connections).forEach(([connectionId, connection]) => {
            if (connection.source === blockId || connection.target === blockId) {
              connectionsToDelete.push(connectionId);
            }
          });
          
          connectionsToDelete.forEach(connectionId => {
            if (state.project) {
              delete state.project.trees[treeId].connections[connectionId];
            }
          });
          
          // Delete block
          delete state.project.trees[treeId].blocks[blockId];
          
          state.project.updatedAt = timestamp();
        }
      });
    },
    
    createConnection: (treeId, sourceId, targetId) => {
      let connectionId: string | null = null;

      set(state => {
        const tree = state.project?.trees[treeId];
        const source = tree?.blocks[sourceId];
        const target = tree?.blocks[targetId];
        if (!state.project || !tree || !source || !target) return;

        // behavior3 arity rules, matching the old editor's ConnectionSystem:
        // nothing connects into a root or to itself, and leaves have no children
        if (sourceId === targetId) return;
        if (target.category === 'root') return;
        if (source.category === 'action' || source.category === 'condition') return;

        // Save current state to undo stack
        state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
        state.redoStack = [];

        // A block keeps a single parent: a new connection replaces it
        Object.values(tree.connections)
          .filter(connection => connection.target === targetId)
          .forEach(connection => {
            delete tree.connections[connection.id];
          });

        // Root and decorators keep a single child: replace the previous one
        if (source.category === 'root' || source.category === 'decorator') {
          Object.values(tree.connections)
            .filter(connection => connection.source === sourceId)
            .forEach(connection => {
              delete tree.connections[connection.id];
            });
        }

        const id = uuidv4();
        const connection: Connection = {
          id,
          source: sourceId,
          target: targetId
        };

        tree.connections[id] = connection;
        connectionId = id;
        state.project.updatedAt = timestamp();
      });

      return connectionId;
    },
    
    deleteConnection: (treeId, connectionId) => {
      set(state => {
        if (state.project && state.project.trees[treeId] && state.project.trees[treeId].connections[connectionId]) {
          // Save current state to undo stack
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];

          // Delete connection
          delete state.project.trees[treeId].connections[connectionId];

          state.project.updatedAt = timestamp();
        }
      });
    },

    copyBlocks: (treeId, blockIds) => {
      set(state => {
        const tree = state.project?.trees[treeId];
        if (!tree) return;
        const clip = snapshotBlocks(tree, blockIds);
        if (clip.blocks.length > 0) {
          state.clipboard = clip;
        }
      });
    },

    cutBlocks: (treeId, blockIds) => {
      set(state => {
        const tree = state.project?.trees[treeId];
        if (!state.project || !tree) return;
        const clip = snapshotBlocks(tree, blockIds);
        if (clip.blocks.length === 0) return;

        state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
        state.redoStack = [];
        state.clipboard = clip;

        const removed = new Set(clip.blocks.map(b => b.id));
        Object.values(tree.connections)
          .filter(c => removed.has(c.source) || removed.has(c.target))
          .forEach(c => {
            delete tree.connections[c.id];
          });
        removed.forEach(id => {
          delete tree.blocks[id];
        });
        state.project.updatedAt = timestamp();
      });
    },

    pasteClipboard: (treeId) => {
      let pasted: string[] = [];
      set(state => {
        const tree = state.project?.trees[treeId];
        if (!state.project || !tree || !state.clipboard || state.clipboard.blocks.length === 0) return;

        state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
        state.redoStack = [];

        pasted = cloneIntoTree(tree, state.clipboard);
        state.project.updatedAt = timestamp();
      });
      return pasted;
    },

    duplicateBlocks: (treeId, blockIds) => {
      let created: string[] = [];
      set(state => {
        const tree = state.project?.trees[treeId];
        if (!state.project || !tree) return;
        const clip = snapshotBlocks(tree, blockIds);
        if (clip.blocks.length === 0) return;

        state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
        state.redoStack = [];

        created = cloneIntoTree(tree, clip);
        state.project.updatedAt = timestamp();
      });
      return created;
    },

    organize: (treeId, layout = 'horizontal') => {
      set(state => {
        const tree = state.project?.trees[treeId];
        if (!state.project || !tree) return;

        state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
        state.redoStack = [];

        organizeTree(tree, layout);
        state.project.updatedAt = timestamp();
      });
    },
    
    saveProject: () => {
      const { project } = get();
      const store = storage();
      if (!project || !store) return false;

      try {
        const serialized = projectToB3(project);
        store.setItem(`${PROJECT_KEY_PREFIX}${project.id}`, JSON.stringify(serialized));
        store.setItem(CURRENT_PROJECT_KEY, project.id);
        return true;
      } catch (error) {
        console.error('Error saving project', error);
        return false;
      }
    },

    loadProject: (projectData) => {
      set(state => {
        state.project = projectData;
        state.undoStack = [];
        state.redoStack = [];
        state.clipboard = null;
        return state; // Explicitly return state to satisfy TypeScript
      });
      storage()?.setItem(CURRENT_PROJECT_KEY, projectData.id);
    },

    restoreLastProject: () => {
      const store = storage();
      if (!store || get().project) return false;

      const id = store.getItem(CURRENT_PROJECT_KEY);
      if (!id) return false;

      const raw = store.getItem(`${PROJECT_KEY_PREFIX}${id}`);
      if (!raw) return false;

      try {
        const imported = parseImportedJson(JSON.parse(raw));
        if (imported.kind !== 'project') return false;
        get().loadProject(imported.project);
        return true;
      } catch (error) {
        console.error('Error restoring last project', error);
        return false;
      }
    },

    addImportedTree: (tree, nodes) => {
      set(state => {
        if (state.project) {
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];

          Object.values(nodes).forEach(node => {
            if (!state.project!.nodes[node.name]) {
              state.project!.nodes[node.name] = node;
            }
          });

          // Re-importing a tree with the same id replaces it
          state.project.trees[tree.id] = tree;
          state.project.selectedTreeId = tree.id;
          state.project.updatedAt = timestamp();
        }
      });
    },

    addNodes: (nodes) => {
      set(state => {
        if (state.project) {
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];

          Object.values(nodes).forEach(node => {
            if (!state.project!.nodes[node.name]) {
              state.project!.nodes[node.name] = node;
            }
          });

          state.project.updatedAt = timestamp();
        }
      });
    },
    
    undo: () => {
      set(state => {
        if (state.undoStack.length > 0) {
          // Save current state to redo stack
          if (state.project) {
            state.redoStack.push(JSON.parse(JSON.stringify(state.project)));
          }
          
          // Restore previous state
          state.project = state.undoStack.pop() || null;
        }
      });
    },
    
    redo: () => {
      set(state => {
        if (state.redoStack.length > 0) {
          // Save current state to undo stack
          if (state.project) {
            state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          }
          
          // Restore next state
          state.project = state.redoStack.pop() || null;
        }
      });
    }
  }))
);