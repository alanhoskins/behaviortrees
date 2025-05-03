import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './base-node';

const DecoratorNode: React.FC<NodeProps> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        handleClassName: 'bg-purple-500',
        nodeClassName: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        contentClassName: 'text-purple-900 dark:text-purple-200',
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-purple-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        ),
      }}
    />
  );
};

export default memo(DecoratorNode);