import React, { useState } from 'react';
import { Pencil, Plus, Trash2, Workflow } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';

const TreesPanel: React.FC = () => {
  const project = useProjectStore(state => state.project);
  const selectedTreeId = useProjectStore(state => state.project?.selectedTreeId);
  const createTree = useProjectStore(state => state.createTree);
  const renameTree = useProjectStore(state => state.renameTree);
  const deleteTree = useProjectStore(state => state.deleteTree);
  const selectTree = useProjectStore(state => state.selectTree);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  if (!project) {
    return (
      <div className="p-4 text-center text-faint">
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

  const startRename = (treeId: string, currentTitle: string) => {
    setEditingId(treeId);
    setEditingTitle(currentTitle);
  };

  const commitRename = () => {
    if (editingId && editingTitle.trim()) {
      renameTree(editingId, editingTitle);
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-2">
        <button
          onClick={handleCreateTree}
          className="w-full py-2 px-4 bg-transparent border border-accent text-accent-soft rounded-md hover:bg-accent/15 transition flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          New Tree
        </button>
      </div>

      <div className="px-2 flex-1 overflow-auto">
        <h4 className="kicker px-2 py-1">
          Trees
        </h4>
        <ul className="space-y-1">
          {Object.values(project.trees).map(tree => (
            <li
              key={tree.id}
              className={`
                group rounded-md flex items-center justify-between p-2 cursor-pointer border
                ${selectedTreeId === tree.id
                  ? 'bg-accent-wash text-accent-soft border-accent'
                  : 'border-transparent hover:bg-fg/5 text-fg'}
              `}
              onClick={() => selectTree(tree.id)}
              onDoubleClick={() => startRename(tree.id, tree.title)}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <Workflow className="h-5 w-5 shrink-0 text-faint" />
                {editingId === tree.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      else if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 text-sm"
                    autoFocus
                  />
                ) : (
                  <span className="truncate">{tree.title}</span>
                )}
              </div>

              <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(tree.id, tree.title);
                  }}
                  className="text-faint hover:text-accent-soft p-1"
                  title="Rename tree"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {/* Only show delete button if there's more than one tree */}
                {Object.keys(project.trees).length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTree(tree.id);
                    }}
                    className="text-faint hover:text-danger-soft p-1"
                    title="Delete tree"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TreesPanel;
