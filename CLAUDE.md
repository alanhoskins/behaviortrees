# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- `npm install` & `bower install` - Install dependencies
- `gulp serve` - Development mode with live reload (http://127.0.0.1:8000)
- `gulp dev` - Build for development
- `gulp build` - Build for production
- `gulp dist` - Package for desktop distribution

## Linting
- JSHint is used for linting (integrated in build tasks)
- No explicit lint command, but linting happens during build

## Code Style
- Follow AngularJS style guide (camelCase for variables and functions)
- Dependency injection using array syntax for minification safety
- Use descriptive function and variable names
- Follow existing patterns in the codebase for new components
- Four space indentation, maintain consistent whitespace

## Project Structure
- Angular modules in src/app
- Editor core in src/editor
- LESS styling in src/assets/less
- Follow existing file organization for new components

## Error Handling
- Use editor.error.js for editor-related errors
- Follow existing error handling patterns in similar components