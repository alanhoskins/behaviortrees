import React from 'react';
import { EdgeProps } from 'reactflow';
import { Trash2 } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '../ui/context-menu';

interface EdgeContextMenuProps {
  edge: EdgeProps;
  children: React.ReactNode;
}

const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({ edge, children }) => {
  const selectedTreeId = useProjectStore((state) => state.project?.selectedTreeId);
  const deleteConnection = useProjectStore((state) => state.deleteConnection);

  const handleDelete = () => {
    if (selectedTreeId) {
      deleteConnection(selectedTreeId, edge.id);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Connection
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default EdgeContextMenu;