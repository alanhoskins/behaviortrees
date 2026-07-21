import React, { useRef } from 'react';
import { clampPanel } from '../../lib/panel-layout';

interface ResizeHandleProps {
	side: 'left' | 'right';
	width: number;
	/** Fires continuously while dragging. */
	onResize: (width: number) => void;
	/** Fires once on pointer release, for persisting. */
	onCommit?: (width: number) => void;
	label: string;
}

/**
 * Pointer-drag divider between a rail and the canvas. Two handles isn't enough
 * to justify a panel library, and keeping it hand-rolled means the canvas keeps
 * its own event handling untouched.
 */
const ResizeHandle: React.FC<ResizeHandleProps> = ({ side, width, onResize, onCommit, label }) => {
	const start = useRef<{ x: number; width: number } | null>(null);

	const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		start.current = { x: event.clientX, width };
	};

	const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		if (!start.current) return;
		const delta = event.clientX - start.current.x;
		// Dragging right grows a left rail and shrinks a right one.
		const next = start.current.width + (side === 'left' ? delta : -delta);
		onResize(clampPanel(side, next));
	};

	const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
		if (!start.current) return;
		const delta = event.clientX - start.current.x;
		const next = clampPanel(side, start.current.width + (side === 'left' ? delta : -delta));
		start.current = null;
		onCommit?.(next);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		const step = event.key === 'ArrowRight' ? 16 : -16;
		const next = clampPanel(side, width + (side === 'left' ? step : -step));
		onResize(next);
		onCommit?.(next);
	};

	return (
		<div
			role="separator"
			aria-orientation="vertical"
			aria-label={label}
			aria-valuenow={width}
			tabIndex={0}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onKeyDown={handleKeyDown}
			className="group relative w-[5px] flex-none cursor-col-resize touch-none select-none"
		>
			<span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-divider transition-colors group-hover:bg-accent group-focus-visible:bg-accent" />
		</div>
	);
};

export default ResizeHandle;
