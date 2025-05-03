import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './base-node';

const RootNode: React.FC<NodeProps> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        showTargetHandle: false,
        handleClassName: 'bg-slate-500',
        nodeClassName: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
        contentClassName: 'text-slate-900 dark:text-slate-100',
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ),
      }}
    />
  );
};

export default memo(RootNode);