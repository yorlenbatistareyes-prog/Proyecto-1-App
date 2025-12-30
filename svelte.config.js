import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			strict: false,
			pages: 'dist',
			assets: 'dist',
			fallback: 'index.html'
		}),
		paths: {
			base: ''
		}
	}
};

export default config;