import React, { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Block } from '../../types';

interface PropertiesPanelProps {
  selectedBlock?: Block;
  onUpdateBlock?: (updates: Partial<Block>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedBlock,
  onUpdateBlock
}) => {
  const project = useProjectStore(state => state.project);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  
  if (!project) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        No project loaded
      </div>
    );
  }

  if (!selectedBlock) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        Select a block to view properties
      </div>
    );
  }

  const handleTitleChange = (title: string) => {
    if (onUpdateBlock) {
      onUpdateBlock({ title });
    }
    setEditingTitle(false);
  };

  const handleDescriptionChange = (description: string) => {
    if (onUpdateBlock) {
      onUpdateBlock({ description });
    }
    setEditingDescription(false);
  };

  const handlePropertyChange = (key: string, value: any) => {
    if (onUpdateBlock) {
      onUpdateBlock({
        properties: {
          ...selectedBlock.properties,
          [key]: value
        }
      });
    }
  };

  // Find the node definition to understand property types
  // Note: We might need this in the future when implementing property type validation
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
          Block Type
        </div>
        <div className="font-medium">
          {selectedBlock.name}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Category: {selectedBlock.category}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Title
            </label>
            <button
              onClick={() => setEditingTitle(true)}
              className="text-xs text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Edit
            </button>
          </div>
          
          {editingTitle ? (
            <div className="mt-1 flex">
              <input
                type="text"
                defaultValue={selectedBlock.title || ''}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-l-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                onBlur={(e) => handleTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleChange(e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    setEditingTitle(false);
                  }
                }}
                autoFocus
              />
              <button
                onClick={() => setEditingTitle(false)}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-r-md hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md">
              {selectedBlock.title || selectedBlock.name}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <button
              onClick={() => setEditingDescription(true)}
              className="text-xs text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Edit
            </button>
          </div>
          
          {editingDescription ? (
            <div className="mt-1 flex flex-col">
              <textarea
                defaultValue={selectedBlock.description || ''}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-t-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
                onBlur={(e) => handleDescriptionChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingDescription(false);
                  }
                }}
                autoFocus
              />
              <div className="flex">
                <button
                  onClick={() => handleDescriptionChange(
                    (document.querySelector('textarea') as HTMLTextAreaElement).value
                  )}
                  className="flex-1 px-3 py-2 bg-emerald-500 text-white rounded-bl-md hover:bg-emerald-600"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingDescription(false)}
                  className="flex-1 px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-br-md hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md min-h-[60px]">
              {selectedBlock.description || <span className="text-slate-400 dark:text-slate-500 italic">No description</span>}
            </div>
          )}
        </div>

        {/* Properties */}
        {Object.entries(selectedBlock.properties).length > 0 && (
          <div>
            <div className="mb-2">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Properties
              </h3>
            </div>
            <div className="space-y-3">
              {Object.entries(selectedBlock.properties).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <label className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {key}
                  </label>
                  
                  {typeof value === 'boolean' ? (
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handlePropertyChange(key, e.target.checked)}
                        className="h-4 w-4 text-emerald-500 focus:ring-emerald-400 border-slate-300 rounded"
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                        {value ? 'True' : 'False'}
                      </span>
                    </label>
                  ) : typeof value === 'number' ? (
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handlePropertyChange(key, parseFloat(e.target.value))}
                      className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  ) : typeof value === 'string' ? (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handlePropertyChange(key, e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">
                      Complex value
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;