import React, { ReactNode, useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Network,
  Redo2,
  Undo2,
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { b3ToTree, parseImportedJson } from '../../lib/behavior/b3';
import { toast } from 'sonner';
import ExportModal, { ExportType } from '../modals/export-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { PanelId, usePanelLayout } from '../../lib/panel-layout';
import ResizeHandle from './resize-handle';

interface EditorLayoutProps {
  canvas: ReactNode;
  treesPanel: ReactNode;
  nodesPanel: ReactNode;
  propertiesPanel: ReactNode;
}

const EditorLayout: React.FC<EditorLayoutProps> = ({
  canvas,
  treesPanel,
  nodesPanel,
  propertiesPanel,
}) => {
  const [layout, updateLayout] = usePanelLayout();
  const [exportOpen, setExportOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('project');
  const project = useProjectStore(state => state.project);
  const saveProjectStore = useProjectStore(state => state.saveProject);
  const loadProject = useProjectStore(state => state.loadProject);
  const addImportedTree = useProjectStore(state => state.addImportedTree);
  const addNodes = useProjectStore(state => state.addNodes);
  const undo = useProjectStore(state => state.undo);
  const redo = useProjectStore(state => state.redo);
  const organize = useProjectStore(state => state.organize);
  const canUndo = useProjectStore(state => state.undoStack.length > 0);
  const canRedo = useProjectStore(state => state.redoStack.length > 0);

  // The canvas caches node positions; tell it to rebuild after store-side
  // position changes (undo/redo/organize)
  const refreshCanvas = () => window.dispatchEvent(new Event('bt-canvas-refresh'));

  const handleUndo = () => {
    refreshCanvas();
    undo();
  };
  const handleRedo = () => {
    refreshCanvas();
    redo();
  };
  const handleOrganize = (layout: 'horizontal' | 'vertical') => {
    if (!project?.selectedTreeId) return;
    localStorage.setItem('bt-layout', layout);
    refreshCanvas();
    organize(project.selectedTreeId, layout);
  };

  const isPanelCollapsed = (panelId: PanelId) => layout.collapsed.includes(panelId);

  const togglePanel = (panelId: PanelId) => {
    updateLayout({
      collapsed: isPanelCollapsed(panelId)
        ? layout.collapsed.filter(id => id !== panelId)
        : [...layout.collapsed, panelId],
    });
  };

  // Save project to localStorage
  const saveProject = useCallback(() => {
    if (project) {
      if (saveProjectStore()) {
        toast.success('Project saved successfully');
      } else {
        toast.error('Failed to save project');
      }
    }
  }, [project, saveProjectStore]);

  // Ctrl/Cmd+S saves, matching the old editor
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveProject();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveProject]);

  // Handle export button click - show export modal
  const handleExport = (type: ExportType = 'project') => {
    setExportType(type);
    setExportOpen(true);
  };

  // Handle import button click - trigger file input
  const handleImport = () => {
    document.getElementById('bt-file-import')?.click();
  };

  // Handle file selection
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const imported = parseImportedJson(json);

        if (imported.kind === 'project') {
          loadProject(imported.project);
          toast.success('Project imported');
        } else if (imported.kind === 'tree') {
          if (!project) {
            toast.error('Open a project before importing a tree');
            return;
          }
          const { tree, nodes } = b3ToTree(imported.tree, project.nodes);
          addImportedTree(tree, nodes);
          toast.success(`Tree "${tree.title}" imported`);
        } else {
          if (!project) {
            toast.error('Open a project before importing nodes');
            return;
          }
          addNodes(imported.nodes);
          toast.success(`${Object.keys(imported.nodes).length} node(s) imported`);
        }
      } catch (error) {
        console.error('Failed to import file', error);
        toast.error('Invalid behavior tree file');
      }
    };
    reader.readAsText(file);

    // Reset the file input
    e.target.value = '';
  };

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <h2 className="mb-3 text-xl font-medium">No project open</h2>
          <p className="mb-7 text-sm text-muted">
            Open an existing project or create a new one to start using the editor.
          </p>
          <div className="flex justify-center gap-3">
            <a
              href="/projects"
              className="rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent-soft transition-colors hover:bg-accent/15"
            >
              Create new project
            </a>
            <a
              href="/projects"
              className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:border-accent hover:text-accent-soft"
            >
              Open project
            </a>
          </div>
        </div>
      </div>
    );
  }

  // All three sections stack vertically now, so every toggle is a chevron up/down.
  const panelSection = (panelId: PanelId, title: string, body: ReactNode, grow: boolean) => {
    const collapsed = isPanelCollapsed(panelId);
    const Icon = collapsed ? ChevronDown : ChevronUp;
    return (
      <div
        className={`flex min-h-0 flex-col ${
          collapsed ? 'flex-none' : grow ? 'flex-1' : 'max-h-[45%] flex-none'
        }`}
      >
        <div className="panel-head flex-none">
          <span>{title}</span>
          <button
            onClick={() => togglePanel(panelId)}
            title={collapsed ? `Expand ${title}` : `Collapse ${title}`}
            aria-expanded={!collapsed}
            className="rounded-md p-1 text-muted transition-colors hover:bg-fg/5 hover:text-accent-soft"
          >
            <Icon size={15} />
          </button>
        </div>
        {!collapsed && <div className="min-h-0 flex-1 overflow-auto">{body}</div>}
      </div>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Export Modal */}
      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        exportType={exportType}
      />

      {/* Editor Toolbar */}
      <div className="flex h-[50px] flex-none items-center justify-between border-b border-divider px-6">
        <div className="flex items-baseline gap-[10px]">
          <span className="text-xs text-muted">{project.name}</span>
          <span className="text-border">/</span>
          <span className="text-[13px] font-medium">
            {project.selectedTreeId
              ? project.trees[project.selectedTreeId]?.title || 'Unknown Tree'
              : 'No Tree Selected'
            }
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className="toolbar-btn toolbar-btn--icon"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
            className="toolbar-btn toolbar-btn--icon"
          >
            <Redo2 size={14} />
          </button>
          <button
            onClick={() => handleOrganize(localStorage.getItem('bt-layout') === 'vertical' ? 'vertical' : 'horizontal')}
            onContextMenu={(e) => {
              e.preventDefault();
              handleOrganize(localStorage.getItem('bt-layout') === 'vertical' ? 'horizontal' : 'vertical');
            }}
            title="Auto organize (A) — right-click to switch horizontal/vertical"
            aria-label="Auto organize"
            className="toolbar-btn toolbar-btn--icon"
          >
            <Network size={14} />
          </button>

          <span className="mx-[6px] h-[18px] w-px bg-border" />

          <button onClick={saveProject} className="toolbar-btn toolbar-btn--accent">
            Save
          </button>
          <button onClick={handleImport} className="toolbar-btn">
            Import
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="toolbar-btn">
              Export
              <ChevronDown size={13} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => handleExport('project')}>
                Export Project
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport('tree')}>
                Export Current Tree
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport('nodes')}>
                Export Custom Nodes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            type="file"
            id="bt-file-import"
            style={{ display: 'none' }}
            onChange={handleFileImport}
            accept=".json"
          />
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex min-h-0 flex-1">
        {/* Left rail: Trees over Nodes. Trees is the short list, so Nodes takes
            the slack; collapsing either hands its space to the other. */}
        <div
          className="panel min-h-0 flex-none divide-y divide-divider"
          style={{ width: layout.left }}
        >
          {panelSection('trees', 'Trees', treesPanel, isPanelCollapsed('nodes'))}
          {panelSection('nodes', 'Nodes', nodesPanel, true)}
        </div>

        <ResizeHandle
          side="left"
          width={layout.left}
          onResize={(left) => updateLayout({ left })}
          label="Resize trees and nodes panel"
        />

        {/* Canvas/Workspace */}
        <div className="relative min-w-0 flex-1 overflow-hidden bg-base">{canvas}</div>

        <ResizeHandle
          side="right"
          width={layout.right}
          onResize={(right) => updateLayout({ right })}
          label="Resize properties panel"
        />

        {/* Right rail: Properties at full height */}
        <div className="panel min-h-0 flex-none" style={{ width: layout.right }}>
          {panelSection('properties', 'Properties', propertiesPanel, true)}
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
