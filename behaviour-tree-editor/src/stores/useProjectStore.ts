import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { Block, Connection, Node, Project, Tree } from '../types';
import { DEFAULT_NODES } from '../lib/behavior/defaults';

interface ProjectState {
  // Current project data
  project: Project | null;
  // History for undo/redo
  undoStack: Project[];
  redoStack: Project[];
  
  // Actions
  createProject: (name: string, description?: string) => void;
  createTree: (title: string, description?: string) => string;
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
  createConnection: (treeId: string, sourceId: string, targetId: string) => string;
  deleteConnection: (treeId: string, connectionId: string) => void;
  
  // Project operations
  saveProject: () => void;
  loadProject: (projectData: Project) => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
}

// Helper to create a timestamp
const timestamp = () => new Date().toISOString();

// Initialize with default project
const createDefaultProject = (name: string, description?: string): Project => {
  const projectId = uuidv4();
  const treeId = uuidv4();
  
  // Create root block
  const rootId = uuidv4();
  const rootBlock: Block = {
    id: rootId,
    name: 'root',
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
    
    createProject: (name, description) => {
      const project = createDefaultProject(name, description);
      set(state => {
        state.project = project;
        state.undoStack = [];
        state.redoStack = [];
      });
    },
    
    createTree: (title, description) => {
      const treeId = uuidv4();
      
      // Create root block
      const rootId = uuidv4();
      const rootBlock: Block = {
        id: rootId,
        name: 'root',
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
          // Save current state to undo stack
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];
          
          // Update node
          state.project.nodes[name] = {
            ...state.project.nodes[name],
            ...updates
          };
          
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
      const connectionId = uuidv4();
      
      set(state => {
        if (
          state.project && 
          state.project.trees[treeId] && 
          state.project.trees[treeId].blocks[sourceId] && 
          state.project.trees[treeId].blocks[targetId]
        ) {
          // Save current state to undo stack
          state.undoStack.push(JSON.parse(JSON.stringify(state.project)));
          state.redoStack = [];
          
          // Check if target already has an incoming connection
          const hasIncomingConnection = Object.values(state.project.trees[treeId].connections)
            .some(connection => connection.target === targetId);
          
          // Only allow one incoming connection per block
          if (hasIncomingConnection) {
            return;
          }
          
          // Create new connection
          const connection: Connection = {
            id: connectionId,
            source: sourceId,
            target: targetId
          };
          
          // Add connection to tree
          state.project.trees[treeId].connections[connectionId] = connection;
          
          state.project.updatedAt = timestamp();
        }
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
    
    saveProject: () => {
      // This is a placeholder - the actual save mechanism will depend on the storage implementation
      const { project } = get();
      if (project) {
        console.log('Project saved', project);
      }
      return true; // Return a value to satisfy TypeScript
    },
    
    loadProject: (projectData) => {
      set(state => {
        state.project = projectData;
        state.undoStack = [];
        state.redoStack = [];
        return state; // Explicitly return state to satisfy TypeScript
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