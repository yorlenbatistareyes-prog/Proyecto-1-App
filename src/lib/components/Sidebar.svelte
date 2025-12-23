<script lang="ts">
  import { fly, fade } from 'svelte/transition'; // Importar las transiciones
  import { vistaActual, menuAbierto } from '$lib/stores';
</script>

{#if $menuAbierto}
  <div class="overlay" on:click={() => $menuAbierto = false} transition:fade={{ duration: 200 }}></div>
  
  <nav class="sidebar" transition:fly={{ x: -280, duration: 300 }}>
    <div class="sidebar-header">
      <h2>Menú</h2>
      <button class="btn-cerrar" on:click={() => $menuAbierto = false}>×</button>
    </div>

    <div class="menu-items">
      <button class:active={$vistaActual === 'inicio'} on:click={() => { $vistaActual = 'inicio'; $menuAbierto = false; }}>
        <img class="icono-sidebar" src="/icons/inicio.svg" alt="Inicio" />
        <span>Inicio</span>
      </button>
      
      <button class:active={$vistaActual === 'circuito'} on:click={() => { $vistaActual = 'circuito'; $menuAbierto = false; }}>
        <img class="icono-sidebar" src="/icons/circuitos.svg" alt="Circuito" />
        <span>Circuito</span>
      </button>
      
      <button class:active={$vistaActual === 'congregaciones'} on:click={() => { $vistaActual = 'congregaciones'; $menuAbierto = false; }}>
        <img class="icono-sidebar" src="/icons/congregaciones.svg" alt="Congregaciones" />
        <span>Congregaciones</span>
      </button>

      <button class:active={$vistaActual === 'visitas'} on:click={() => { $vistaActual = 'visitas'; $menuAbierto = false; }}>
        <img class="icono-sidebar" src="/icons/visitas.svg" alt="Visitas" />
        <span>Visitas</span>
      </button>

      <button class:active={$vistaActual === 'registros'} on:click={() => { $vistaActual = 'registros'; $menuAbierto = false; }}>
        <img class="icono-sidebar" src="/icons/registros.svg" alt="Registros" />
        <span>Registros</span>
      </button>

      <div class="separador"></div>

      <button class:active={$vistaActual === 'configuracion'} on:click={() => { $vistaActual = 'configuracion'; $menuAbierto = false; }}>
        <img class="icono-sidebar" src="/icons/configuracion.svg" alt="Configuración" />
        <span>Configuración</span>
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
    box-shadow: 5px 0 15px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.4);
    z-index: 999;
  }

  .sidebar-header {
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
  }

  .btn-cerrar {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #999;
  }

  .menu-items {
    display: flex;
    flex-direction: column;
    padding: 10px 0;
  }

  .menu-items button {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px 20px;
    border: none;
    background: none;
    text-align: left;
    font-size: 1rem;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
  }

  /* Efecto activo igual que en tu BottomNav */
  .menu-items button.active {
    background-color: #fff5f5; /* Un tono suave del color de tu marca */
    color: #b63a3a;
    font-weight: bold;
    border-left: 4px solid #b63a3a;
  }

  .icono-sidebar {
    width: 22px;
    height: 22px;
    opacity: 0.6;
  }

  .active .icono-sidebar {
    opacity: 1;
    /* Aplicamos el mismo filtro de color que usas abajo */
    filter: invert(31%) sepia(54%) saturate(1450%) hue-rotate(338deg) brightness(85%) contrast(92%);
  }

  .separador {
    height: 1px;
    background: #eee;
    margin: 15px 20px;
  }
</style>