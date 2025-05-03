import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './base-node';

const ConditionNode: React.FC<NodeProps> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        showSourceHandle: false,
        handleClassName: 'bg-amber-500',
        nodeClassName: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
        contentClassName: 'text-amber-900 dark:text-amber-200',
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      }}
    />
  );
};

export default memo(ConditionNode);