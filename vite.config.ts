import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    // Añadimos esta sección para que el puerto sea siempre el mismo
    server: {
        port: 5173,
        strictPort: true, 
    }
});
