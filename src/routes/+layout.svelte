<script lang="ts">
    let { children } = $props();
</script>

{@render children()}


<style>
  /* Este bloque arregla la base de toda la app para el móvil */
  :global(body) {
    margin: 0;
    padding: 0;
    width: 100%;
    /* Evita que la pantalla se mueva hacia los lados */
    overflow-x: hidden; 
    /* Ayuda a que los colores de fondo ocupen toda la pantalla */
    min-height: 100vh;
    /* Suaviza las fuentes en móviles */
    -webkit-font-smoothing: antialiased;
  }

  /* Contenedor principal para que el contenido respire en el móvil */
  :global(main) {
    width: 100%;
    max-width: 100vw;
    box-sizing: border-box;
    padding: 10px; /* Margen interno para que el texto no pegue al borde físico del móvil */
  }
</style>