import React, { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import ThemeToggle from '../theme-toggle';

type AppLayoutProps = {
	children: ReactNode;
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
	isActive ? 'text-accent-soft' : 'text-muted transition-colors hover:text-accent-soft';

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
	// The editor is a full-bleed application screen: no page gutter, no footer,
	// and it owns the viewport below the header.
	const isEditor = useLocation().pathname === '/editor';

	return (
		<div
			className={
				isEditor
					? 'flex h-screen flex-col overflow-hidden bg-base text-fg'
					: 'flex min-h-screen flex-col bg-base text-fg'
			}
		>
			<header className="flex h-[54px] flex-none items-center justify-between border-b border-divider px-6">
				<div className="flex items-center gap-3">
					<div
						className="grid h-[22px] w-[22px] place-items-center rounded-md border border-accent"
						style={{ boxShadow: '0 0 10px var(--glow)' }}
					>
						<div className="h-2 w-2 rounded-[2px] bg-accent" />
					</div>
					<span className="text-[15px] font-medium tracking-[-0.01em]">Behavior Tree Editor</span>
				</div>

				<nav>
					<ul className="flex items-center gap-6 text-[13px]">
						<li>
							<NavLink to="/" className={navLinkClass}>
								Home
							</NavLink>
						</li>
						<li>
							<NavLink to="/editor" className={navLinkClass}>
								Editor
							</NavLink>
						</li>
						<li>
							<NavLink to="/projects" className={navLinkClass}>
								Projects
							</NavLink>
						</li>
						<li>
							<NavLink to="/settings" className={navLinkClass}>
								Settings
							</NavLink>
						</li>
						<li>
							{/* Static guides site deployed alongside the app */}
							<a href="/learn/" className="text-muted transition-colors hover:text-accent-soft">
								Learn
							</a>
						</li>
						<li className="flex items-center">
							<ThemeToggle />
						</li>
					</ul>
				</nav>
			</header>

			{isEditor ? (
				<main className="flex min-h-0 flex-1 flex-col">{children}</main>
			) : (
				<>
					<main className="container mx-auto flex-1 px-6 py-10">{children}</main>
					<footer className="border-t border-divider">
						<div className="container mx-auto px-6 py-5 text-center text-[13px] text-muted">
							&copy; {new Date().getFullYear()} behaviortrees.com ·{' '}
							<a href="/learn/" className="text-accent-soft hover:underline">
								Learn behavior trees
							</a>{' '}
							· Prefer the classic editor? It lives on at{' '}
							<a href="https://old.behaviortrees.com" className="text-accent-soft hover:underline">
								old.behaviortrees.com
							</a>
							.
						</div>
					</footer>
				</>
			)}
		</div>
	);
};

export default AppLayout;
