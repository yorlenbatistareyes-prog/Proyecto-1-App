import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Este adaptador es el que genera la carpeta 'dist'
		adapter: adapter({
			pages: 'dist',
			assets: 'dist',
			fallback: 'index.html', // Necesario para que las rutas funcionen en el .exe
			precompress: false,
			strict: true
		})
	}
};

export default config;