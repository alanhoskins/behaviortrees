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
│   ├── layouts/     # Layout components
│   └── panels/      # Panel components
├── lib/             # Core functionality
│   ├── behavior/    # Behavior tree logic
│   └── storage/     # Storage implementations
├── stores/          # Zustand state stores
└── types/           # TypeScript type definitions
```

## Architecture Details

- Behavior trees are rendered using ReactFlow
- Component-based architecture with reusable UI elements
- Data is persisted using localStorage
- Custom node types for different behavior tree node categories
- Zustand handles state with immer middleware for immutable updates
