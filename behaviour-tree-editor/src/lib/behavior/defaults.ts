import { Node } from '../../types';

// The default behavior3 palette, matching the original editor's registration
// (Project.js) and the behavior3js node library. Keys and names must be the
// exact behavior3 node names — they are written into exported files and read
// by behavior3 runtimes.
export const DEFAULT_NODES: Record<string, Node> = {
  Root: {
    name: 'Root',
    title: 'Root',
    category: 'root',
    description: 'The entry point of the behavior tree',
    properties: {},
    isDefault: true,
  },

  // Composites
  Sequence: {
    name: 'Sequence',
    title: 'Sequence',
    category: 'composite',
    description: 'Runs children in order; fails when one fails (AND)',
    properties: {},
    isDefault: true,
  },
  Priority: {
    name: 'Priority',
    title: 'Priority',
    category: 'composite',
    description: 'Runs children in order; succeeds when one succeeds (OR / selector)',
    properties: {},
    isDefault: true,
  },
  MemSequence: {
    name: 'MemSequence',
    title: 'MemSequence',
    category: 'composite',
    description: 'Sequence with memory: resumes from the running child',
    properties: {},
    isDefault: true,
  },
  MemPriority: {
    name: 'MemPriority',
    title: 'MemPriority',
    category: 'composite',
    description: 'Priority with memory: resumes from the running child',
    properties: {},
    isDefault: true,
  },

  // Decorators
  Repeater: {
    name: 'Repeater',
    title: 'Repeat <maxLoop>x',
    category: 'decorator',
    description: 'Repeats the child up to maxLoop times (-1 = forever)',
    properties: { maxLoop: -1 },
    isDefault: true,
  },
  RepeatUntilFailure: {
    name: 'RepeatUntilFailure',
    title: 'Repeat Until Failure',
    category: 'decorator',
    description: 'Repeats the child until it fails',
    properties: { maxLoop: -1 },
    isDefault: true,
  },
  RepeatUntilSuccess: {
    name: 'RepeatUntilSuccess',
    title: 'Repeat Until Success',
    category: 'decorator',
    description: 'Repeats the child until it succeeds',
    properties: { maxLoop: -1 },
    isDefault: true,
  },
  MaxTime: {
    name: 'MaxTime',
    title: 'Max <maxTime>ms',
    category: 'decorator',
    description: 'Fails the child if it runs longer than maxTime milliseconds',
    properties: { maxTime: 0 },
    isDefault: true,
  },
  Inverter: {
    name: 'Inverter',
    title: 'Inverter',
    category: 'decorator',
    description: 'Inverts the result of the child',
    properties: {},
    isDefault: true,
  },
  Limiter: {
    name: 'Limiter',
    title: 'Limit <maxLoop> Activations',
    category: 'decorator',
    description: 'Limits how many times the child can be executed',
    properties: { maxLoop: 1 },
    isDefault: true,
  },

  // Actions
  Failer: {
    name: 'Failer',
    title: 'Failer',
    category: 'action',
    description: 'Always returns failure',
    properties: {},
    isDefault: true,
  },
  Succeeder: {
    name: 'Succeeder',
    title: 'Succeeder',
    category: 'action',
    description: 'Always returns success',
    properties: {},
    isDefault: true,
  },
  Runner: {
    name: 'Runner',
    title: 'Runner',
    category: 'action',
    description: 'Always returns running',
    properties: {},
    isDefault: true,
  },
  Error: {
    name: 'Error',
    title: 'Error',
    category: 'action',
    description: 'Always returns an error status',
    properties: {},
    isDefault: true,
  },
  Wait: {
    name: 'Wait',
    title: 'Wait <milliseconds>ms',
    category: 'action',
    description: 'Waits for the given number of milliseconds',
    properties: { milliseconds: 0 },
    isDefault: true,
  },
};
