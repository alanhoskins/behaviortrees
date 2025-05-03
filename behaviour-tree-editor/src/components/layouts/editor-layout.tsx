import React, { ReactNode, useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { serializeProject } from '../../lib/behavior/serializer';
import { toast } from 'sonner';
import ExportModal, { ExportType } from '../modals/export-modal';

type PanelId = 'trees' | 'nodes' | 'properties';

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
  const [collapsedPanels, setCollapsedPanels] = useState<PanelId[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('project');
  const project = useProjectStore(state => state.project);
  const saveProjectStore = useProjectStore(state => state.saveProject);
  const loadProject = useProjectStore(state => state.loadProject);

  const togglePanel = (panelId: PanelId) => {
    setCollapsedPanels(prev =>
      prev.includes(panelId)
        ? prev.filter(id => id !== panelId)
        : [...prev, panelId]
    );
  };

  const isPanelCollapsed = (panelId: PanelId) => collapsedPanels.includes(panelId);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('export-menu');
      const button = document.querySelector('[data-export-trigger]');

      if (menu && button && !menu.contains(event.target as Node) && !button.contains(event.target as Node)) {
        menu.style.display = 'none';
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Save project to localStorage
  const saveProject = () => {
    if (project) {
      saveProjectStore();

      // Always attempt to save to localStorage after updating store state
      try {
        const serialized = serializeProject(project);
        localStorage.setItem(`bt-project-${project.id}`, JSON.stringify(serialized));
        toast.success('Project saved successfully');
      } catch (error) {
        console.error('Error saving project:', error);
        toast.error('Failed to save project');
      }
    }
  };

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
        loadProject(json);
        toast.success('Project imported successfully');
      } catch (error) {
        console.error('Failed to parse project file', error);
        toast.error('Invalid project file');
      }
    };
    reader.readAsText(file);

    // Reset the file input
    e.target.value = '';
  };

  if (!project) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">No Project Open</h2>
          <p className="mb-6 text-slate-600 dark:text-slate-300">
            Please open an existing project or create a new one to start using the editor.
          </p>
          <div className="flex justify-center space-x-4">
            <button className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition">
              Create New Project
            </button>
            <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition">
              Open Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Export Modal */}
      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        exportType={exportType}
      />

      {/* Editor Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="font-medium">{project.name}</span>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
          <span className="text-slate-500 dark:text-slate-400 text-sm">
            {project.selectedTreeId
              ? project.trees[project.selectedTreeId]?.title || 'Unknown Tree'
              : 'No Tree Selected'
            }
          </span>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={saveProject}
            className="px-3 py-1 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600 transition"
          >
            Save
          </button>
          <button
            onClick={handleImport}
            className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Import
          </button>
          <div className="relative inline-flex text-left">
            <button
              data-export-trigger
              onClick={() => handleExport('project')}
              className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-l hover:bg-slate-300 dark:hover:bg-slate-600 transition"
            >
              Export
            </button>
            <button
              data-export-dropdown
              onClick={() => {
                const menu = document.getElementById('export-menu');
                if (menu) {
                  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                }
              }}
              className="px-1 py-1 text-sm bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-r border-l border-slate-300 dark:border-slate-600 hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div
              id="export-menu"
              className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
              style={{display: 'none'}}
            >
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <button
                  onClick={() => {
                    handleExport('project');
                    document.getElementById('export-menu')!.style.display = 'none';
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  role="menuitem"
                >
                  Export Project
                </button>
                <button
                  onClick={() => {
                    handleExport('tree');
                    document.getElementById('export-menu')!.style.display = 'none';
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  role="menuitem"
                >
                  Export Current Tree
                </button>
                <button
                  onClick={() => {
                    handleExport('nodes');
                    document.getElementById('export-menu')!.style.display = 'none';
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  role="menuitem"
                >
                  Export Custom Nodes
                </button>
              </div>
            </div>
          </div>
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
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className={`bg-white dark:bg-slate-800 shadow-md flex flex-col ${isPanelCollapsed('trees') ? 'w-12' : 'w-64'} transition-all`}>
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className={`font-medium ${isPanelCollapsed('trees') ? 'hidden' : 'block'}`}>
              Trees
            </h3>
            <button
              onClick={() => togglePanel('trees')}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {isPanelCollapsed('trees') ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          <div className={`flex-1 overflow-auto ${isPanelCollapsed('trees') ? 'hidden' : 'block'}`}>
            {treesPanel}
          </div>
        </div>

        {/* Canvas/Workspace */}
        <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
          {canvas}
        </div>

        {/* Right Sidebar */}
        <div className="bg-white dark:bg-slate-800 shadow-md flex flex-col">
          {/* Nodes Panel */}
          <div className={`border-b border-slate-200 dark:border-slate-700 flex flex-col ${isPanelCollapsed('nodes') ? 'h-12' : 'h-1/2'} transition-all`}>
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-medium">
                Nodes
              </h3>
              <button
                onClick={() => togglePanel('nodes')}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {isPanelCollapsed('nodes') ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            <div className={`flex-1 overflow-auto ${isPanelCollapsed('nodes') ? 'hidden' : 'block'}`}>
              {nodesPanel}
            </div>
          </div>

          {/* Properties Panel */}
          <div className={`flex flex-col ${isPanelCollapsed('properties') ? 'h-12' : 'flex-1'} transition-all`}>
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-medium">
                Properties
              </h3>
              <button
                onClick={() => togglePanel('properties')}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {isPanelCollapsed('properties') ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            <div className={`flex-1 overflow-auto ${isPanelCollapsed('properties') ? 'hidden' : 'block'}`}>
              {propertiesPanel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
