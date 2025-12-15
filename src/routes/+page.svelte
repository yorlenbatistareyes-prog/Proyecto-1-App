<script lang="ts">
  import Panel from '../lib/components/Panel.svelte';

  /* ======================
     VISTAS PRINCIPALES
  ====================== */
  type Vista =
    | 'inicio'
    | 'circuito'
    | 'congregaciones'
    | 'visitas'
    | 'registros'
    | 'configuracion';

  let vistaActual: Vista = 'inicio';

  /* ======================
     INICIO
  ====================== */
  let seccion: 'registros' | 'pendientes' = 'registros';
  let asuntoSeleccionado: any = null;

  const visitasRecientes = [
    { fecha: '2025-12-09', congregacion: 'Congregación Norte' },
    { fecha: '2025-12-08', congregacion: 'Congregación Sur' },
    { fecha: '2025-12-07', congregacion: 'Congregación Este' },
    { fecha: '2025-12-06', congregacion: 'Congregación Oeste' },
    { fecha: '2025-12-05', congregacion: 'Congregación Central' }
  ];

  let asuntosPendientes = [
    { id: 1, texto: 'Visita pendiente a Congregación Norte' }
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

  /* ======================
     CIRCUITOS
  ====================== */

  type Circuito = {
    nombre: string;
    idioma: string;
    pais: string;
  };

  let creandoCircuito = false;

  let circuitos: Circuito[] = [
    {
      nombre: 'HG-06',
      idioma: 'S',
      pais: 'Cuba'
    }
  ];

  let nuevoCircuito: Circuito = {
    nombre: '',
    idioma: '',
    pais: ''
  };

  let indiceEditando: number | null = null;
  let errorFormulario = '';


  function guardarCircuito() {
  errorFormulario = '';

  if (!nuevoCircuito.nombre.trim()) {
    errorFormulario = 'El nombre del circuito es obligatorio';
    return;
  }

  if (indiceEditando === null) {
    // Crear
    circuitos = [...circuitos, { ...nuevoCircuito }];
  } else {
    // Editar
    circuitos[indiceEditando] = { ...nuevoCircuito };
    circuitos = [...circuitos];
  }

  cancelarEdicion();
}

  function cancelarEdicion() {
    creandoCircuito = false;
    indiceEditando = null;
    nuevoCircuito = {
      nombre: '',
      idioma: '',
      pais: ''
    };
  }

  function editarCircuito(circuito: Circuito, index: number) {
    creandoCircuito = true;
    indiceEditando = index;
    nuevoCircuito = { ...circuito };
  }
   /* ======================
     UI
  ====================== */
  let menuAbierto = false;

   let mostrarFormularioCongregacion = false;

  // estado del formulario
  let circuitoSeleccionado = '';
  let seccionCircuito = '';

  function cancelarFormulario() {
  mostrarFormularioCongregacion = false;
}

function guardarCongregacion() {
  const congregacion: Congregacion = {
    nombre: nombreCongregacion,
    numero: numeroCongregacion,
    ciudad,
    provincia,
    pais,
    idioma,
    circuito: circuitoSeleccionado,
    seccion: seccionCircuito,
    diaSemana,
    horaSemana,
    diaFin,
    horaFin
  };

  congregaciones = [...congregaciones, congregacion];

  // limpiar formulario
  nombreCongregacion = '';
  numeroCongregacion = '';
  ciudad = '';
  provincia = '';
  circuitoSeleccionado = '';
  seccionCircuito = '';
  diaSemana = '';
  horaSemana = '';
  diaFin = '';
  horaFin = '';

  mostrarFormularioCongregacion = false;
}

  type Congregacion = {
  circuito: string;
  seccion: string;
  nombre: string;
  numero: string;
  ciudad: string;
  provincia: string;
  pais: string;
  idioma: string;
  diaSemana: string;
  horaSemana: string;
  diaFin: string;
  horaFin: string;
};

let congregaciones: Congregacion[] = [];

let nombreCongregacion = '';
let numeroCongregacion = '';
let ciudad = '';
let provincia = '';
let pais = 'Cuba';
let idioma = 'S';

let diaSemana = '';
let horaSemana = '';

let diaFin = '';
let horaFin = '';

</script>

<header class="header">

  <!-- PARTE BLANCA -->
  <div class="header-top">
    <button class="menu-toggle" on:click={() => menuAbierto = !menuAbierto}>
      ☰
    </button>
    <div class="header-logo">
      <div class="logo-text">AV</div>
    </div>
    <div class="header-info">
      <h1>Asistente de Visitas</h1>
      <p>Documenta todas tus visitas</p>
    </div>
    <!-- Botón de Configuración ajustado -->
    <button
  class="config-button"
  on:click={() => vistaActual = 'configuracion'}
>
  <img class="icono" src="/icons/configuracion.svg" alt="Configuración" />
</button>
  </div>

  <!-- FRANJA GRIS -->
  <div class="header-bottom"></div>

</header>

<main>

  {#if vistaActual === 'inicio'}

    <div class="acciones">
      <button
        class:activo={seccion === 'registros'}
        on:click={verRegistros}
      >
        Visitas recientes
      </button>

      <button
        class:activo={seccion === 'pendientes'}
        on:click={verPendientes}
      >
        Asuntos pendientes
      </button>
    </div>

    {#if seccion === 'registros'}
      <Panel titulo="Visitas recientes">
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

  {/if}

  {#if vistaActual === 'circuito' && !creandoCircuito}

  <Panel titulo="Circuitos">

    <!-- CABECERA + BOTÓN -->
    <div class="circuitos-header">
      <button
        class="btn-primario"
        on:click={() => {
          creandoCircuito = true;
          indiceEditando = null;
          nuevoCircuito = { nombre: '', idioma: '', pais: '' };
        }}
      >
        Nuevo circuito
      </button>
    </div>

    <!-- TABLA -->
    <table class="tabla-circuitos">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Idioma</th>
          <th>País</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        {#each circuitos as circuito, index}
          <tr>
            <td>{circuito.nombre}</td>
            <td>{circuito.idioma}</td>
            <td>{circuito.pais}</td>
            <td>
              <button
                class="btn-secundario"
                on:click={() => editarCircuito(circuito, index)}
              >
                Editar
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

  </Panel>

{/if}

{#if vistaActual === 'circuito' && creandoCircuito}

  <Panel titulo={indiceEditando === null ? 'Nuevo circuito' : 'Editar circuito'}>

    <form class="form-grande" on:submit|preventDefault={guardarCircuito}>

      <div class="campo">
        <label>Nombre del circuito</label>
        <input
          type="text"
          bind:value={nuevoCircuito.nombre}
          placeholder="Ej: HG-06"
        />
      </div>

      <div class="campo">
        <label>Idioma</label>
        <input
          type="text"
          bind:value={nuevoCircuito.idioma}
          placeholder="Ej: S"
        />
      </div>

      <div class="campo">
        <label>País</label>
        <input
          type="text"
          bind:value={nuevoCircuito.pais}
          placeholder="Ej: Cuba"
        />
      </div>

      <div class="acciones-inferiores">
        <button
          type="button"
          class="btn-secundario"
          on:click={cancelarEdicion}
        >
          Cancelar
        </button>

        <button type="submit" class="btn-primario">
          {indiceEditando === null ? 'Guardar' : 'Guardar cambios'}
        </button>
      </div>

    </form>

  </Panel>

{/if}


  {#if vistaActual === 'congregaciones'}
  <Panel titulo="Congregaciones">

    <div class="header-congregaciones">
      <button
        class="btn-primario"
        on:click={() => mostrarFormularioCongregacion = true}
      >
        ➕ Nueva congregación
      </button>
    </div>


{#if mostrarFormularioCongregacion}
  <div class="formulario-congregacion">
    <h3>Nueva congregación</h3>

    <!-- DATOS BÁSICOS -->
    <div class="fila">
      <div class="campo">
        <label>Nombre de congregación *</label>
        <input
          type="text"
          placeholder="Ej: AEROPUERTO - HOLGUÍN"
          bind:value={nombreCongregacion}
        />
      </div>

      <div class="campo">
        <label>Número de congregación</label>
        <input
          type="text"
          placeholder="Ej: 15636"
          bind:value={numeroCongregacion}
        />
      </div>
    </div>

    <div class="fila">
      <div class="campo">
        <label>Ciudad *</label>
        <input
          type="text"
          placeholder="Ej: HOLGUÍN"
          bind:value={ciudad}
        />
      </div>

      <div class="campo">
        <label>Provincia / Estado</label>
        <input
          type="text"
          placeholder="Ej: HG"
          bind:value={provincia}
        />
      </div>
    </div>

    <!-- REUNIÓN ENTRE SEMANA -->
    <div class="fila">
      <div class="campo">
        <label>Reunión entre semana (día)</label>
        <select bind:value={diaSemana}>
          <option value="">Seleccione el día</option>
          <option value="Lunes">Lunes</option>
          <option value="Martes">Martes</option>
          <option value="Miércoles">Miércoles</option>
          <option value="Jueves">Jueves</option>
          <option value="Viernes">Viernes</option>
        </select>
      </div>

      <div class="campo">
        <label>Hora</label>
        <input type="time" bind:value={horaSemana} />
      </div>
    </div>

    <!-- REUNIÓN FIN DE SEMANA -->
    <div class="fila">
      <div class="campo">
        <label>Reunión fin de semana (día)</label>
        <select bind:value={diaFin}>
          <option value="">Seleccione el día</option>
          <option value="Sábado">Sábado</option>
          <option value="Domingo">Domingo</option>
        </select>
      </div>

      <div class="campo">
        <label>Hora</label>
        <input type="time" bind:value={horaFin} />
      </div>
    </div>

    <!-- ACCIONES -->
    <div class="acciones-formulario">
      <button class="btn-secundario" on:click={cancelarFormulario}>
        Cancelar
      </button>

      <button class="btn-primario" on:click={guardarCongregacion}>
        Guardar
      </button>
    </div>
  </div>
{/if}

{#if !mostrarFormularioCongregacion && congregaciones.length === 0}
  <p class="texto-vacio">
    Aún no hay congregaciones registradas.
  </p>
{/if}

{#if !mostrarFormularioCongregacion && congregaciones.length > 0}
  <div class="lista-congregaciones">
    {#each congregaciones as c}
      <div class="item-congregacion">
        <strong>{c.nombre}</strong>

        <p class="sub">
      Nº {c.numero} · {c.ciudad}, {c.provincia}
    </p>

    <p>
      Circuito {c.circuito} – Sección {c.seccion}
    </p>

    <p>
      Reunión entre semana: {c.diaSemana} – {c.horaSemana}
    </p>

    <p>
      Reunión fin de semana: {c.diaFin} – {c.horaFin}
    </p>
  </div>
{/each}
  </div>
{/if}

<style>
  .item-congregacion {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    background: #fff;
    margin-bottom: 1rem;
  }

  .item-congregacion strong {
    font-size: 1.1rem;
  }

  .item-congregacion .sub {
    color: #666;
    font-size: 0.9rem;
    margin: 0.25rem 0 0.75rem;
  }
</style>

  </Panel>

{/if}

  {#if vistaActual === 'visitas'}
    <Panel titulo="Visitas">
      <p>Vista de Visitas (en construcción)</p>
    </Panel>
  {/if}

  {#if vistaActual === 'registros'}
    <Panel titulo="Registros">
      <p>Vista de Registros (en construcción)</p>
    </Panel>
  {/if}

  {#if vistaActual === 'configuracion'}
    <Panel titulo="Configuración">
      <p>Ajustes de la aplicación</p>
    </Panel>
  {/if}

</main>

<nav class="barra-inferior">
  <button
    class:activo={vistaActual === 'inicio'}
    on:click={() => vistaActual = 'inicio'}
  >
    <img class="icono" src="/icons/inicio.svg" alt="Inicio" />
    <span class="texto">Inicio</span>
  </button>

  <button
    class:activo={vistaActual === 'circuito'}
    on:click={() => vistaActual = 'circuito'}
  >
    <img class="icono" src="/icons/circuitos.svg" alt="Circuito" />
    <span class="texto">Circuito</span>
  </button>

  <button
    class:activo={vistaActual === 'congregaciones'}
    on:click={() => vistaActual = 'congregaciones'}
  >
    <img class="icono" src="/icons/congregaciones.svg" alt="Congregaciones" />
    <span class="texto">Congregaciones</span>
  </button>

  <button
    class:activo={vistaActual === 'visitas'}
    on:click={() => vistaActual = 'visitas'}
  >
    <img class="icono" src="/icons/visitas.svg" alt="Visitas" />
    <span class="texto">Visitas</span>
  </button>

  <button
    class:activo={vistaActual === 'registros'}
    on:click={() => vistaActual = 'registros'}
  >
    <img class="icono" src="/icons/registros.svg" alt="Registros" />
    <span class="texto">Registros</span>
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
   FUENTE GLOBAL
   ========================= */
:global(body) {
  font-family: "Segoe UI", Roboto, Arial, sans-serif;
}
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
  margin-left: 110px; /* Ajustar el margen para que el título quede a la derecha del logo */
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
  position: absolute;
  top: 14px;
  left: 90px;   /* ⬅️ CLAVE: se sale del logo */
  z-index: 20;
  background: none;
  border: none;
  font-size: 22px;
}

.icono {
  width: 34px; /* Tamaño estándar para el ícono */
  height: 34px;
  filter: grayscale(100%); /* Si quieres el efecto de escala de grises */
  opacity: 0.7; /* Ajuste de opacidad */
}
.config-button {
  background: none;
  border: none;
  position: absolute;
  right: 16px; /* Mantener el margen desde el borde */
  top: 30%; /* Centrado vertical en la franja blanca */
  transform: translateY(-50%);/* Asegura el centrado vertical */
}

.barra-inferior button.activo img {
  filter: none;
  opacity: 1;
}

.barra-inferior button.activo span {
  color: #5b4cc4;
  font-weight: 600;
}

.circuitos-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.btn-primario {
  background: #5b4cc4;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 500;
}

.btn-secundario {
  background: white;
  border: 1px solid #bbb;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.tabla-circuitos {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.tabla-circuitos th,
.tabla-circuitos td {
  padding: 8px;
  border-bottom: 1px solid #ddd;
  text-align: left;
}

.tabla-circuitos th {
  font-weight: 600;
  color: #444;
}

.form-grande {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.campo label {
  font-size: 0.9rem;
  color: #555;
}

.campo input,
.campo select {
  padding: 10px 8px;
  font-size: 0.95rem;
  border: none;
  border-bottom: 1px solid #bbb;
  background: transparent;
}

.campo small {
  font-size: 0.75rem;
  color: #777;
}

.acciones-inferiores {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 12px;
  border-top: 1px solid #ddd;
}

.header-congregaciones {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.texto-vacio {
  color: #666;
  font-style: italic;
}

</style>
