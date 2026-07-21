import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
    site: 'https://www.behaviortrees.com',
    trailingSlash: 'always',
    integrations: [
        sitemap({
            // The editor app lives at / outside this Astro build
            customPages: ['https://www.behaviortrees.com/'],
        }),
    ],
    build: {
        format: 'directory',
    },
});
