import { useCallback, useEffect, useState } from 'react';

export type PanelId = 'trees' | 'nodes' | 'properties';

export interface PanelLayout {
	/** Left rail width in px (Trees + Nodes). */
	left: number;
	/** Right rail width in px (Properties). */
	right: number;
	collapsed: PanelId[];
}

const STORAGE_KEY = 'bt-panel-layout';

export const PANEL_LIMITS = {
	// The left rail holds the node palette: below ~240px the cards' kicker +
	// name + description stop being readable.
	left: { min: 240, max: 460 },
	right: { min: 260, max: 560 },
} as const;

const DEFAULT_LAYOUT: PanelLayout = { left: 264, right: 328, collapsed: [] };

export function clampPanel(side: 'left' | 'right', width: number): number {
	const { min, max } = PANEL_LIMITS[side];
	return Math.round(Math.max(min, Math.min(max, width)));
}

function read(): PanelLayout {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_LAYOUT;
		const parsed = JSON.parse(raw) as Partial<PanelLayout>;
		return {
			left: clampPanel('left', Number(parsed.left) || DEFAULT_LAYOUT.left),
			right: clampPanel('right', Number(parsed.right) || DEFAULT_LAYOUT.right),
			collapsed: Array.isArray(parsed.collapsed) ? (parsed.collapsed as PanelId[]) : [],
		};
	} catch {
		return DEFAULT_LAYOUT;
	}
}

/**
 * Rail widths and collapse state, persisted. Collapse used to live in local
 * component state, so it was lost every time you navigated away from /editor.
 */
export function usePanelLayout(): [PanelLayout, (patch: Partial<PanelLayout>) => void] {
	const [layout, setLayout] = useState<PanelLayout>(() =>
		typeof window === 'undefined' ? DEFAULT_LAYOUT : read()
	);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
		} catch {
			// storage unavailable (private mode, quota) — layout stays in-memory
		}
	}, [layout]);

	const update = useCallback((patch: Partial<PanelLayout>) => {
		setLayout((prev) => ({ ...prev, ...patch }));
	}, []);

	return [layout, update];
}
