import React from 'react';
import { useTheme } from '../lib/theme';

/**
 * The header pill. Two-state on purpose — touching it *is* an explicit
 * preference, so "System" stays available only on the Settings page.
 */
const ThemeToggle: React.FC = () => {
	const { resolved, setTheme } = useTheme();
	const isDark = resolved === 'dark';

	return (
		<button
			type="button"
			role="switch"
			aria-checked={!isDark}
			aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
			title="Toggle theme"
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			className="relative inline-block h-[19px] w-[34px] shrink-0 cursor-pointer rounded-full border border-border transition-colors hover:border-accent"
		>
			<span
				className="absolute top-[2px] left-[2px] h-[13px] w-[13px] rounded-full bg-accent transition-transform duration-200"
				style={{ transform: isDark ? 'translateX(0)' : 'translateX(15px)' }}
			/>
		</button>
	);
};

export default ThemeToggle;
