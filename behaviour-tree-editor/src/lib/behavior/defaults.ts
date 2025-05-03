import { Node, NodeCategory } from '../../types';

// Default nodes for behavior trees
export const DEFAULT_NODES: Record<string, Node> = {
  // Composite nodes
  sequence: {
    name: 'Sequence', // This is display name
    category: 'composite' as NodeCategory,
    description: 'Executes children in sequence until one fails',
    properties: {},
    isDefault: true,
  },
  selector: {
    name: 'Selector',
    category: 'composite' as NodeCategory,
    description: 'Executes children in sequence until one succeeds',
    properties: {},
    isDefault: true,
  },
  priority: {
    name: 'Priority',
    category: 'composite' as NodeCategory,
    description: 'Executes children in priority order',
    properties: {},
    isDefault: true,
  },
  
  // Decorator nodes
  inverter: {
    name: 'Inverter',
    category: 'decorator' as NodeCategory,
    description: 'Inverts the result of the child',
    properties: {},
    isDefault: true,
  },
  repeater: {
    name: 'Repeater',
    category: 'decorator' as NodeCategory,
    description: 'Repeats the child a specified number of times',
    properties: {
      maxLoop: 1,
    },
    isDefault: true,
  },
  
  // Action nodes
  wait: {
    name: 'Wait',
    category: 'action' as NodeCategory,
    description: 'Waits for a specified time',
    properties: {
      milliseconds: 1000,
    },
    isDefault: true,
  },
  succeeder: {
    name: 'Succeeder',
    category: 'action' as NodeCategory,
    description: 'Always returns success',
    properties: {},
    isDefault: true,
  },
  failer: {
    name: 'Failer',
    category: 'action' as NodeCategory,
    description: 'Always returns failure',
    properties: {},
    isDefault: true,
  },
  
  // Condition nodes
  condition: {
    name: 'Condition',
    category: 'condition' as NodeCategory,
    description: 'Base condition node',
    properties: {},
    isDefault: true,
  },
  
  // Root node
  root: {
    name: 'Root',
    category: 'root' as NodeCategory,
    description: 'Root node for the behavior tree',
    properties: {},
    isDefault: true,
  },
};