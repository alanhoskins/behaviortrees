// Node category types
export type NodeCategory = 'composite' | 'decorator' | 'action' | 'condition' | 'root';

// Base node definition (template)
export interface Node {
  name: string;
  title?: string;
  category: NodeCategory;
  description?: string;
  properties: Record<string, any>;
  isDefault?: boolean;
}

// Instance of a node on the canvas
export interface Block {
  id: string;
  name: string;
  title?: string;
  category: NodeCategory;
  description?: string;
  properties: Record<string, any>;
  position: {
    x: number;
    y: number;
  };
}

// Connection between blocks
export interface Connection {
  id: string;
  source: string; // Block ID
  target: string; // Block ID
}

// Tree structure
export interface Tree {
  id: string;
  title: string;
  description?: string;
  blocks: Record<string, Block>;
  connections: Record<string, Connection>;
  rootId?: string;
  properties?: Record<string, any>;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Project structure
export interface Project {
  id: string;
  name: string;
  description?: string;
  trees: Record<string, Tree>;
  nodes: Record<string, Node>;
  selectedTreeId?: string;
  createdAt: string;
  updatedAt: string;
}

// Serialization types
export interface SerializedNode {
  version: string;
  scope: 'node';
  name: string;
  category: NodeCategory;
  title?: string;
  description?: string;
  properties: Record<string, any>;
}

export interface SerializedBlock {
  id: string;
  name: string;
  title?: string;
  category?: NodeCategory;
  description?: string;
  properties: Record<string, any>;
  position: {x: number, y: number};
  children?: string[];
  child?: string;
}

export interface SerializedTree {
  version: string;
  scope: 'tree';
  id: string;
  title: string;
  description?: string;
  rootId: string;
  properties?: Record<string, any>;
  blocks: Record<string, SerializedBlock>;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  customNodes?: SerializedNode[];
}

export interface SerializedProject {
  version: string;
  scope: 'project';
  id: string;
  name: string;
  description?: string;
  selectedTreeId?: string;
  trees: Record<string, SerializedTree>;
  customNodes: Record<string, SerializedNode>;
  createdAt: string;
  updatedAt: string;
}