<script lang="ts">
  // Importamos los stores para que este archivo sepa qué vista mostrar
  import { vistaActual, menuAbierto } from '$lib/stores';
</script>

{#if $menuAbierto}
  <div class="overlay" on:click={() => $menuAbierto = false}></div>
  
  <nav class="sidebar">
    <div class="sidebar-header">
      <h2>Menú</h2>
      <button class="btn-cerrar" on:click={() => $menuAbierto = false}>×</button>
    </div>

    <div class="menu-items">
      <button class:active={$vistaActual === 'inicio'} on:click={() => { $vistaActual = 'inicio'; $menuAbierto = false; }}>
        <span>🏠</span> Inicio
      </button>
      
      <button class:active={$vistaActual === 'circuito'} on:click={() => { $vistaActual = 'circuito'; $menuAbierto = false; }}>
        <span>🌐</span> Circuito
      </button>
      
      <button class:active={$vistaActual === 'congregaciones'} on:click={() => { $vistaActual = 'congregaciones'; $menuAbierto = false; }}>
        <span>👥</span> Congregaciones
      </button>

      <div class="separador"></div>

      <button class:active={$vistaActual === 'configuracion'} on:click={() => { $vistaActual = 'configuracion'; $menuAbierto = false; }}>
        <span>⚙️</span> Configuración
      </button>
    </div>
  </nav>
{/if}

<style>
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    background-color: white;
    z-index: 1000;
    box-shadow: 5px 0 15px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .menu-items {
    display: flex;
    flex-direction: column;
    padding: 10px 0;
    width: 100%;
  }
  
  /* Agregué estos que faltaban para que se vea bien el diseño */
  .sidebar-header {
    padding: 20px;
    background: #f8f9fa;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
  }

  .btn-cerrar {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
  }

  .menu-items button {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px 20px;
    border: none;
    background: none;
    text-align: left;
    font-size: 1.1rem;
    cursor: pointer;
  }

  .menu-items button.active {
    background-color: #edf2ff;
    color: #5b4cc4;
    font-weight: bold;
    border-left: 4px solid #5b4cc4;
  }

  .separador {
    height: 1px;
    background: #e2e8f0;
    margin: 10px 20px;
  }
</style>