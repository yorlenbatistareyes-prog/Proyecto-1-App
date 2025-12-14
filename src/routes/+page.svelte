<script lang="ts">
  import Panel from '../lib/components/Panel.svelte';

  let seccion = 'registros';
  let asuntoSeleccionado = null;

  const visitasRecientes = [
    { fecha: '2025-12-09', congregacion: 'Congregación Norte' },
    { fecha: '2025-12-08', congregacion: 'Congregación Sur' },
    { fecha: '2025-12-07', congregacion: 'Congregación Este' },
    { fecha: '2025-12-06', congregacion: 'Congregación Oeste' },
    { fecha: '2025-12-05', congregacion: 'Congregación Central' }
  ];

  let asuntosPendientes = [
    { id: 1, texto: 'Visita pendiente a Congregación Norte' },
  ];

   function verRegistros() {
    seccion = 'registros';
    asuntoSeleccionado = null;
  }

  function verPendientes() {
    seccion = 'pendientes';
    asuntoSeleccionado = null;
  }

  function abrirAsunto(asunto: any) {
  asuntoSeleccionado = asunto;
}
</script>

<header>
  <h1>Asistente de Visitas</h1>

  <p class="descripcion">
    Organiza y controla todas tus visitas
  </p>
</header>

<main>

  <div class="acciones">
    <button
      on:click={verRegistros}
      class:activo={seccion === 'registros'}
      disabled={seccion === 'registros'}
    >
      Registros recientes
    </button>

    <button
      on:click={verPendientes}
      class:activo={seccion === 'pendientes'}
      disabled={seccion === 'pendientes'}
    >
      Asuntos pendientes
    </button>
  </div>

  {#if seccion === 'registros'}
  <Panel titulo="Registros recientes">
    <ul>
      {#each visitasRecientes as visita}
        <li>
          <strong>Fecha:</strong> {visita.fecha} —
          <strong>Congregación:</strong> {visita.congregacion}
        </li>
      {/each}
    </ul>
  </Panel>
{/if}

{#if seccion === 'pendientes'}
  <Panel titulo="Asuntos pendientes">
    <ul>
      {#each asuntosPendientes as asunto}
        <li>
          <button on:click={() => abrirAsunto(asunto)}>
            {asunto.texto}
          </button>
        </li>
      {/each}
    </ul>
  </Panel>
{/if}

</main>

<nav class="barra-inferior">
  <button class="activo">
    <img class="icono" src="/icons/inicio.svg" alt="Inicio" />
    <span class="texto">Inicio</span>
  </button>

  <button>
    <img class="icono" src="/icons/circuitos.svg" alt="Circuito" />
    <span class="texto">Circuito</span>
  </button>

  <button>
    <img class="icono" src="/icons/congregaciones.svg" alt="Congregaciones" />
    <span class="texto">Congregaciones</span>
  </button>

  <button>
    <img class="icono" src="/icons/visitas.svg" alt="Visitas" />
    <span class="texto">Visitas</span>
  </button>

  <button>
    <img class="icono" src="/icons/registros.svg" alt="Registros" />
    <span class="texto">Registros</span>
  </button>

  <button>
    <img class="icono" src="/icons/configuracion.svg" alt="Configuración" />
    <span class="texto">Configuración</span>
  </button>
</nav>

<style>
main {
  padding-bottom: 60px;
}

header {
  background: #ede7f6;
  padding: 12px;
  border-bottom: 1px solid #d1c4e9;
}

header h1 {
  color: #6b5fb5;
  margin: 0;
  font-size: 1.2rem;
}

.descripcion {
    margin: 12px 0 16px;
    color: #555;
    font-size: 0.95rem;
  }

  .acciones {
  margin-top: 16px;
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.barra-inferior {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px 0;
  background: #ede7f6;      /* 👈 nuevo color */
  border-top: 1px solid #d1c4e9;
}

.barra-inferior button {
  flex: 1;
  background: none;
  border: none;
  padding: 6px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.barra-inferior img { 
  width: 24px;
  height: 24px;
  filter: grayscale(100%);
  opacity: 0.7;
}

.barra-inferior span {
  font-size: 12px;
  color: #666;
}
button {
  margin-right: 8px;
}

.activo {
  background-color: #cce5ff;
  border: 2px solid #004085;
  font-weight: bold;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.barra-inferior button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.barra-inferior .icono {
  width: 24px;
  height: 24px;
}

.barra-inferior .texto {
  font-size: 0.7rem;
}

</style>


