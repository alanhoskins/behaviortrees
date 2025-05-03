import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import EdgeContextMenu from '../edge-context-menu';

const ContextEdge: React.FC<EdgeProps> = (props) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
  } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const pathStyle = {
    ...style,
    strokeWidth: 2,
    stroke: '#64748b',
  };

  // Increase the clickable area for the path to make it easier to right-click
  const interactionPath = (
    <path
      id={id}
      d={edgePath}
      fill="none"
      strokeWidth={10}
      stroke="transparent"
      strokeLinecap="round"
      className="cursor-pointer"
    />
  );

  // The actual visible path
  const visualPath = (
    <path
      id={id}
      d={edgePath}
      fill="none"
      style={pathStyle}
      strokeLinecap="round"
      markerEnd={markerEnd}
      className="transition-colors hover:stroke-slate-500 dark:hover:stroke-slate-300"
    />
  );

  return (
    <EdgeContextMenu edge={props}>
      <g>
        {interactionPath}
        {visualPath}
      </g>
    </EdgeContextMenu>
  );
};

export default ContextEdge;