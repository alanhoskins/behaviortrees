import { Project, Tree, SerializedProject, SerializedTree, Block, Connection } from '../../types';

/**
 * Serialize a behavior tree to B3 format
 */
export function serializeTree(tree: Tree): SerializedTree {
  const serializedBlocks: Record<string, any> = {};
  
  // Process blocks
  Object.values(tree.blocks).forEach(block => {
    // Create base block data
    const serializedBlock = {
      id: block.id,
      name: block.name,
      title: block.title,
      description: block.description,
      properties: { ...block.properties },
      position: { 
        x: block.position.x, 
        y: block.position.y 
      },
      children: [] as string[]
    };
    
    // Add to blocks collection
    serializedBlocks[block.id] = serializedBlock;
  });
  
  // Process connections to build parent-child relationships
  Object.values(tree.connections).forEach(connection => {
    const source = serializedBlocks[connection.source];
    const target = serializedBlocks[connection.target];
    
    if (source && target) {
      if (!source.children) {
        source.children = [];
      }
      source.children.push(target.id);
    }
  });
  
  // Create the serialized tree
  const serializedTree: SerializedTree = {
    version: '1.0.0',
    scope: 'tree',
    id: tree.id,
    title: tree.title,
    description: tree.description,
    rootId: tree.rootId || '',
    blocks: serializedBlocks,
    viewport: {
      x: tree.viewport.x,
      y: tree.viewport.y,
      zoom: tree.viewport.zoom
    }
  };
  
  return serializedTree;
}

/**
 * Deserialize from B3 format to a behavior tree
 */
export function deserializeTree(serializedTree: SerializedTree): Tree {
  // Extract base tree data
  const tree: Tree = {
    id: serializedTree.id,
    title: serializedTree.title,
    description: serializedTree.description,
    rootId: serializedTree.rootId,
    blocks: {},
    connections: {},
    viewport: serializedTree.viewport
  };
  
  // Process blocks
  Object.values(serializedTree.blocks).forEach(block => {
    // Create block
    const newBlock: Block = {
      id: block.id,
      name: block.name,
      title: block.title,
      category: block.category || 'action', // Default to action if not specified
      description: block.description,
      properties: { ...block.properties },
      position: block.position
    };
    
    // Add to blocks collection
    tree.blocks[block.id] = newBlock;
  });
  
  // Process connections
  Object.values(serializedTree.blocks).forEach(block => {
    if (block.children && Array.isArray(block.children)) {
      block.children.forEach((childId: string) => {
        const connectionId = `${block.id}-${childId}`;
        
        // Create connection
        const connection: Connection = {
          id: connectionId,
          source: block.id,
          target: childId
        };
        
        // Add to connections collection
        tree.connections[connectionId] = connection;
      });
    }
  });
  
  return tree;
}

/**
 * Serialize a project to B3 format
 */
export function serializeProject(project: Project): SerializedProject {
  // Serialize trees
  const serializedTrees: Record<string, SerializedTree> = {};
  Object.values(project.trees).forEach(tree => {
    serializedTrees[tree.id] = serializeTree(tree);
  });
  
  // Filter custom nodes (non-default)
  const customNodes = Object.entries(project.nodes)
    .filter(([_, node]) => !node.isDefault)
    .reduce((acc, [key, node]) => {
      acc[key] = {
        version: '1.0.0',
        scope: 'node',
        name: node.name,
        category: node.category,
        title: node.title,
        description: node.description,
        properties: node.properties
      };
      return acc;
    }, {} as Record<string, any>);
  
  // Create serialized project
  const serializedProject: SerializedProject = {
    version: '1.0.0',
    scope: 'project',
    id: project.id,
    name: project.name,
    description: project.description,
    selectedTreeId: project.selectedTreeId,
    trees: serializedTrees,
    customNodes,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
  
  return serializedProject;
}

/**
 * Deserialize from B3 format to a project
 */
export function deserializeProject(serializedProject: SerializedProject): Project {
  // Extract base project data
  const project: Project = {
    id: serializedProject.id,
    name: serializedProject.name,
    description: serializedProject.description,
    trees: {},
    nodes: {}, // Will be populated with default + custom nodes
    selectedTreeId: serializedProject.selectedTreeId,
    createdAt: serializedProject.createdAt,
    updatedAt: serializedProject.updatedAt
  };
  
  // Deserialize trees
  Object.values(serializedProject.trees).forEach(serializedTree => {
    const tree = deserializeTree(serializedTree);
    project.trees[tree.id] = tree;
  });
  
  // Add custom nodes
  if (serializedProject.customNodes) {
    Object.entries(serializedProject.customNodes).forEach(([key, node]) => {
      project.nodes[key] = {
        name: node.name,
        category: node.category,
        title: node.title,
        description: node.description,
        properties: node.properties,
        isDefault: false
      };
    });
  }
  
  return project;
}