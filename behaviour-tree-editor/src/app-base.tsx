import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useProjectStore } from './stores/useProjectStore';
import { Toaster } from 'sonner';
import AppLayout from './components/layouts/app-layout';
import HomePage from './pages/home/home-page';
import EditorPage from './pages/editor/editor-page';
import ProjectsPage from './pages/projects/projects-page';
import SettingsPage from './pages/settings/settings-page';

import './index.css';

function App() {
	const createProject = useProjectStore((state) => state.createProject);
	const project = useProjectStore((state) => state.project);

	// Create a demo project if none exists (first load)
	useEffect(() => {
		if (!project) {
			// Don't auto create here since each page will decide what to do
			// createProject('Demo Project', 'A demo behavior tree project');
		}

		// Initialize theme from localStorage
		const savedTheme = localStorage.getItem('bt-theme');
		if (savedTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else if (savedTheme === 'light') {
			document.documentElement.classList.remove('dark');
		} else {
			// Use system preference
			if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				document.documentElement.classList.add('dark');
			}
		}
	}, [project, createProject]);

	return (
		<BrowserRouter>
			<Toaster position="bottom-right" />
			<AppLayout>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/editor" element={<EditorPage />} />
					<Route path="/projects" element={<ProjectsPage />} />
					<Route path="/settings" element={<SettingsPage />} />
				</Routes>
			</AppLayout>
		</BrowserRouter>
	);
}

export default App;
