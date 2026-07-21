import { useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'bt-theme';

const prefersDark = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export function getThemePreference(): ThemePreference {
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
	if (preference === 'light' || preference === 'dark') return preference;
	return prefersDark() ? 'dark' : 'light';
}

/**
 * Applies the theme to <html>. The inline boot script in index.html does this
 * before first paint; this keeps it in sync afterwards.
 */
export function applyTheme(resolved: ResolvedTheme) {
	const root = document.documentElement;
	root.dataset.theme = resolved;
	root.style.colorScheme = resolved;
}

export function setThemePreference(preference: ThemePreference) {
	if (preference === 'system') {
		localStorage.removeItem(STORAGE_KEY);
	} else {
		localStorage.setItem(STORAGE_KEY, preference);
	}
	applyTheme(resolveTheme(preference));
	window.dispatchEvent(new Event('bt-theme-change'));
}

/**
 * Tracks the active theme. Reacts to OS changes while on `system`, and to the
 * guides site changing the key in another tab on the same origin.
 */
export function useTheme() {
	const [preference, setPreference] = useState<ThemePreference>(() =>
		typeof window === 'undefined' ? 'dark' : getThemePreference()
	);

	useEffect(() => {
		const sync = () => setPreference(getThemePreference());

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const onMediaChange = () => {
			if (getThemePreference() === 'system') applyTheme(resolveTheme('system'));
			sync();
		};

		const onStorage = (event: StorageEvent) => {
			if (event.key === null || event.key === STORAGE_KEY) {
				applyTheme(resolveTheme(getThemePreference()));
				sync();
			}
		};

		media.addEventListener('change', onMediaChange);
		window.addEventListener('storage', onStorage);
		window.addEventListener('bt-theme-change', sync);
		return () => {
			media.removeEventListener('change', onMediaChange);
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('bt-theme-change', sync);
		};
	}, []);

	return {
		preference,
		resolved: resolveTheme(preference),
		setTheme: setThemePreference,
	};
}
