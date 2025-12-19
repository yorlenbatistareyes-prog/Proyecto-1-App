<script lang="ts">
  import { onMount } from 'svelte';
  import Panel from '$lib/components/Panel.svelte';
  import { vistaActual, circuitos, congregaciones } from '$lib/stores';
  import type { Circuito, Congregacion, Vista } from '$lib/types';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Header from '$lib/components/Header.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { jsPDF } from 'jspdf';
  import 'jspdf-autotable';

  let menuAbiertoId: number | null = null;
 
  function toggleMenu(index: number) {
    menuAbiertoId = menuAbiertoId === index ? null : index;
  }
 
  function cerrarMenu() {
    menuAbiertoId = null;
  }
 
  /* LÓGICA: INICIO */
  let seccionInicio: 'registros' | 'pendientes' = 'registros';
  // Esta variable ahora será "reactiva" (se actualiza sola cuando cambias 'visitas')
  $: visitasRecientes = visitas
    .slice(-5) // Toma solo las últimas 5 visitas
    .reverse() // Pon la más reciente arriba
    .map(v => ({
      fecha: v.fecha,
      congregacion: v.congregacionId
    }));

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
      $circuitos = [...$circuitos, { ...nuevoCircuito }];
    } else {
      $circuitos[indiceCircuitoEditando] = { ...nuevoCircuito };
      $circuitos = [...$circuitos];
    }
    creandoCircuito = false;
  }
 
  function eliminarCircuito(index: number) {
    if (confirm('¿Eliminar este circuito?')) {
      $circuitos = $circuitos.filter((_, i) => i !== index);
    }
  }
 
  /* LÓGICA: CONGREGACIONES */
  let mostrarFormularioCongregacion = false;
  let indiceCongregacionEditando: number | null = null;
  
  const moldeCongregacion: Congregacion = {
    circuito: '', seccion: '', sucursal: '',
    nombre: '', numero: '', ciudad: '', provincia: '',
    pais: 'Cuba', idioma: 'S', esLenguaSeñas: false,
    reunionEntreSemana: '', horaEntreSemana: '',
    reunionFinSemana: '', horaFinSemana: '',
    telefono: ''
  };
  
  let nuevaCongregacion: Congregacion = { ...moldeCongregacion };
  let textoBusqueda = '';
 
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
      $congregaciones = [...$congregaciones, { ...nuevaCongregacion }];
    } else {
      $congregaciones[indiceCongregacionEditando] = { ...nuevaCongregacion };
      $congregaciones = [...$congregaciones];
    }
    mostrarFormularioCongregacion = false;
  }
 
  function eliminarCongregacion(index: number) {
    if (confirm('¿Eliminar esta congregación?')) {
      $congregaciones = $congregaciones.filter((_, i) => i !== index);
    }
  }

  /* LÓGICA: VISITAS */
  let creandoVisita = false;
  // Inicializamos con un array vacío para evitar errores de "undefined"
  let visitas: any[] = []; 
  
  let nuevaVisita = {
    congregacionId: '',
    fecha: new Date().toISOString().split('T')[0], 
    tipo: 'Ordinaria',
    observaciones: ''
  };

  function guardarVisita() {
    if (!nuevaVisita.congregacionId) return alert('Seleccione una congregación');
    
    // 1. Guardar la visita
    const visitaGuardada = { ...nuevaVisita, id: Date.now() };
    visitas = [...visitas, visitaGuardada];

    // 2. Si hay observaciones, crear un pendiente automático
    if (nuevaVisita.observaciones.trim() !== '') {
      const nuevoPendiente = {
        id: Date.now() + 1,
        texto: `Pendiente de ${nuevaVisita.congregacionId}: ${nuevaVisita.observaciones}`
      };
      asuntosPendientes = [...asuntosPendientes, nuevoPendiente];
    }

    creandoVisita = false;
    // Reiniciar formulario
    nuevaVisita = { congregacionId: '', fecha: new Date().toISOString().split('T')[0], tipo: 'Ordinaria', observaciones: '' };
  }

  function exportarDatos(formato: 'csv' | 'excel' | 'pdf') {
    if (visitas.length === 0) return alert('No hay datos para exportar');

    const encabezados = ['Fecha', 'Congregacion', 'Tipo', 'Observaciones'];
    const filas = visitas.map(v => [v.fecha, v.congregacionId, v.tipo, v.observaciones]);

    if (formato === 'pdf') {
      const doc = new jsPDF();
      doc.text('Informe Mensual de Visitas', 14, 15);
      (doc as any).autoTable({
        head: [encabezados],
        body: filas,
        startY: 20,
      });
      doc.save(`Informe_Visitas_${new Date().toISOString().slice(0,7)}.pdf`);
    } 
    else {
      // Lógica para CSV y Excel (formato tabular)
      let contenido = encabezados.join(',') + '\n';
      filas.forEach(fila => {
        contenido += fila.map(campo => `"${campo}"`).join(',') + '\n';
      });

      const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Informe_Visitas.${formato === 'excel' ? 'xlsx' : 'csv'}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
</script>
 
<Sidebar />
<Header />
<BottomNav />
 
<main>
  {#if $vistaActual === 'inicio'}
    <div class="acciones">
      <button class:activo={seccionInicio === 'registros'} on:click={() => seccionInicio = 'registros'}>Visitas</button>
      <button class:activo={seccionInicio === 'pendientes'} on:click={() => seccionInicio = 'pendientes'}>Pendientes</button>
    </div>
    <Panel titulo={seccionInicio === 'registros' ? "Visitas recientes" : "Asuntos pendientes"}>
  <ul>
    {#if seccionInicio === 'registros'}
      {#each visitasRecientes as item}
        <li>
          <strong>{item.fecha}:</strong> {item.congregacion}
        </li>
      {:else}
        <li style="color: #999;">No hay visitas registradas aún.</li>
      {/each}
    {:else}
      {#each asuntosPendientes as item}
        <li>{item.texto}</li>
      {:else}
        <li style="color: #999;">No hay pendientes.</li>
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
                <td>{c.nombre}</td><td>{c.idioma}</td><td>{c.pais}</td>
                <td>
                  <div class="acciones-tabla">
                    <button class="btn-secundario" on:click={() => editarCircuito(c, index)}>Editar</button>
                    <button class="btn-eliminar" on:click={() => eliminarCircuito(index)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <div class="form-grande">
          <div class="campo"><label>Nombre del Circuito</label><input bind:value={nuevoCircuito.nombre} /></div>
          <div class="campo"><label>Idioma</label><input bind:value={nuevoCircuito.idioma} /></div>
          <div class="campo"><label>País</label><input bind:value={nuevoCircuito.pais} /></div>
          <div class="acciones-inferiores">
            <button class="btn-secundario" on:click={() => creandoCircuito = false}>Cancelar</button>
            <button class="btn-primario" on:click={guardarCircuito}>Guardar</button>
          </div>
        </div>
      {/if}
    </Panel>
  {/if}
 
  {#if $vistaActual === 'congregaciones'}
    <Panel titulo="Congregaciones">
      {#if !mostrarFormularioCongregacion}
        <div class="flex-end"><button class="btn-primario" on:click={prepararNuevaCongregacion}>➕ Nueva</button></div>
        <input type="text" placeholder="Buscar..." bind:value={textoBusqueda} class="input-buscador" />
        <div class="table-container">
          <table class="tabla-profesional">
            <thead>
              <tr>
                <th>Número</th><th>Nombre</th><th>Ciudad</th><th>Provincia</th><th>País</th>
                <th>Circuito</th><th>Sección</th><th>Sucursal</th><th>Entre semana</th><th>Fin de semana</th><th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {#each congregacionesFiltradas as c, i}
                <tr>
                  <td class="font-mono">{c.numero || '-'}</td>
                  <td class="font-bold">{c.nombre}</td>
                  <td>{c.ciudad}</td>
                  <td>{c.provincia || '-'}</td>
                  <td>{c.pais}</td>
                  <td>{c.circuito}</td>
                  <td class="text-center">{c.seccion || '-'}</td>
                  <td>{c.sucursal || '-'}</td>
                  <td class="reunion-cell">{c.reunionEntreSemana || '-'} {c.horaEntreSemana || ''}</td>
                  <td class="reunion-cell">{c.reunionFinSemana || '-'} {c.horaFinSemana || ''}</td>
                  <td style="position: relative; overflow: visible;"> 
  <button class="btn-tabla-accion" on:click|stopPropagation={() => toggleMenu(i)}>
    ACCIONES
  </button>

  {#if menuAbiertoId === i}
    <div class="overlay-invisible" on:click={cerrarMenu}></div>
    
    <div class="menu-flotante">
      <div class="menu-header">{c.nombre}</div>
      <div class="menu-acciones">
        <button class="opcion-editar" on:click={() => { editarCongregacion(c, i); cerrarMenu(); }}>
          ✏️ EDITAR
        </button>
        <button class="opcion-eliminar" on:click={() => { eliminarCongregacion(i); cerrarMenu(); }}>
          ELIMINAR 🗑️
        </button>
      </div>
    </div>
  {/if}
</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="form-grande">
          <h3>{indiceCongregacionEditando !== null ? 'Editar' : 'Nueva'} Congregación</h3>
          <div class="fila">
            <div class="campo">
              <label>Seleccione el circuito *</label>
              <select bind:value={nuevaCongregacion.circuito} class="select-estilizado">
                <option value="" disabled>Seleccione...</option>
                {#each $circuitos as circ}<option value={circ.nombre}>{circ.nombre}</option>{/each}
              </select>
            </div>
            <div class="campo"><label>Sección del circuito</label><input bind:value={nuevaCongregacion.seccion} placeholder="Ej. A" /></div>
            <div class="campo"><label>Seleccione la Sucursal</label><input bind:value={nuevaCongregacion.sucursal} placeholder="Sucursal" /></div>
          </div>
          <div class="fila">
            <div class="campo gran-campo"><label>Nombre de Congregación *</label><input bind:value={nuevaCongregacion.nombre} /><small>Solo el nombre, Ej. Lengua de señas</small></div>
            <div class="campo"><label>Número</label><input bind:value={nuevaCongregacion.numero} /></div>
            <div class="campo"><label>Ciudad *</label><input bind:value={nuevaCongregacion.ciudad} /></div>
            <div class="campo"><label>Estado/Provincia</label><input bind:value={nuevaCongregacion.provincia} /></div>
          </div>
          <div class="fila-reunion">
            <div class="campo-reunion">
              <label>Reunión de entre semana</label>
              <div class="time-wrapper">
                <input type="text" bind:value={nuevaCongregacion.reunionEntreSemana} placeholder="Día" />
                <input type="time" bind:value={nuevaCongregacion.horaEntreSemana} />
              </div>
            </div>
            <div class="campo-reunion">
              <label>Reunión de fin de semana</label>
              <div class="time-wrapper">
                <input type="text" bind:value={nuevaCongregacion.reunionFinSemana} placeholder="Día" />
                <input type="time" bind:value={nuevaCongregacion.horaFinSemana} />
              </div>
            </div>
          </div>
          <div class="acciones-inferiores">
            <button class="btn-secundario" on:click={() => mostrarFormularioCongregacion = false}>Cancelar</button>
            <button class="btn-primario" on:click={guardarCongregacion}>Guardar</button>
          </div>
        </div>
      {/if}
    </Panel>
  {/if}

 {#if $vistaActual === 'visitas'}
    <Panel titulo="Registro de Visitas">
      {#if !creandoVisita}
        <div class="flex-end" style="gap: 10px; margin-bottom: 20px;">
  <div class="grupo-exportar">
    <select class="select-exportar" on:change={(e) => exportarDatos(e.currentTarget.value)}>
      <option value="" selected disabled>📥 Exportar informe...</option>
      <option value="csv">Formato CSV</option>
      <option value="excel">Formato Excel (.xlsx)</option>
      <option value="pdf">Formato PDF (.pdf)</option>
    </select>
  </div>

  <button class="btn-primario" on:click={() => creandoVisita = true}>
    📝 Registrar Nueva Visita
  </button>
</div>

        <div class="table-container">
          <table class="tabla-profesional">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Congregación</th>
                <th>Tipo</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {#each visitas as v}
                <tr>
                  <td class="font-mono">{v.fecha}</td>
                  <td class="font-bold">{v.congregacionId}</td>
                  <td>{v.tipo}</td>
                  <td class="text-center">
                    <button class="btn-tabla-accion">VER INFORME</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="form-grande">
          <h3>Detalles de la Visita</h3>
          <div class="fila">
            <div class="campo">
              <label>Congregación *</label>
              <select bind:value={nuevaVisita.congregacionId} class="select-estilizado">
                <option value="" disabled>Seleccione...</option>
                {#each $congregaciones as cong}
                  <option value={cong.nombre}>{cong.nombre}</option>
                {/each}
              </select>
            </div>
            <div class="campo">
              <label>Fecha</label>
              <input type="date" bind:value={nuevaVisita.fecha} />
            </div>
          </div>
          <div class="fila">
            <div class="campo">
              <label>Tipo de Visita</label>
              <select bind:value={nuevaVisita.tipo} class="select-estilizado">
                <option value="Ordinaria">Ordinaria</option>
                <option value="Especial">Especial</option>
                <option value="Reunión con Ancianos">Reunión con Ancianos</option>
              </select>
            </div>
          </div>
          <div class="campo" style="margin-top: 15px;">
            <label>Observaciones</label>
            <textarea bind:value={nuevaVisita.observaciones} placeholder="Notas internas..." 
              style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #ccc;"></textarea>
          </div>
          <div class="acciones-inferiores">
            <button class="btn-secundario" on:click={() => creandoVisita = false}>Cancelar</button>
            <button class="btn-primario" on:click={guardarVisita}>Guardar</button>
          </div>
        </div>
      {/if}
    </Panel>
  {/if} 
</main>
 
<style>
  :global(body) { font-family: "Segoe UI", sans-serif; margin: 0; background-color: #f5f5f5; }
  main { padding: 15px; padding-bottom: 80px; max-width: 1200px; margin: 0 auto; }
  .acciones { display: flex; gap: 10px; margin-bottom: 15px; }
  .acciones button { padding: 8px 15px; border-radius: 20px; border: 1px solid #ccc; background: white; cursor: pointer; }
  .acciones button.activo { background: #ede9fb; border-color: #5b4cc4; color: #5b4cc4; font-weight: bold; }
  
  .tab.table-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible; /* IMPORTANTE: Permite que el menú "salga" hacia abajo */
  background: white;
  position: relative;
}
  .tabla-profesional { width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 1200px; }
  .tabla-profesional th { background-color: #ffffff; color: #333; font-weight: 600; text-align: left; padding: 12px 15px; border-bottom: 2px solid #edf2f7; }
  .tabla-profesional td { padding: 10px 15px; border-bottom: 1px solid #edf2f7; color: #4a5568; }

  .btn-tabla-accion { background: white; color: #2d3748; border: 1px solid #cbd5e0; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; cursor: pointer; }
  
  .menu-flotante {
  position: absolute;
  right: 0;           /* Alineado a la derecha del botón */
  top: 40px;          /* Un poco hacia abajo del botón */
  z-index: 999;       /* Por encima de todo */
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2); /* Sombra más fuerte para que se vea que flota */
  min-width: 250px;
  padding: 0;
}
  .menu-header { padding: 12px; font-weight: bold; border-bottom: 1px solid #eee; }
  .menu-acciones { display: flex; justify-content: space-between; padding: 10px; gap: 10px; }
  .opcion-editar { border: 1px solid #333; background: white; padding: 6px; cursor: pointer; font-weight: bold; flex: 1; }
  .opcion-eliminar { border: 1px solid #ff4d4d; color: #ff4d4d; background: white; padding: 6px; cursor: pointer; font-weight: bold; flex: 1; }

  .overlay-invisible {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 998; /* Justo debajo del menú flotante */
  background: transparent;
}

  .btn-primario { background: #5b4cc4; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
  .btn-secundario { background: #f0f0f0; border: 1px solid #ccc; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
  .form-grande { background: white; padding: 20px; border-radius: 8px; }
  .fila { display: flex; gap: 15px; margin-bottom: 20px; }
  .campo { flex: 1; display: flex; flex-direction: column; }
  .campo input, .select-estilizado { padding: 8px; border: none; border-bottom: 1px solid #ccc; background: #fafafa; }
  .fila-reunion { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f9f9f9; padding: 15px; }
  .time-wrapper { display: flex; gap: 5px; }
  .acciones-inferiores { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
  .input-buscador { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; }

  textarea {
    font-family: inherit;
    resize: vertical;
    border-radius: 4px;
    background: #fafafa;
  }

  .select-exportar {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #5b4cc4;
    background-color: white;
    color: #5b4cc4;
    font-weight: bold;
    cursor: pointer;
    outline: none;
  }

  .select-exportar:hover {
    background-color: #f4f2ff;
  }

  .grupo-exportar {
    display: flex;
    align-items: center;
  }
</style>