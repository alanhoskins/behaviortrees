import React, { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { cn } from '../../../lib/utils';
import NodeContextMenu from '../node-context-menu';

export type BaseNodeProps = NodeProps & {
  data: {
    label: string;
    category: string;
    showSourceHandle?: boolean;
    showTargetHandle?: boolean;
    handleClassName?: string;
    nodeClassName?: string;
    contentClassName?: string;
    icon?: React.ReactNode;
  };
};

const BaseNode: React.FC<BaseNodeProps> = (props) => {
  const {
    data,
    selected,
    isConnectable,
  } = props;

  const {
    label,
    showSourceHandle = true,
    showTargetHandle = true,
    handleClassName = 'bg-slate-500',
    nodeClassName = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    contentClassName = 'text-slate-800 dark:text-slate-200',
    icon,
  } = data;

  const nodeContent = (
    <div
      className={cn(
        nodeClassName,
        selected ? 'border-emerald-500 dark:border-emerald-400 shadow-md' : '',
        'rounded-md border overflow-hidden transition-all duration-200'
      )}
    >
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className={cn(`w-3 h-3 !border-2 border-white dark:border-slate-900`, handleClassName)}
        />
      )}
      
      <div className={cn(`p-3 min-w-[100px] flex items-center`, contentClassName)}>
        {icon && <div className="mr-2">{icon}</div>}
        <div className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap">
          {label}
        </div>
      </div>
      
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className={cn(`w-3 h-3 !border-2 border-white dark:border-slate-900`, handleClassName)}
        />
      )}
    </div>
  );

  return (
    <NodeContextMenu node={props}>
      {nodeContent}
    </NodeContextMenu>
  );
};

export default memo(BaseNode);