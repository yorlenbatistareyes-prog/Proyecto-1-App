<script lang="ts">
  import { onMount } from 'svelte';
  import Panel from '../lib/components/Panel.svelte';

  /* ======================
     TIPOS Y ESTADOS
  ====================== */
  type Vista = 'inicio' | 'circuito' | 'congregaciones' | 'visitas' | 'registros' | 'configuracion';

  interface Circuito {
    nombre: string;
    idioma: string;
    pais: string;
  }

  interface Congregacion {
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
  }

  let vistaActual: Vista = 'inicio';
  let menuAbierto = false;

  /* LÓGICA: INICIO */
  let seccionInicio: 'registros' | 'pendientes' = 'registros';
  const visitasRecientes = [
    { fecha: '2025-12-09', congregacion: 'Congregación Norte' },
    { fecha: '2025-12-08', congregacion: 'Congregación Sur' }
  ];
  let asuntosPendientes = [{ id: 1, texto: 'Visita pendiente a Congregación Norte' }];

  /* LÓGICA: CIRCUITOS */
  let circuitos: Circuito[] = [{ nombre: 'HG-06', idioma: 'S', pais: 'Cuba' }];
  let creandoCircuito = false;
  let indiceCircuitoEditando: number | null = null;
  let nuevoCircuito: Circuito = { nombre: '', idioma: 'S', pais: 'Cuba' };

  function prepararNuevoCircuito() {
    nuevoCircuito = { nombre: '', idioma: 'S', pais: 'Cuba' };
    indiceCircuitoEditando = null;
    creandoCircuito = true;
  }

  function editarCircuito(c: Circuito, index: number) {
    nuevoCircuito = { ...c };
    indiceCircuitoEditando = index;
    creandoCircuito = true;
  }

  function guardarCircuito() {
    if (!nuevoCircuito.nombre.trim()) return alert('El nombre es obligatorio');
    if (indiceCircuitoEditando === null) {
      circuitos = [...circuitos, { ...nuevoCircuito }];
    } else {
      circuitos[indiceCircuitoEditando] = { ...nuevoCircuito };
      circuitos = [...circuitos];
    }
    creandoCircuito = false;
  }

  function eliminarCircuito(index: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este circuito? Se borrará permanentemente.')) {
      // 1. Filtramos el array de circuitos
      circuitos = circuitos.filter((_, i) => i !== index);
      
      // 2. Opcional: Podrías guardar en localStorage si decides persistir circuitos también
      // localStorage.setItem('circuitos', JSON.stringify(circuitos));
    }
  }

  /* LÓGICA: CONGREGACIONES */
  let congregaciones: Congregacion[] = [];
  let mostrarFormularioCongregacion = false;
  let indiceCongregacionEditando: number | null = null;
  
  const moldeCongregacion: Congregacion = {
    circuito: '', seccion: '', nombre: '', numero: '',
    ciudad: '', provincia: '', pais: 'Cuba', idioma: 'S',
    diaSemana: '', horaSemana: '', diaFin: '', horaFin: ''
  };
  
  let nuevaCongregacion: Congregacion = { ...moldeCongregacion };

  let textoBusqueda = ''; // Guardará lo que escribas en el buscador
  // Esta variable se actualizará sola cada vez que cambie 'textoBusqueda' o 'congregaciones'
  $: congregacionesFiltradas = congregaciones.filter(c => 
    c.nombre.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
    c.ciudad.toLowerCase().includes(textoBusqueda.toLowerCase())
  );

  onMount(() => {
    const guardadas = localStorage.getItem('congregaciones');
    if (guardadas) congregaciones = JSON.parse(guardadas);
  });

  function prepararNuevaCongregacion() {
    nuevaCongregacion = { ...moldeCongregacion };
    indiceCongregacionEditando = null;
    mostrarFormularioCongregacion = true;
  }

  function editarCongregacion(c: Congregacion, index: number) {
    nuevaCongregacion = { ...c };
    indiceCongregacionEditando = index;
    mostrarFormularioCongregacion = true;
  }

  function guardarCongregacion() {
    if (!nuevaCongregacion.circuito || !nuevaCongregacion.nombre) {
      alert('Complete los campos obligatorios (*)');
      return;
    }

    if (indiceCongregacionEditando === null) {
      congregaciones = [...congregaciones, { ...nuevaCongregacion }];
    } else {
      congregaciones[indiceCongregacionEditando] = { ...nuevaCongregacion };
      congregaciones = [...congregaciones];
    }
    localStorage.setItem('congregaciones', JSON.stringify(congregaciones));
    mostrarFormularioCongregacion = false;
  }

  function eliminarCongregacion(index: number) {
    if (confirm('¿Estás seguro de que deseas eliminar esta congregación?')) {
      congregaciones = congregaciones.filter((_, i) => i !== index);
      localStorage.setItem('congregaciones', JSON.stringify(congregaciones));
    }
  }
