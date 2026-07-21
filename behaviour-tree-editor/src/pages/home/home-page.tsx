import React from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../stores/useProjectStore';

const HomePage: React.FC = () => {
	const project = useProjectStore((state) => state.project);

	// Nocturne is flush-left and asymmetric: content hugs the left edge and the
	// whitespace is allowed to fall on the right.
	return (
		<div className="max-w-4xl">
			<div className="mb-14 max-w-2xl">
				<div className="kicker mb-3 text-accent-soft">Behavior trees</div>
				<h1 className="mb-4 text-4xl font-medium tracking-[-0.02em] text-fg">
					Behavior Tree Editor
				</h1>
				<p className="text-xl text-muted text-pretty">
					A free online editor for creating behavior trees for games, AI, and robotics.
				</p>
				<p className="mt-4 text-sm text-faint text-pretty">
					New to behavior trees? Read the{' '}
					<a href="/learn/" className="text-accent-soft hover:underline">guides</a> or open an
					example:{' '}
					<a href="/?example=enemy-patrol" className="text-accent-soft hover:underline">enemy patrol AI</a>,{' '}
					<a href="/?example=open-the-door" className="text-accent-soft hover:underline">selector vs sequence</a>,{' '}
					<a href="/?example=robot-pick-and-place" className="text-accent-soft hover:underline">robot pick &amp; place</a>.
					Prefer the classic editor?{' '}
					<a href="https://old.behaviortrees.com" className="text-accent-soft hover:underline">old.behaviortrees.com</a>
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-8 mb-12">
				<div className="card">
					<h2 className="text-2xl font-medium mb-4 text-fg">Getting Started</h2>
					<ul className="space-y-3 text-muted">
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							Create a new project or open an existing one
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							Design your behavior trees visually
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							Export trees to use in your game engine
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							Save and share your projects
						</li>
					</ul>

					<div className="mt-6 flex flex-col sm:flex-row gap-4">
						<Link
							to="/editor"
							className="inline-flex justify-center items-center px-4 py-2 border border-accent bg-transparent text-accent-soft rounded-md hover:bg-accent/15 transition"
						>
							{project ? 'Open Editor' : 'Create Project'}
						</Link>
						<Link
							to="/projects"
							className="inline-flex justify-center items-center px-4 py-2 border border-border bg-transparent text-fg rounded-md hover:bg-fg/7 transition"
						>
							Browse Projects
						</Link>
					</div>
				</div>

				<div className="card">
					<h2 className="text-2xl font-medium mb-4 text-fg">Features</h2>
					<ul className="space-y-3 text-muted">
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							Visual node-based editor
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							Standard behavior tree nodes (sequence, selector, etc.)
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							Custom node creation
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							Multiple trees per project
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							JSON export/import
						</li>
					</ul>
				</div>
			</div>

			{project && (
				<div>
					<h2 className="mb-4 text-2xl font-medium">Current Project</h2>
					<div className="card mb-4">
						<h3 className="text-xl font-medium">{project.name}</h3>
						<p className="text-muted">{project.description}</p>
						<div className="mt-4">
							<Link
								to="/editor"
								className="inline-flex justify-center items-center px-4 py-2 border border-accent bg-transparent text-accent-soft rounded-md hover:bg-accent/15 transition"
							>
								Open Editor
							</Link>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default HomePage;
