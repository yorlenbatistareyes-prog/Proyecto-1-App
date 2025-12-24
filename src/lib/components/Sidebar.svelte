<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { vistaActual, menuAbierto } from '$lib/stores';
  // Importamos todos los iconos necesarios
  import { 
    House, 
    Map, 
    UsersRound, 
    Briefcase, 
    FileText, 
    Settings, 
    X 
  } from 'lucide-svelte';

  const APP_VERSION = "1.0";
  const ULTIMA_ACTUALIZACION = "Diciembre 2025"; 

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
    transition:fade={{ duration: 200 }}
  ></div>
  
  <nav class="sidebar" transition:fly={{ x: -280, duration: 300 }}>
    <div class="sidebar-header">
      <h2>Menú</h2>
      <button 
        class="btn-cerrar" 
        onclick={() => $menuAbierto = false} 
        aria-label="Cerrar menú"
      >
        <X size={28} />
      </button>
    </div>

    <div class="menu-items">
      <button 
        class:active={$vistaActual === 'inicio'} 
        onclick={() => navegar('inicio')}
      >
        <House size={20} />
        <span>Inicio</span>
      </button>
      
      <button 
        class:active={$vistaActual === 'circuito'} 
        onclick={() => navegar('circuito')}
      >
        <Map size={20} />
        <span>Circuito</span>
      </button>
      
      <button 
        class:active={$vistaActual === 'congregaciones'} 
        onclick={() => navegar('congregaciones')}
      >
        <UsersRound size={20} />
        <span>Congregaciones</span>
      </button>

      <button 
        class:active={$vistaActual === 'visitas'} 
        onclick={() => navegar('visitas')}
      >
        <Briefcase size={20} />
        <span>Visitas</span>
      </button>

      <button 
        class:active={$vistaActual === 'informes'} 
        onclick={() => navegar('informes')}
      >
        <FileText size={20} />
        <span>Informes</span>
      </button>

      <div class="separador"></div>

      <button 
        class:active={$vistaActual === 'configuracion'} 
        onclick={() => navegar('configuracion')}
      >
        <Settings size={20} />
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
    cursor: pointer;
    color: #bbb;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .btn-cerrar:hover {
    color: #b63a3a;
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

  /* Ya no necesitamos .icono-sidebar ni filtros complejos */
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