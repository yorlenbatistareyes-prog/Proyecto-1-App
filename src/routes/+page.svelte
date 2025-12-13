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

<main>
  <h1>Asistente de Visitas</h1>
  <p>Organiza y controla todas tus visitas</p>

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

<style>
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
  pointer-events: none;
}
</style>


