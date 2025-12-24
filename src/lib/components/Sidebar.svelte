<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { vistaActual, menuAbierto } from '$lib/stores';

  const APP_VERSION = "1.0";  // Cambia este número cuando hagas una actualización
  const ULTIMA_ACTUALIZACION = "Diciembre 2025"; 

  /**
   * Cambia la vista de la aplicación y cierra el panel lateral.
   * Usamos el tipo 'any' en el destino para evitar conflictos de tipado 
   * si el store espera un tipo de unión específico.
   */
  function navegar(destino: any) {
    $vistaActual = destino;
    $menuAbierto = false;
  }
</script>

{#if $menuAbierto}
  <div 
    class="overlay" 
    role="button"
    tabindex="-1"
    onclick={() => $menuAbierto = false} 
    onkeydown={(e) => e.key === 'Escape' && ($menuAbierto = false)}
    transition:fade={{ duration: 200 }}
  ></div>
  
  <nav class="sidebar" transition:fly={{ x: -280, duration: 300 }}>
    <div class="sidebar-header">
      <h2>Menú</h2>
      <button 
        class="btn-cerrar" 
        onclick={() => $menuAbierto = false} 
        aria-label="Cerrar menú"
      >×</button>
    </div>

    <div class="menu-items">
      <button 
        class:active={$vistaActual === 'inicio'} 
        onclick={() => navegar('inicio')}
      >
        <img class="icono-sidebar" src="/icons/inicio.svg" alt="" />
        <span>Inicio</span>
      </button>
      
      <button 
        class:active={$vistaActual === 'circuito'} 
        onclick={() => navegar('circuito')}
      >
        <img class="icono-sidebar" src="/icons/circuitos.svg" alt="" />
        <span>Circuito</span>
      </button>
      
      <button 
        class:active={$vistaActual === 'congregaciones'} 
        onclick={() => navegar('congregaciones')}
      >
        <img class="icono-sidebar" src="/icons/congregaciones.svg" alt="" />
        <span>Congregaciones</span>
      </button>

      <button 
        class:active={$vistaActual === 'visitas'} 
        onclick={() => navegar('visitas')}
      >
        <img class="icono-sidebar" src="/icons/visitas.svg" alt="" />
        <span>Visitas</span>
      </button>

      <button 
        class:active={$vistaActual === 'registros'} 
        onclick={() => navegar('registros')}
      >
        <img class="icono-sidebar" src="/icons/registros.svg" alt="" />
        <span>Registros</span>
      </button>

      <div class="separador"></div>

      <button 
        class:active={$vistaActual === 'configuracion'} 
        onclick={() => navegar('configuracion')}
      >
        <img class="icono-sidebar" src="/icons/configuracion.svg" alt="" />
        <span>Configuración</span>
      </button>
    </div>

    <div class="sidebar-footer">
      <p>v{APP_VERSION}</p>
      <small style="opacity: 0.6; font-size: 0.7rem;">Actualizado: {ULTIMA_ACTUALIZACION}</small>
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
    background-color: #fcfcfc;
    border-bottom: 1px solid #eee;
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: 1.1rem;
    color: #b63a3a;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-cerrar {
    background: none;
    border: none;
    font-size: 32px;
    cursor: pointer;
    color: #bbb;
    line-height: 1;
  }

  .menu-items {
    display: flex;
    flex-direction: column;
    padding: 10px 0;
    flex: 1;
  }

  .menu-items button {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 14px 20px;
    border: none;
    background: none;
    text-align: left;
    font-size: 0.95rem;
    color: #555;
    cursor: pointer;
    transition: all 0.2s ease;
    border-left: 4px solid transparent;
  }

  .menu-items button:hover {
    background-color: #f9f9f9;
    color: #b63a3a;
  }

  .menu-items button.active {
    background-color: #fff5f5;
    color: #b63a3a;
    font-weight: 600;
    border-left: 4px solid #b63a3a;
  }

  .icono-sidebar {
    width: 20px;
    height: 20px;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .active .icono-sidebar {
    opacity: 1;
    filter: invert(31%) sepia(54%) saturate(1450%) hue-rotate(338deg) brightness(85%) contrast(92%);
  }

  .separador {
    height: 1px;
    background: #eee;
    margin: 10px 20px;
  }

  .sidebar-footer {
    padding: 15px 20px;
    border-top: 1px solid #eee;
    font-size: 0.75rem;
    color: #aaa;
    text-align: center;
  }
</style>