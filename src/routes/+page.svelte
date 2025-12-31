<script>
  import Header from '$lib/components/Header.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import Dashboard from '$lib/components/Dashboard.svelte';

  let nombreCircuitoActual = "Holguín-14"; 
  let totalCongregaciones = 2;
</script>

<div class="app-window">
  <Header />
  
  <Toolbar 
    nombreCircuito={nombreCircuitoActual} 
    cantidadCongregaciones={totalCongregaciones} 
  />

  <main class="content-area">
    <Dashboard />
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #f1f5f9;
  }

  .app-window {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
  }

  .content-area {
    flex: 1;
    display: flex;
    overflow: hidden; /* El scroll interno lo maneja el Dashboard */
  }

  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column; /* Cambiado para permitir flujo vertical */
    overflow-y: auto; /* Permite que la página crezca hacia abajo */
    background-color: #f1f5f9;
    padding-top: 20px; /* Espacio entre Toolbar y Panel */
  }
</style>