<script lang="ts">
  import { menuAbierto, vistaActual } from '$lib/stores';
  // Importación de los iconos
  import { Menu, Settings } from 'lucide-svelte';

  // Manejador de eventos
  function handleMenuClick(e: Event) {
    e.stopPropagation();
    // En Svelte 5 los stores se siguen usando con $
    $menuAbierto = true;
  }
</script>

<header class="header">
  <div class="header-top">
    <button class="menu-toggle" onclick={handleMenuClick} aria-label="Abrir menú">
      <Menu size={28} strokeWidth={2} />
    </button>

    <div class="header-logo">
      <div class="logo-text">AV</div>
    </div>

    <div class="header-info">
      <h1>Asistente de Visitas</h1>
      <p>Documenta todas tus visitas</p>
    </div>

    <div class="spacer"></div>

    <button class="config-button" onclick={() => ($vistaActual = 'configuracion')} aria-label="Configuración">
      <Settings size={24} color="#666" strokeWidth={1.5} />
    </button>
  </div>

  <div class="barra-oscura-inferior"></div>
</header>

<style>
  .header { 
    width: 100%; 
    position: relative; 
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  .header-top { 
    display: flex; 
    align-items: center; 
    background: #ffffff; 
    height: 72px; 
    padding: 0 20px 0 160px; 
    box-sizing: border-box;
    width: 100%;
    position: relative;
  }

  .barra-oscura-inferior {
    background-color: #333333;
    height: 48px;
    width: 100%;
  }

  .header-logo { 
    position: absolute; 
    left: 0; 
    top: 0; 
    width: 90px; 
    height: 96px; 
    background: #b63a3a; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    z-index: 10; 
  }

  .logo-text { 
    color: white; 
    font-size: 46px; 
    font-weight: bold; 
  }

  .header-info h1 {
    margin: 0;
    font-size: 1.3rem;
    color: #333;
    font-weight: bold;
  }

  .header-info p {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
  }

  .menu-toggle, .config-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    transition: opacity 0.2s;
  }

  .menu-toggle:hover, .config-button:hover {
    opacity: 0.7;
  }

  .menu-toggle { 
    position: absolute; 
    left: 105px; 
    top: 22px; 
    z-index: 20; 
  }

  .spacer { flex: 1; }

  @media (max-width: 600px) {
    .header-top { padding: 0 10px 0 115px; }
    .header-logo { width: 75px; }
    .logo-text { font-size: 35px; }
    .menu-toggle { left: 82px; top: 24px; }
    .header-info h1 { font-size: 1rem; }
    .header-info p { font-size: 0.7rem; white-space: nowrap; }
  }
</style>