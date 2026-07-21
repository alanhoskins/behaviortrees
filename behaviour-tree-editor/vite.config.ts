import { copyFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const HERE = fileURLToPath(new URL('.', import.meta.url));

// The example trees live in ../src/examples (single source of truth, shared
// with the classic editor). Serve them at /examples in dev and copy them into
// dist/examples on build so /?example=<name> works everywhere.
const EXAMPLES_DIR = join(HERE, '../src/examples');

const examplesPlugin = (): Plugin => ({
	name: 'shared-examples',
	configureServer(server) {
		server.middlewares.use('/examples', (req, res, next) => {
			const url = (req as { url?: string }).url ?? '';
			const name = url.replace(/^\//, '').split('?')[0];
			if (!/^[\w-]+\.json$/.test(name)) return next();
			try {
				const body = readFileSync(join(EXAMPLES_DIR, name));
				res.setHeader('Content-Type', 'application/json');
				res.end(body);
			} catch {
				next();
			}
		});
	},
	closeBundle() {
		const out = join(HERE, 'dist/examples');
		mkdirSync(out, { recursive: true });
		for (const file of readdirSync(EXAMPLES_DIR)) {
			if (file.endsWith('.json')) {
				copyFileSync(join(EXAMPLES_DIR, file), join(out, file));
			}
		}
	},
});

export default defineConfig({
	plugins: [react(), tailwindcss(), examplesPlugin()],
});
