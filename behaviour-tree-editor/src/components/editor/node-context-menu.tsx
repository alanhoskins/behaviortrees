import React from 'react';
import { NodeProps } from 'reactflow';
import { Trash2, PenLine } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '../ui/context-menu';

interface NodeContextMenuProps {
  node: NodeProps;
  children: React.ReactNode;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ node, children }) => {
  const selectedTreeId = useProjectStore((state) => state.project?.selectedTreeId);
  const deleteBlock = useProjectStore((state) => state.deleteBlock);
  const updateBlock = useProjectStore((state) => state.updateBlock);

  const handleDelete = () => {
    if (selectedTreeId) {
      deleteBlock(selectedTreeId, node.id);
    }
  };

  const handleRename = () => {
    if (selectedTreeId) {
      const newTitle = prompt('Enter new title:', node.data.label);
      if (newTitle) {
        updateBlock(selectedTreeId, node.id, { title: newTitle });
      }
    }
  };

  // Prevent context menu for root nodes
  if (node.data.category === 'root') {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={handleRename}>
          <PenLine className="mr-2 h-4 w-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled>
          Node Type: {node.data.category}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default NodeContextMenu;