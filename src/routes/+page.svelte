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

  <!-- PARTE BLANCA -->
  <div class="header-top">

    <button
      class="menu-toggle"
      on:click={() => menuAbierto = !menuAbierto}
    >
      ☰
    </button>

    <div class="header-logo">
      <div class="logo-text">AV</div>
    </div>

    <div class="header-info">
      <h1>Asistente de Visitas</h1>
      <p>Organiza y controla todas tus visitas</p>
    </div>

  </div>

  <!-- FRANJA GRIS -->
  <div class="header-bottom"></div>

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
/* =========================
   ESTILOS GENERALES
   ========================= */

main {
  padding-bottom: 60px;
}

header {
  font-family: "Segoe UI", Roboto, Arial, sans-serif;
}

button {
  cursor: pointer;
}

/* =========================
   HEADER
   ========================= */

header.header {
  position: relative;
  width: 100vw;              /* ← pantalla completa REAL */
  margin-left: calc(50% - 50vw); /* ← rompe el contenedor */
  margin-right: calc(50% - 50vw);
  height: 120px;
}
/* FRANJA SUPERIOR BLANCA */
.header-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 12px 88px; /* espacio para el bloque rojo */
  background: #ffffff;
  height: 72px;                /* ⬅️ ALTURA FIJA */
  box-sizing: border-box;
}
/* TEXTO */
 .header-top {
  display: flex;
  align-items: flex-start; /* 👈 CLAVE */
  gap: 14px;
  padding: 12px 16px;
  background: #fff;
}
.header-info {
  display: flex;
  flex-direction: column;
  margin-left: 88px; /* ⬅️ espacio reservado para el logo */
}
.header-info h1 {
  margin: 0;
  font-size: 1.4rem;
}

.header-info p {
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: #666;
}
/* FRANJA INFERIOR GRIS */
.header-bottom {
  height: 48px;
  background: #3f3f3f;
  margin-top: 0;           /* ⬅️ asegúrate */
  position: relative;
  z-index: 1;
}
/* =========================
   CUADRO ROJO (LOGO)
   ========================= */

.header-logo {
  position: absolute;
  left: 0;
  top: 0;

  width: 90px;
  height: 96px;           /* ⬅️ baja dentro de la franja gris */

  background: #b63a3a;

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 10;
}
/* LOGO INTERNO */
.logo-text {
  color: white;
  font-weight: 400;        /* ⬅️ más grueso (clave) */
  font-size: 46px;         /* puedes subir/bajar 1–2px si quieres */
  letter-spacing: 0.6px;  /* ⬅️ hace el AV más “ancho” visualmente */
  line-height: 1.15;
}
/* =========================
   ACCIONES
   ========================= */

.acciones {
  margin: 16px 0;
  display: flex;
  gap: 8px;
}

.acciones button {
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #cfc6f3;
  background: white;
}

.acciones button.activo {
  background: #ede9fb;
  border-color: #8b7fd6;
  font-weight: 600;
}

/* =========================
   BARRA INFERIOR
   ========================= */

.barra-inferior {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px 0;
  background: #ede7f6;
  border-top: 1px solid #d1c4e9;
}

.barra-inferior button {
  flex: 1;
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
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

/* =========================
   SIDEBAR
   ========================= */

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100vh;
  background: #e6e6e6;
  z-index: 10;
  padding: 1rem;
  transition: transform 0.25s ease;
}

.sidebar.cerrado {
  transform: translateX(-100%);
}

.sidebar.abierto {
  transform: translateX(0);
}

.menu-toggle {
  position: fixed;
  top: 2px;        /* ⬅️ antes estaba más abajo */
  left: 12px;
  z-index: 20;
  background: none;
  border: none;
  font-size: 22px;
}
</style>


