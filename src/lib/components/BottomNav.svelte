<script lang="ts">
  import { vistaActual } from '$lib/stores';
</script>


<nav class="barra-inferior">
  <button class:activo={$vistaActual === 'inicio'} on:click={() => $vistaActual = 'inicio'}>
    <img class="icono-nav" src="/icons/inicio.svg" alt="Inicio" />
    <span class="texto">Inicio</span>
  </button>

  <button class:activo={$vistaActual === 'circuito'} on:click={() => $vistaActual = 'circuito'}>
    <img class="icono-nav" src="/icons/circuitos.svg" alt="Circuito" />
    <span class="texto">Circuito</span>
  </button>

  <button class:activo={$vistaActual === 'congregaciones'} on:click={() => $vistaActual = 'congregaciones'}>
    <img class="icono-nav" src="/icons/congregaciones.svg" alt="Congregaciones" />
    <span class="texto">Congregaciones</span>
  </button>

  <button class:activo={$vistaActual === 'visitas'} on:click={() => $vistaActual = 'visitas'}>
    <img class="icono-nav" src="/icons/visitas.svg" alt="Visitas" />
    <span class="texto">Visitas</span>
  </button>

  <button class:activo={$vistaActual === 'registros'} on:click={() => $vistaActual = 'registros'}>
    <img class="icono-nav" src="/icons/registros.svg" alt="Registros" />
    <span class="texto">Registros</span>
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
    color: #666;
    cursor: pointer;
    padding: 5px;
  }  

  .barra-inferior button.activo {
    color: #b63a3a; /* El color de tu marca */
  }

  .icono-nav {
    width: 24px;
    height: 24px;
    opacity: 0.6;
  }

  .activo .icono-nav {
    opacity: 1;
    filter: invert(31%) sepia(54%) saturate(1450%) hue-rotate(338deg) brightness(85%) contrast(92%);
  }

  .texto {
    font-size: 0.75rem;
  }
</style>