</script>

{#if menuAbierto}
  <div class="overlay" on:click={() => menuAbierto = false}></div>
  
  <nav class="sidebar">
    <div class="sidebar-header">
      <h2>Menú</h2>
      <button class="btn-cerrar" on:click={() => menuAbierto = false}>×</button>
    </div>

    <div class="menu-items">
      <button class:active={vistaActual === 'inicio'} on:click={() => { vistaActual = 'inicio'; menuAbierto = false; }}>
        <span>🏠</span> Inicio
      </button>
      
      <button class:active={vistaActual === 'circuito'} on:click={() => { vistaActual = 'circuito'; menuAbierto = false; }}>
        <span>🌐</span> Circuito
      </button>
      
      <button class:active={vistaActual === 'congregaciones'} on:click={() => { vistaActual = 'congregaciones'; menuAbierto = false; }}>
        <span>👥</span> Congregaciones
      </button>

      <div class="separador"></div>

      <button class:active={vistaActual === 'configuracion'} on:click={() => { vistaActual = 'configuracion'; menuAbierto = false; }}>
        <span>⚙️</span> Configuración
      </button>
    </div>
  </nav>
{/if}

<header class="header">
  <div class="header-top">
    <button class="menu-toggle" on:click|stopPropagation={() => menuAbierto = true}>
      ☰
    </button>

    <div class="header-logo">
      <div class="logo-text">AV</div>
    </div>

    <div class="header-info">
      <h1>Asistente de Visitas</h1>
      <p>Documenta todas tus visitas</p>
    </div>

    <div class="spacer"></div>

    <button class="config-button" on:click={() => vistaActual = 'configuracion'}>
      ⚙️
    </button>
  </div>
</header>

<main>
  {#if vistaActual === 'inicio'}
    <div class="acciones">
      <button class:activo={seccionInicio === 'registros'} on:click={() => seccionInicio = 'registros'}>
        Visitas recientes
      </button>
      <button class:activo={seccionInicio === 'pendientes'} on:click={() => seccionInicio = 'pendientes'}>
        Asuntos pendientes
      </button>
    </div>

    <Panel titulo={seccionInicio === 'registros' ? "Visitas recientes" : "Asuntos pendientes"}>
      <ul>
        {#if seccionInicio === 'registros'}
          {#each visitasRecientes as v}
            <li><strong>{v.fecha}:</strong> {v.congregacion}</li>
          {/each}
        {:else}
          {#each asuntosPendientes as a}
            <li>{a.texto}</li>
          {/each}
        {/if}
      </ul>
    </Panel>
  {/if}

  {#if vistaActual === 'circuito'}
    <Panel titulo={creandoCircuito ? "Datos del Circuito" : "Circuitos"}>
      {#if !creandoCircuito}
        <div class="flex-end"><button class="btn-primario" on:click={prepararNuevoCircuito}>Nuevo circuito</button></div>
        <table class="tabla">
          <thead><tr><th>Nombre</th><th>Idioma</th><th>País</th><th>Acciones</th></tr></thead>
          <tbody>
            {#each circuitos as c, i}
              <tr>
  <td>{c.nombre}</td>
  <td>{c.idioma}</td>
  <td>{c.pais}</td>
  <td>
    <div class="acciones-tabla">
      <button class="btn-secundario" on:click={() => editarCircuito(c, i)}>
        Editar
      </button>
      <button class="btn-eliminar" on:click={() => eliminarCircuito(i)}>
        Eliminar
      </button>
    </div>
  </td>
</tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <form class="form-grande" on:submit|preventDefault={guardarCircuito}>
          <div class="campo"><label>Nombre</label><input bind:value={nuevoCircuito.nombre} placeholder="HG-06" /></div>
          <div class="campo"><label>Idioma</label><input bind:value={nuevoCircuito.idioma} /></div>
          <div class="campo"><label>País</label><input bind:value={nuevoCircuito.pais} /></div>
          <div class="acciones-inferiores">
            <button type="button" class="btn-secundario" on:click={() => creandoCircuito = false}>Cancelar</button>
            <button type="submit" class="btn-primario">Guardar</button>
          </div>
        </form>
      {/if}
    </Panel>
  {/if}

  {#if vistaActual === 'congregaciones'}
  <Panel titulo="Congregaciones">
    {#if !mostrarFormularioCongregacion}
      <div class="flex-end">
        <button class="btn-primario" on:click={prepararNuevaCongregacion}>➕ Nueva</button>
      </div>

      <div class="buscador-container">
        <input 
          type="text" 
          placeholder="Buscar congregación por nombre o ciudad..." 
          bind:value={textoBusqueda} 
          class="input-buscador"
        />
      </div>

      <div class="table-container">
        <table class="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Circuito</th>
              <th>Ciudad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each congregacionesFiltradas as c, i}
              <tr>
                <td>{c.nombre}</td>
                <td>{c.circuito}</td>
                <td>{c.ciudad}</td>
                <td>
                  <div class="acciones-tabla">
                    <button class="btn-secundario" on:click={() => editarCongregacion(c, i)}>
                      Editar
                    </button>
                    <button class="btn-eliminar" on:click={() => eliminarCongregacion(i)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      {/if}
  </Panel>
{/if}
  
  {#if vistaActual === 'configuracion'}
    <Panel titulo="Configuración">
      <p>Ajustes generales del asistente.</p>
    </Panel>
  {/if}
</main>

<nav class="barra-inferior">
  <button class:activo={vistaActual === 'inicio'} on:click={() => vistaActual = 'inicio'}>
    <img class="icono-nav" src="/icons/inicio.svg" alt="Inicio" />
    <span class="texto">Inicio</span>
  </button>

  <button class:activo={vistaActual === 'circuito'} on:click={() => vistaActual = 'circuito'}>
    <img class="icono-nav" src="/icons/circuitos.svg" alt="Circuito" />
    <span class="texto">Circuito</span>
  </button>

  <button class:activo={vistaActual === 'congregaciones'} on:click={() => vistaActual = 'congregaciones'}>
    <img class="icono-nav" src="/icons/congregaciones.svg" alt="Congregaciones" />
    <span class="texto">Congregaciones</span>
  </button>

  <button class:activo={vistaActual === 'visitas'} on:click={() => vistaActual = 'visitas'}>
    <img class="icono-nav" src="/icons/visitas.svg" alt="Visitas" />
    <span class="texto">Visitas</span>
  </button>

  <button class:activo={vistaActual === 'registros'} on:click={() => vistaActual = 'registros'}>
    <img class="icono-nav" src="/icons/registros.svg" alt="Registros" />
    <span class="texto">Registros</span>
  </button>
</nav>

<style>
  :global(body) { font-family: "Segoe UI", sans-serif; margin: 0; background-color: #f5f5f5; }
  main { padding: 15px; padding-bottom: 80px; }

  /* --- HEADER CORREGIDO --- */
  .header { height: 120px; width: 100%; position: relative; }
  
  .header-top { 
  display: flex; 
  align-items: center; 
  background: #ffffff; 
  height: 72px; 
  /* Aumentamos el padding izquierdo a 140px para dar aire después del botón menú */
  padding: 0 20px 0 140px; 
  box-sizing: border-box;
  width: 100%;
  position: relative;
}

.header-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* Eliminamos márgenes negativos o extraños si los hubiera */
  margin: 0; 
}

  .spacer { flex: 1; } /* Empuja la configuración a la derecha */

  .header-bottom { background: #3f3f3f; height: 48px; }

  .header-logo { 
    position: absolute; left: 0; top: 0; width: 90px; height: 96px; 
    background: #b63a3a; display: flex; align-items: center; justify-content: center; z-index: 10; 
  }
  .logo-text { color: white; font-size: 46px; font-weight: bold; }

  .header-info h1 {
  margin: 0;
  font-size: 1.3rem; /* Un poquito más grande para que destaque */
  line-height: 1.2;
}
  .header-info p {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

  /* El botón de menú se queda en su sitio, pero el texto ya no lo toca */
.menu-toggle { 
  position: absolute; 
  left: 100px; 
  top: 22px; 
  z-index: 20; 
  background: none; 
  border: none; 
  font-size: 26px; 
  cursor: pointer; 
}

  .config-button { background: none; border: none; padding: 8px; cursor: pointer; }
  .icono-config { width: 28px; height: 28px; }

  /* --- RESTO DE ESTILOS --- */
  .acciones { display: flex; gap: 10px; margin-bottom: 15px; }
  .acciones button { padding: 8px 15px; border-radius: 20px; border: 1px solid #ccc; background: white; }
  .acciones button.activo { background: #ede9fb; border-color: #5b4cc4; color: #5b4cc4; font-weight: bold; }
  
  .tabla { width: 100%; border-collapse: collapse; background: white; }
  .tabla th, .tabla td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
  .table-container { overflow-x: auto; }

  .btn-primario { background: #5b4cc4; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
  .btn-secundario { background: #f0f0f0; border: 1px solid #ccc; padding: 8px 15px; border-radius: 6px; cursor: pointer; }

  .campo { display: flex; flex-direction: column; margin-bottom: 15px; }
  .campo label { font-size: 0.8rem; color: #666; margin-bottom: 4px; }
  .campo input, .campo select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }

  .barra-inferior { position: fixed; bottom: 0; width: 100%; display: flex; background: #ede7f6; border-top: 1px solid #d1c4e9; padding: 5px 0; }
  .barra-inferior button { flex: 1; border: none; background: none; display: flex; flex-direction: column; align-items: center; }
  .icono-nav { width: 22px; height: 22px; opacity: 0.6; }
  .barra-inferior button.activo .icono-nav { opacity: 1; }
  .barra-inferior button.activo span { color: #5b4cc4; font-weight: bold; }
  .flex-end { display: flex; justify-content: flex-end; margin-bottom: 10px; }

  .acciones-tabla {
  display: flex;
  gap: 8px; /* Esto los separa horizontalmente */
}

.btn-eliminar {
  background: #fff5f5;
  color: #e53e3e;
  border: 1px solid #feb2b2;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-eliminar:hover {
  background: #e53e3e;
  color: white;
}

.buscador-container {
  margin-bottom: 15px;
  width: 100%;
}

.input-buscador {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
  background-color: white;
}

.input-buscador:focus {
  outline: none;
  border-color: #5b4cc4; /* Color morado de tu app */
  box-shadow: 0 0 0 3px rgba(91, 76, 196, 0.1);
}

/* Esto hace que el menú flote sobre todo lo demás */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh; /* Ocupa todo el alto de la pantalla */
  background-color: white;
  z-index: 1000; /* Número alto para que esté al frente */
  box-shadow: 5px 0 15px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

/* El fondo oscuro detrás del menú */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999; /* Justo debajo del sidebar */
}

/* --- ESTILOS PARA EL MENÚ LATERAL --- */
.menu-items {
  display: flex;
  flex-direction: column; /* Alineación vertical */
  padding: 10px 0;
  width: 100%;
}

.menu-items button {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%; 
  padding: 15px 20px;
  border: none;
  background: none;
  text-align: left;
  font-size: 1.1rem;
  color: #4a5568;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-items button:hover {
  background-color: #f7fafc;
}

.menu-items button.active {
  background-color: #edf2ff;
  color: #5b4cc4;
  font-weight: bold;
  border-left: 4px solid #5b4cc4;
}

.separador {
  height: 1px;
  background: #e2e8f0;
  margin: 10px 20px;
}
</style>