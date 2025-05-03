import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './base-node';

const RootNode: React.FC<NodeProps> = (props) => {
  return (
    <div className="root-node-wrapper">
      <div className="absolute -bottom-6 left-0 right-0 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
        Root Node
      </div>
      <BaseNode
        {...props}
        data={{
          ...props.data,
          showTargetHandle: false,
          handleClassName: 'bg-blue-500',
          nodeClassName: 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-800 shadow-md',
          contentClassName: 'text-blue-900 dark:text-blue-100',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-500"
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
    </div>
  );
};

export default memo(RootNode);