import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useProjectStore } from '../stores/useProjectStore';
import { b3ToProject, b3ToTree, parseImportedJson } from '../lib/behavior/b3';

// Deep links from the /learn guides: /?example=enemy-patrol fetches
// /examples/enemy-patrol.json and opens it in a stable "Examples" project,
// mirroring the classic editor's example loading.
const EXAMPLES_PROJECT_ID = 'examples';

const ExampleLoader = () => {
	const navigate = useNavigate();
	const ran = useRef(false);

	useEffect(() => {
		if (ran.current) return;
		ran.current = true;

		const match = /[?&]example=([\w-]+)/.exec(window.location.search);
		if (!match) return;
		const name = match[1];

		(async () => {
			try {
				const response = await fetch(`/examples/${name}.json`);
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const imported = parseImportedJson(await response.json());
				if (imported.kind === 'nodes') throw new Error('example is not a tree or project file');

				const store = useProjectStore.getState();

				// Reuse the Examples project if it exists, otherwise create it
				if (store.project?.id !== EXAMPLES_PROJECT_ID) {
					const raw = localStorage.getItem(`bt-project-${EXAMPLES_PROJECT_ID}`);
					let restored = false;
					if (raw) {
						try {
							const parsed = parseImportedJson(JSON.parse(raw));
							if (parsed.kind === 'project') {
								store.loadProject(parsed.project);
								restored = true;
							}
						} catch {
							// fall through to a fresh Examples project
						}
					}
					if (!restored) {
						store.loadProject(
							b3ToProject({
								id: EXAMPLES_PROJECT_ID,
								name: 'Examples',
								description: 'Example trees from the behaviortrees.com guides',
								trees: [],
							})
						);
					}
				}

				// The classic editor branches on data.trees: project files merge
				// their custom nodes and every tree into the open project, tree
				// files import as a single tree (app.js:68-72, ImportManager.js:4-14)
				const current = useProjectStore.getState();
				let label: string;

				if (imported.kind === 'project') {
					const trees = Object.values(imported.project.trees);
					if (trees.length === 0) throw new Error('example project has no trees');

					current.addNodes(imported.project.nodes);
					trees.forEach((tree) => current.addImportedTree(tree, {}));

					const selected = imported.project.selectedTreeId;
					if (selected && imported.project.trees[selected]) {
						current.selectTree(selected);
					}
					label = imported.project.name;
				} else {
					const { tree, nodes } = b3ToTree(imported.tree, current.project!.nodes);
					current.addImportedTree(tree, nodes);
					label = tree.title;
				}

				useProjectStore.getState().saveProject();

				// Drop the query string and land in the editor
				window.history.replaceState(null, '', '/');
				navigate('/editor');
				toast.success(`Example "${label}" loaded`);
			} catch (error) {
				console.error('Failed to load example', error);
				toast.error('Could not load that example');
			}
		})();
	}, [navigate]);

	return null;
};

export default ExampleLoader;
