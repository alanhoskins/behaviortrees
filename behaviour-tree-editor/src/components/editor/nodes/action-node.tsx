import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './base-node';

const ActionNode: React.FC<NodeProps> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        showSourceHandle: false,
        handleClassName: 'bg-green-500',
        nodeClassName: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        contentClassName: 'text-green-900 dark:text-green-200',
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      }}
    />
  );
};

export default memo(ActionNode);