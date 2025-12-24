<script lang="ts">
  import { vistaActual } from '$lib/stores';
  // Importamos los iconos de Lucide
  import { House, Map, UsersRound, Briefcase, FileText } from 'lucide-svelte';
</script>

<nav class="barra-inferior">
  <button class:activo={$vistaActual === 'inicio'} onclick={() => $vistaActual = 'inicio'}>
    <House size={24} strokeWidth={$vistaActual === 'inicio' ? 2.5 : 2} />
    <span class="texto">Inicio</span>
  </button>

  <button class:activo={$vistaActual === 'circuito'} onclick={() => $vistaActual = 'circuito'}>
    <Map size={24} strokeWidth={$vistaActual === 'circuito' ? 2.5 : 2} />
    <span class="texto">Circuito</span>
  </button>

  <button class:activo={$vistaActual === 'congregaciones'} onclick={() => $vistaActual = 'congregaciones'}>
    <UsersRound size={24} strokeWidth={$vistaActual === 'congregaciones' ? 2.5 : 2} />
    <span class="texto">Congregaciones</span>
  </button>

  <button class:activo={$vistaActual === 'visitas'} onclick={() => $vistaActual = 'visitas'}>
    <Briefcase size={24} strokeWidth={$vistaActual === 'visitas' ? 2.5 : 2} />
    <span class="texto">Visitas</span>
  </button>

  <button class:activo={$vistaActual === 'informes'} onclick={() => $vistaActual = 'informes'}>
    <FileText size={24} strokeWidth={$vistaActual === 'informes' ? 2.5 : 2} />
    <span class="texto">Informes</span>
  </button>
</nav>

<style>
  .barra-inferior {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 65px;
    background: white;
    display: flex;
    justify-content: space-around;
    align-items: center;
    border-top: 1px solid #eee;
    z-index: 100;
  }

  .barra-inferior button {
    background: none;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #666; /* Color gris por defecto para icono y texto */
    cursor: pointer;
    padding: 5px;
    transition: color 0.2s ease;
  }  

  .barra-inferior button.activo {
    color: #b63a3a; /* Color rojo de tu marca aplicado a todo el botón */
  }

  .texto {
    font-size: 0.75rem;
    font-weight: 500;
  }
</style>