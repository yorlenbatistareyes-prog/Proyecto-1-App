<script lang="ts">
  import { onMount } from 'svelte';
  import Panel from '$lib/components/Panel.svelte';
  
  import { vistaActual, menuAbierto, circuitos, congregaciones } from '$lib/stores';
  import type { Circuito, Congregacion, Vista } from '$lib/types';

  import Sidebar from '$lib/components/Sidebar.svelte';

  import Header from '$lib/components/Header.svelte';

  import BottomNav from '$lib/components/BottomNav.svelte'; // Nueva importación

  /* LÓGICA: INICIO */
  let seccionInicio: 'registros' | 'pendientes' = 'registros';
  const visitasRecientes = [
    { fecha: '2025-12-09', congregacion: 'Congregación Norte' },
    { fecha: '2025-12-08', congregacion: 'Congregación Sur' },
    { fecha: '2025-12-10', congregacion: 'Congregación Este' },
    { fecha: '2025-12-11', congregacion: 'Congregación Oeste' },
    { fecha: '2025-12-12', congregacion: 'Congregación Sureste' }
  ];
  let asuntosPendientes = [{ id: 1, texto: 'Visita pendiente a Congregación Norte' }];

/* LÓGICA: CIRCUITOS */
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
      // Usamos $circuitos para que se guarde en localStorage automáticamente
      $circuitos = [...$circuitos, { ...nuevoCircuito }];
    } else {
      $circuitos[indiceCircuitoEditando] = { ...nuevoCircuito };
      $circuitos = [...$circuitos];
    }
    creandoCircuito = false;
  }

  function eliminarCircuito(index: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este circuito?')) {
      $circuitos = $circuitos.filter((_, i) => i !== index);
    }
  }

  /* LÓGICA: CONGREGACIONES */
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
  $: congregacionesFiltradas = $congregaciones.filter(c => 
  c.nombre.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
  c.ciudad.toLowerCase().includes(textoBusqueda.toLowerCase())
);

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
      // Añadir al store usando $
      $congregaciones = [...$congregaciones, { ...nuevaCongregacion }];
    } else {
      // Actualizar el store usando $
      $congregaciones[indiceCongregacionEditando] = { ...nuevaCongregacion };
      $congregaciones = [...$congregaciones];
    }
    mostrarFormularioCongregacion = false;
    // ¡Ya no necesitas localStorage.setItem aquí! El store lo hace solo.
  }

  function eliminarCongregacion(index: number) {
    if (confirm('¿Estás seguro de que deseas eliminar esta congregación?')) {
      $congregaciones = $congregaciones.filter((_, i) => i !== index);
    }
  }
</script>

<Sidebar />

<Header />

<BottomNav />

<main>
  {#if $vistaActual === 'inicio'}
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

  {#if $vistaActual === 'circuito'}
    <Panel titulo={creandoCircuito ? "Datos del Circuito" : "Circuitos"}>
      {#if !creandoCircuito}
        <div class="flex-end"><button class="btn-primario" on:click={prepararNuevoCircuito}>Nuevo circuito</button></div>
        <table class="tabla">
          <thead><tr><th>Nombre</th><th>Idioma</th><th>País</th><th>Acciones</th></tr></thead>
          <tbody>
            {#each $circuitos as c, index}
              <tr>
  <td>{c.nombre}</td>
  <td>{c.idioma}</td>
  <td>{c.pais}</td>
  <td>
    <div class="acciones-tabla">
      <button class="btn-secundario" on:click={() => editarCircuito(c, index)}>
        Editar
      </button>
      <button class="btn-eliminar" on:click={() => eliminarCircuito(index)}>
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

  {#if $vistaActual === 'congregaciones'}
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
      <div class="form-grande">
        <h3>{indiceCongregacionEditando !== null ? 'Editar' : 'Nueva'} Congregación</h3>
        
        <div class="campo">
          <label>Nombre de la Congregación *</label>
          <input type="text" bind:value={nuevaCongregacion.nombre} placeholder="Ej: Central" />
        </div>

        <div class="campo">
          <label>Circuito *</label>
          <input type="text" bind:value={nuevaCongregacion.circuito} placeholder="Ej: HG-01" />
        </div>

        <div class="campo">
          <label>Ciudad</label>
          <input type="text" bind:value={nuevaCongregacion.ciudad} placeholder="Ej: Holguín" />
        </div>

        <div class="flex-end" style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn-secundario" on:click={() => mostrarFormularioCongregacion = false}>
            Cancelar
          </button>
          <button type="button" class="btn-primario" on:click={guardarCongregacion}>
            {indiceCongregacionEditando !== null ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    {/if}
  </Panel>
{/if}
  
  {#if $vistaActual === 'configuracion'}
    <Panel titulo="Configuración">
      <p>Ajustes generales del asistente.</p>
    </Panel>
  {/if}
</main>


<style>
  :global(body) { font-family: "Segoe UI", sans-serif; margin: 0; background-color: #f5f5f5; }
  main { padding: 15px; padding-bottom: 80px; }

  /* --- HEADER CORREGIDO --- */

  .header-bottom { background: #3f3f3f; height: 48px; }

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

