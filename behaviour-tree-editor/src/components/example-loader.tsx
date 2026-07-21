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
				if (imported.kind !== 'tree') throw new Error('example is not a tree file');

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

				const current = useProjectStore.getState();
				const { tree, nodes } = b3ToTree(imported.tree, current.project!.nodes);
				current.addImportedTree(tree, nodes);
				current.saveProject();

				// Drop the query string and land in the editor
				window.history.replaceState(null, '', '/');
				navigate('/editor');
				toast.success(`Example "${tree.title}" loaded`);
			} catch (error) {
				console.error('Failed to load example', error);
				toast.error('Could not load that example');
			}
		})();
	}, [navigate]);

	return null;
};

export default ExampleLoader;
