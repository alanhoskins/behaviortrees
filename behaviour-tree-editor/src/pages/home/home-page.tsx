import React from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../stores/useProjectStore';

const HomePage: React.FC = () => {
	const project = useProjectStore((state) => state.project);

	return (
		<div className="max-w-4xl mx-auto">
			<div className="text-center mb-12">
				<h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
					Behavior Tree Editor
				</h1>
				<p className="text-xl text-slate-600 dark:text-slate-300">
					A free online editor for creating behavior trees for games, AI, and robotics.
				</p>
				<p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
					New to behavior trees? Read the{' '}
					<a href="/learn/" className="text-emerald-500 hover:underline">guides</a> or open an
					example:{' '}
					<a href="/?example=enemy-patrol" className="text-emerald-500 hover:underline">enemy patrol AI</a>,{' '}
					<a href="/?example=open-the-door" className="text-emerald-500 hover:underline">selector vs sequence</a>,{' '}
					<a href="/?example=robot-pick-and-place" className="text-emerald-500 hover:underline">robot pick &amp; place</a>.
					Prefer the classic editor?{' '}
					<a href="https://old.behaviortrees.com" className="text-emerald-500 hover:underline">old.behaviortrees.com</a>
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-8 mb-12">
				<div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
					<h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">
						Getting Started
					</h2>
					<ul className="space-y-3 text-slate-600 dark:text-slate-300">
						<li className="flex items-start">
							<span className="mr-2 text-emerald-500">•</span>
							Create a new project or open an existing one
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-emerald-500">•</span>
							Design your behavior trees visually
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-emerald-500">•</span>
							Export trees to use in your game engine
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-emerald-500">•</span>
							Save and share your projects
						</li>
					</ul>

					<div className="mt-6 flex flex-col sm:flex-row gap-4">
						<Link
							to="/editor"
							className="inline-flex justify-center items-center px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition"
						>
							{project ? 'Open Editor' : 'Create Project'}
						</Link>
						<Link
							to="/projects"
							className="inline-flex justify-center items-center px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition"
						>
							Browse Projects
						</Link>
					</div>
				</div>

				<div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
					<h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Features</h2>
					<ul className="space-y-3 text-slate-600 dark:text-slate-300">
						<li className="flex items-start">
							<span className="mr-2 text-emerald-500">•</span>
							Visual node-based editor
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-emerald-500">•</span>
							Standard behavior tree nodes (sequence, selector, etc.)
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-emerald-500">•</span>
							Custom node creation
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-emerald-500">•</span>
							Multiple trees per project
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-emerald-500">•</span>
							JSON export/import
						</li>
					</ul>
				</div>
			</div>

			{project && (
				<div className="text-center">
					<h2 className="text-2xl font-semibold mb-4">Current Project</h2>
					<div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-4">
						<h3 className="text-xl font-medium">{project.name}</h3>
						<p className="text-slate-600 dark:text-slate-300">{project.description}</p>
						<div className="mt-4">
							<Link
								to="/editor"
								className="inline-flex justify-center items-center px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition"
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
