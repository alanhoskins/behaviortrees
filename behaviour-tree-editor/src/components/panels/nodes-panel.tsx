import React, { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Node, NodeCategory } from '../../types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

// Node category definitions
const NODE_CATEGORIES: Record<NodeCategory, { title: string, color: string }> = {
  composite: { 
    title: 'Composites', 
    color: 'bg-blue-500 dark:bg-blue-600 text-white' 
  },
  decorator: { 
    title: 'Decorators', 
    color: 'bg-purple-500 dark:bg-purple-600 text-white' 
  },
  action: { 
    title: 'Actions', 
    color: 'bg-green-500 dark:bg-green-600 text-white' 
  },
  condition: { 
    title: 'Conditions', 
    color: 'bg-amber-500 dark:bg-amber-600 text-white' 
  },
  root: { 
    title: 'Root', 
    color: 'bg-slate-500 dark:bg-slate-600 text-white' 
  }
};

const NodesPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NodeCategory>('action'); // Set default tab to action
  const project = useProjectStore(state => state.project);
  const createNode = useProjectStore(state => state.createNode);

  if (!project) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        No project loaded
      </div>
    );
  }

  // Group nodes by category
  const nodesByCategory = Object.values(project.nodes).reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<NodeCategory, Node[]>);

  // Sort nodes by name
  for (const category in nodesByCategory) {
    nodesByCategory[category as NodeCategory].sort((a, b) => a.name.localeCompare(b.name));
  }

  const handleCreateNode = () => {
    const name = prompt('Enter node name:');
    if (!name) return;
    
    createNode({
      name,
      category: activeTab,
      description: '',
      properties: {}
    });
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    console.log('Drag start:', nodeType);
    console.log('Available nodes:', Object.keys(project.nodes));
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as NodeCategory);
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs 
        defaultValue={activeTab} 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full flex bg-transparent justify-start border-b border-slate-200 dark:border-slate-700 p-0 h-auto">
          {Object.entries(NODE_CATEGORIES).map(([category, { title }]) => (
            <TabsTrigger 
              key={category}
              value={category}
              className={cn(
                "flex-1 py-2 px-3 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              )}
            >
              {title}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(NODE_CATEGORIES).map((category) => (
          <TabsContent 
            key={category} 
            value={category}
            className="flex-1 overflow-auto p-3 space-y-3 mt-0"
          >
            {nodesByCategory[category as NodeCategory] && nodesByCategory[category as NodeCategory].length > 0 ? (
              nodesByCategory[category as NodeCategory].map(node => (
                <div
                  key={node.name}
                  draggable
                  onDragStart={(event) => {
                    // Find the key for this node
                    const nodeKey = Object.keys(project.nodes).find(
                      key => project.nodes[key].name === node.name
                    );
                    onDragStart(event, nodeKey || node.name);
                  }}
                  className={cn(
                    "p-3 rounded-md shadow-sm cursor-grab active:cursor-grabbing",
                    NODE_CATEGORIES[node.category].color
                  )}
                >
                  <div className="font-medium">
                    {node.title || node.name}
                  </div>
                  {node.description && (
                    <div className="mt-1 text-xs opacity-80">
                      {node.description}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                No {NODE_CATEGORIES[category as NodeCategory].title.toLowerCase()} nodes available
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Node Button */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <Button 
          onClick={handleCreateNode} 
          variant="outline" 
          className="w-full"
        >
          <Plus className="h-5 w-5 mr-2" />
          New {activeTab}
        </Button>
      </div>
    </div>
  );
};

export default NodesPanel;