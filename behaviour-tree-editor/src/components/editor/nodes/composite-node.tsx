import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './base-node';

const CompositeNode: React.FC<NodeProps> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        handleClassName: 'bg-blue-500',
        nodeClassName: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        contentClassName: 'text-blue-900 dark:text-blue-200',
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        ),
      }}
    />
  );
};

export default memo(CompositeNode);