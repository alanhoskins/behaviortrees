import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useProjectStore } from './stores/useProjectStore';
import { useTheme } from './lib/theme';
import { Toaster } from 'sonner';
import AppLayout from './components/layouts/app-layout';
import ExampleLoader from './components/example-loader';
import HomePage from './pages/home/home-page';
import EditorPage from './pages/editor/editor-page';
import ProjectsPage from './pages/projects/projects-page';
import SettingsPage from './pages/settings/settings-page';

import './index.css';

function App() {
	const restoreLastProject = useProjectStore((state) => state.restoreLastProject);

	// Reopen the last project on startup, like the old editor's recents
	useEffect(() => {
		restoreLastProject();
	}, [restoreLastProject]);

	// Theme is applied before first paint by the inline script in index.html;
	// useTheme only keeps it in sync with OS and cross-tab changes.
	const { resolved } = useTheme();

	return (
		<BrowserRouter>
			<Toaster position="bottom-right" theme={resolved} />
			<ExampleLoader />
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
