# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modernized version of the Behavior3 Editor, reimplemented using modern web technologies:

- Vite + React 19
- TypeScript
- Tailwind CSS v4
- Zustand for state management
- ReactFlow for canvas editor

## Build Commands

- `pnpm install` - Install dependencies
- `pnpm run dev` - Run development server
- `pnpm run build` - Build for production
- `pnpm run lint` - Run ESLint on codebase
- `pnpm run preview` - Preview production build locally

## Code Style

- Use TypeScript with strict typing
- Follow React hooks best practices
- Use Zustand for state management
- Organize imports alphabetically
- Prefer named exports over default exports
- Use functional components with hooks
- Use Tailwind CSS for styling
- Maintain proper error handling with try/catch blocks

## Project Structure

```
src/
├── components/      # React components
│   ├── editor/      # Tree editor components
│   │   ├── edges/   # Custom edge components
│   │   └── nodes/   # Custom node components
│   ├── layouts/     # Layout components
│   ├── panels/      # Panel components
│   └── ui/          # ShadCN UI components
├── lib/             # Core functionality
│   ├── behavior/    # Behavior tree logic
│   └── utils.ts     # Utility functions
├── pages/           # Page components
│   ├── editor/      # Editor page
│   ├── home/        # Home page
│   ├── projects/    # Projects page
│   └── settings/    # Settings page
├── stores/          # Zustand state stores
└── types/           # TypeScript type definitions
```

## Architecture Details

- Behavior trees are rendered using ReactFlow
- Component-based architecture with reusable UI components
- Data is persisted using localStorage
- Custom node types for different behavior tree node categories
- Zustand handles state with immer middleware for immutable updates
- ShadCN UI components for consistent design

## Important Implementation Notes

### Node Position Handling

To prevent nodes from jumping when adding/editing nodes:

1. **Position Caching System**:
   - We use `prevNodePositionsRef` to cache node positions between renders
   - This cache takes precedence over positions from the store
   - In `syncTreeToFlow`, we prioritize cached positions over store positions

2. **Optimized State Updates**:
   - ReactFlow state is updated immediately for smooth UI
   - Store updates are batched with `requestAnimationFrame`
   - Position updates are always rounded to a grid (15px intervals)

3. **Root Node Special Handling**:
   - The root node has special rendering (blue styling)
   - Root node position is always preserved during tree sync operations
   - Root node is protected from deletion

4. **Smart Diffing**:
   - The sync function uses smart diffing to avoid unnecessary re-renders
   - It only updates nodes when actual data (excluding position) changes
   - This prevents cascading updates that could cause position jumps

When modifying node positions or editing node operations, make sure to:
- Update the position cache when directly modifying node positions
- Use rounded position values (Math.round(position.x / 15) * 15)
- Apply UI state changes before store updates for responsive feedback
- Use requestAnimationFrame for batched updates
- Ensure position values are properly passed to both node.position and node.data.position
