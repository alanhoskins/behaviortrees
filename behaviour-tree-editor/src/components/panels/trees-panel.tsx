import React from 'react';
import { useProjectStore } from '../../stores/useProjectStore';

const TreesPanel: React.FC = () => {
  const project = useProjectStore(state => state.project);
  const selectedTreeId = useProjectStore(state => state.project?.selectedTreeId);
  const createTree = useProjectStore(state => state.createTree);
  const deleteTree = useProjectStore(state => state.deleteTree);
  const selectTree = useProjectStore(state => state.selectTree);

  if (!project) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        No project loaded
      </div>
    );
  }

  const handleCreateTree = () => {
    const title = prompt('Enter tree name:');
    if (title) {
      createTree(title);
    }
  };

  const handleDeleteTree = (treeId: string) => {
    if (confirm('Are you sure you want to delete this tree?')) {
      deleteTree(treeId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-2">
        <button 
          onClick={handleCreateTree}
          className="w-full py-2 px-4 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Tree
        </button>
      </div>

      <div className="px-2 flex-1 overflow-auto">
        <h4 className="text-xs uppercase tracking-wider px-2 py-1 text-slate-500 dark:text-slate-400">
          Trees
        </h4>
        <ul className="space-y-1">
          {Object.values(project.trees).map(tree => (
            <li 
              key={tree.id}
              className={`
                group rounded flex items-center justify-between p-2 cursor-pointer
                ${selectedTreeId === tree.id 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200'}
              `}
              onClick={() => selectTree(tree.id)}
            >
              <div className="flex items-center space-x-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-slate-400 dark:text-slate-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span className="truncate">{tree.title}</span>
              </div>
              
              {/* Only show delete button if there's more than one tree */}
              {Object.keys(project.trees).length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTree(tree.id);
                  }}
                  className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TreesPanel;