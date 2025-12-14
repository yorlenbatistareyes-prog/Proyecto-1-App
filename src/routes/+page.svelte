<script lang="ts">
  import Panel from '../lib/components/Panel.svelte';

  let seccion: 'registros' | 'pendientes' = 'registros';
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
}

function verPendientes() {
  seccion = 'pendientes';
}


  function abrirAsunto(asunto: any) {
  asuntoSeleccionado = asunto;
}

let menuAbierto = false;
</script>

<header class="header">
  <button
    class="menu-toggle"
    on:click={() => menuAbierto = !menuAbierto}
  >
    ☰
  </button>

  <img src="/icons/maleta.png" alt="Logo" class="logo" />

  <div class="header-text">
    <h1>Asistente de Visitas</h1>
    <p class="description">
      Organiza y controla todas tus visitas
    </p>
  </div>
</header>

<main>

  <div class="acciones">
  <button
    class:activo={seccion === 'registros'}
    on:click={verRegistros}
  >
    Registros recientes
  </button>

  <button
    class:activo={seccion === 'pendientes'}
    on:click={verPendientes}
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

<aside class="sidebar {menuAbierto ? 'abierto' : 'cerrado'}">
  <h2>Menú</h2>
  <ul>
    <li>Inicio</li>
    <li>Registros</li>
    <li>Pendientes</li>
    <li>Configuración</li>
  </ul>
</aside>

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

.description {
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

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #eee9f7;
  border-bottom: 1px solid #d6cfee;
}

.logo {
  height: 48px;
  width: 48px;
  object-fit: contain;

  padding: 8px;
  border-radius: 12px;

  background: #f1ecfb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);

  filter: brightness(1.1) contrast(1.1);
}
.header-text h1 {
  margin: 0;
  font-size: 1.2rem;
}

.header-text .description {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.8;
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

.header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.header h1 {
  margin: 0;
  font-size: 1.2rem;
}
.logo {
  height: 40px;
  width: 40px;
  object-fit: contain;
  border-radius: 6px;
}

.acciones button {
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #cfc6f3;
  background: white;
  cursor: pointer;
}

.acciones button.activo {
  background: #ede9fb;
  border-color: #8b7fd6;
  font-weight: 600;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100vh;
  background: #e6e6e6;
  z-index: 10;
}

.sidebar h2 {
  margin-top: 0;
  font-size: 1rem;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0 0;
}

.sidebar li {
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.sidebar li:hover {
  background: #e6e0fa;
}

.sidebar.cerrado {
  transform: translateX(-100%);
}

.sidebar.abierto {
  transform: translateX(0);
}

.sidebar {
  transition: transform 0.25s ease;
}

.menu-toggle {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 20;
  background: transparent;
  border: none;
  font-size: 22px;
  cursor: pointer;
}

</style>


