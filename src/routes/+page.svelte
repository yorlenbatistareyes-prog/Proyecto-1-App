<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { invoke } from '@tauri-apps/api/core';

  import { generarPDFIndividual, generarPDFListado } from '$lib/utils/pdfGenerator';
  import { moldeCongregacion, eliminarCongregacion, procesarGuardadoCongregacion } from '$lib/congregaciones';
  import Panel from '$lib/components/Panel.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Header from '$lib/components/Header.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import Toast from '$lib/components/Toast.svelte';
  
  import { vistaActual, circuitos, congregaciones, visitasStore, temaOscuro, colorAcento, mostrarToast } from '$lib/stores';
  import type { Circuito, Congregacion, Visita, Vista } from '$lib/types'; 
  import { moldeVisita, eliminarVisita, procesarGuardadoVisita } from '$lib/visitas';
  
  import { save } from '@tauri-apps/plugin-dialog';
  import { writeTextFile } from '@tauri-apps/plugin-fs';

  import { Settings, Menu, User, Trash2, Pencil, Plus, Save, X, Calendar, Search, CircleCheckBig 
} from 'lucide-svelte';

  // 1. Lógica para el Modo Oscuro
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark-mode', $temaOscuro);
    }
  });

  // --- LÓGICA DE INFORMES (Ajuste 2) ---
  let visitasMesActual = $derived.by(() => {
    const ahora = new Date();
    const mes = ahora.getMonth();
    const anio = ahora.getFullYear();

    return $visitasStore.filter(v => {
      if (!v || !v.fecha) return false;
      const f = new Date(v.fecha + 'T00:00:00');
      return f.getMonth() === mes && f.getFullYear() === anio;
    });
  });

  let statsMes = $derived({
    total: visitasMesActual.length,
    congreDistintas: new Set(visitasMesActual.map(v => v.congregacionId)).size,
    promedioPorSemana: (visitasMesActual.length / 4).toFixed(1)
  });

  let menuAbiertoId = $state<number | null>(null);

function toggleMenu(index: number) {
  menuAbiertoId = menuAbiertoId === index ? null : index;
}

function cerrarMenu() {
  menuAbiertoId = null;
}
 
  /* LÓGICA: INICIO / AGENDA */
  let seccionInicio = $state<'registros' | 'pendientes'>('registros'); 
  
  let nuevaTareaTexto = $state(''); 
  let nuevaTareaFecha = $state(''); // Valor del input datetime-local

  // 1. Ajustamos el tipo para permitir null
  let tareas = $state<{
    id: number, 
    texto: string, 
    completada: boolean, 
    fechaVencimiento: string | null // Cambiado de opcional a string o null
  }[]>([]); 

  // Esta variable se actualizará sola cada vez que cambie 'tareas'
  let tareasOrdenadas = $derived([...tareas].sort((a, b) => {
  return a.completada === b.completada ? 0 : a.completada ? 1 : -1;
}));

let totalPendientes = $derived(tareas.filter(t => !t.completada).length);

  function agregarTarea() {
    if (nuevaTareaTexto.trim() !== '') {
      // 2. CORRECCIÓN: Si el input está vacío, guardamos null para evitar "Invalid Date"
      const fechaValida = nuevaTareaFecha ? nuevaTareaFecha : null;

      const nueva = { 
        id: Date.now(), 
        texto: nuevaTareaTexto, 
        fechaVencimiento: fechaValida, 
        completada: false 
      };
      
      const listaActualizada = [...tareas, nueva];

      // 3. Orden dinámico protegiendo nulos
      tareas = listaActualizada.sort((a, b) => {
        if (!a.fechaVencimiento) return 1;
        if (!b.fechaVencimiento) return -1;
        return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
      });

      nuevaTareaTexto = ''; 
      nuevaTareaFecha = '';
    }
  }

  function eliminarTarea(id: number) {
    tareas = tareas.filter(t => t.id !== id);
  }

  onMount(async () => {
  try {
    // Pedimos a Rust el paquete completo de datos
    const datos: any = await invoke('cargar_todo_desde_disco');
    
    if (datos) {
      // Cargamos los Stores (Circuitos, Congresis y Visitas)
      $circuitos = datos.circuitos || [];
      $congregaciones = datos.congregaciones || [];
      $visitasStore = datos.visitas || [];
      $temaOscuro = datos.ajustes?.temaOscuro || false;

      // Cargamos la Agenda (Tareas) con tu lógica de seguridad para fechas
      if (datos.agenda) {
        tareas = datos.agenda.map((t: any) => ({
          ...t,
          fechaVencimiento: t.fechaVencimiento || null
        }));
      }
      console.log("✅ Toda la base de datos cargada desde Rust");
    }
  } catch (e) {
    console.log("Iniciando sin datos previos o archivo no encontrado.");
  }
});

  $effect(() => {
  // Esta función se activa automáticamente cuando cambian estos datos
  const sincronizar = async () => {
    const estadoCompleto = {
      circuitos: $circuitos,
      congregaciones: $congregaciones,
      visitas: $visitasStore,
      agenda: tareas,
      ajustes: { temaOscuro: $temaOscuro }
    };

    try {
      await invoke('guardar_todo_en_disco', { estado: estadoCompleto });
    } catch (error) {
      console.error("Error al sincronizar con Rust:", error);
    }
  };

  sincronizar();
});

  // Lógica de Visitas Recientes
  let visitasRecientes = $derived(
    $visitasStore
      .slice(-5) 
      .reverse() 
      .map(v => ({
        fecha: v.fecha,
        congregacion: v.congregacionId
      }))
  );

  /* LÓGICA: CIRCUITOS */
  let creandoCircuito = $state(false);
  let indiceCircuitoEditando: number | null = null;
  let nuevoCircuito = $state<Circuito>({ nombre: '', idioma: 'S', pais: 'Cuba' });
 
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
    mostrarToast("✅ Circuito guardado correctamente");
  }
 
  function eliminarCircuito(index: number) {
    if (confirm('¿Eliminar este circuito?')) {
      $circuitos = $circuitos.filter((_, i) => i !== index);
      mostrarToast("🗑️ Registro eliminado", "error");
    }
  }
 
  /* LÓGICA: CONGREGACIONES */
  let mostrarFormularioCongregacion = $state(false);
  let indiceCongregacionEditando = $state<number | null>(null);
  
  // 1. Nueva forma de declarar la congregación y la búsqueda
  let nuevaCongregacion = $state({ ...moldeCongregacion });
  let textoBusqueda = $state('');

  // 2. Cálculo derivado (reemplaza a $: )
  let congregacionesFiltradas = $derived(
    $congregaciones.filter(c => 
      c.nombre.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
      c.ciudad.toLowerCase().includes(textoBusqueda.toLowerCase())
    )
  );
 
  function prepararNuevaCongregacion() {
    nuevaCongregacion = { ...moldeCongregacion };
    indiceCongregacionEditando = null;
    mostrarFormularioCongregacion = true;
    console.log("Estado de vista:", mostrarFormularioCongregacion);
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
    // LLAMAMOS A LA LÓGICA EXTERNA
    procesarGuardadoCongregacion(nuevaCongregacion);
    
   // Cerramos el formulario y mostramos el aviso
    mostrarFormularioCongregacion = false; 
    mostrarToast("✅ Congregación guardada con éxito"); //
  }

  /* LÓGICA: CONFIGURACIÓN Y BACKUP */
  async function exportarBackup() {
  try {
    const mensaje = await invoke('exportar_datos');
    mostrarToast(`✅ ${mensaje}`); 
  } catch (error) {
    console.error("Error completo al exportar:", error);
    alert("Error detallado: " + error); // Línea temporal para ver el error
    if (error !== "Cancelado por el usuario" && error !== "Exportación cancelada") {
      mostrarToast("❌ Error al exportar los datos", "error");
    }
  }
}

  async function importarBackup() {
    try {
      // 1. Añadimos ': any' aquí para quitar los 6 errores de la lista
      const datos: any = await invoke('importar_datos_nativa');
      
      if (datos && confirm("¿Importar respaldo? Se sobrescribirán los datos actuales.")) {
        // Ahora estos ya no marcarán error
        $circuitos = datos.circuitos || [];
        $congregaciones = datos.congregaciones || [];
        $visitasStore = datos.visitas || [];
        
        if (datos.agenda) {
          // También añadimos '(t: any)' para quitar el último aviso
          tareas = datos.agenda.map((t: any) => ({
            ...t,
            fechaVencimiento: t.fechaVencimiento || null
          }));
        }
        
        mostrarToast("✅ Datos importados correctamente");
      }
    } catch (error) {
      if (error !== "Importación cancelada") {
        console.error("Error al importar:", error);
        mostrarToast("❌ No se pudo importar el archivo", "error");
      }
    }
  }

  async function limpiarTodo() {
    if (confirm("⚠️ ¿Borrar TODOS los datos de la aplicación definitivamente?")) {
      // 1. Limpiamos los datos en la pantalla
      $circuitos = [];
      $congregaciones = [];
      $visitasStore = [];
      tareas = []; // No olvides limpiar también la agenda

      // 2. Preparamos el "paquete vacío" para Rust
      const estadoVacio = {
        circuitos: [],
        congregaciones: [],
        visitas: [],
        agenda: [],
        ajustes: { temaOscuro: $temaOscuro }
      };

      try {
        // 3. Le ordenamos a Rust que borre el archivo físico guardando el vacío
        await invoke('guardar_todo_en_disco', { estado: estadoVacio });
        
        // 4. Usamos tu sistema de notificaciones en lugar de un alert simple
        mostrarToast("🗑️ La base de datos ha sido vaciada por completo", "error");
      } catch (error) {
        console.error("Error al limpiar el disco:", error);
        alert("Los datos se borraron de pantalla, pero hubo un error al limpiar el archivo.");
      }
    }
  }

  /* LÓGICA: VISITAS */
  let creandoVisita = $state(false);
  let mostrarPreguntas = $state(false);
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  // Inicializamos con un array vacío para evitar errores de "undefined"
  let mostrarPreguntasTerritorio = $state(false);
  let mostrarPreguntasPrecursores = $state(false);
  let mostrarPreguntasReuniones = $state(false);
  let mostrarPreguntasPastoreo = $state(false);
  let mostrarPreguntasCrecimiento = $state(false);
  let mostrarPreguntasSuperServicio = $state(false);
  let mostrarPreguntasPublicaciones = $state(false);
  let mostrarPreguntasProgreso = $state(false);
  let mostrarPreguntasAncianos = $state(false);
  let mostrarPreguntasLocal = $state(false);
  let mostrarPreguntasInactivos = $state(false);
  let mostrarPreguntasDetallePrecursores = $state(false);
  let mostrarPreguntasContabilidad = $state(false);
  let mostrarPreguntasProblemas = $state(false);
  let mostrarPreguntasMiscelaneos = $state(false);
  let mostrarPreguntasDiscursos = $state(false);
  let mostrarSugerenciasReuniones = $state(false);
  
  let nuevaVisita = $state({ ...moldeVisita });

  function guardarVisita() {
    if (!nuevaVisita.congregacionId || !nuevaVisita.fecha) {
      alert("Por favor, seleccione la congregación y la fecha.");
      return;
    }

    // 1. Procesamos el guardado
    const esNueva = procesarGuardadoVisita(nuevaVisita);

    // 2. Lógica de Tareas (CORREGIDA: observacionesFinales en español)
    if (esNueva && nuevaVisita.observacionesFinales && nuevaVisita.observacionesFinales.trim() !== '') {
        const nuevoPendiente = {
            id: Date.now() + 1,
            texto: `Pendiente de ${nuevaVisita.congregacionId}: ${nuevaVisita.observacionesFinales}`,
            completada: false,
            fechaVencimiento: null 
        };
        
        // Actualizamos la variable local de tareas
        tareas = [...tareas, nuevoPendiente];
        console.log("✅ Tarea creada con éxito");
    }

    // 3. Limpieza y Cierre
    creandoVisita = false; 
    nuevaVisita = { ...moldeVisita }; 
  }

  function toggleDiaMinisterio(dia: string) {
    const programa = nuevaVisita.ministerio.programa;
    const index = programa.findIndex(p => p.dia === dia);
    
    if (index !== -1) {
      nuevaVisita.ministerio.programa = programa.filter(p => p.dia !== dia);
    } else {
      nuevaVisita.ministerio.programa.push({ dia: dia, hora: '' });
  }
}

  let textoBusquedaVisitas = $state('');

/* --- COPIAR DESDE AQUÍ --- */
  let filtroMes = $state("Todos");
  let filtroAnio = $state("Todos");
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  let anios = $derived([
    ...new Set([
      new Date().getFullYear().toString(), 
      ...$visitasStore.map(v => new Date(v.fecha + 'T00:00:00').getFullYear().toString())
    ])
  ].sort());

  // CORRECCIÓN: Cambiamos $: por $derived
  let visitasFiltradas = $derived(
    $visitasStore.filter(v => {
      const coincideTexto = v.congregacionId.toLowerCase().includes(textoBusquedaVisitas.toLowerCase()) || 
                           v.tipo.toLowerCase().includes(textoBusquedaVisitas.toLowerCase());
      
      const fechaObj = new Date(v.fecha + 'T00:00:00');
      const mesVisita = fechaObj.getMonth(); 
      const coincideMes = filtroMes === "Todos" || meses[mesVisita] === filtroMes;

      const anioVisita = fechaObj.getFullYear().toString();
      const coincideAnio = filtroAnio === "Todos" || anioVisita === filtroAnio;

      return coincideTexto && coincideMes && coincideAnio;
    }).reverse()
  );

  // --- ELIMINADAS LAS LÍNEAS QUE CAUSABAN EL ERROR AQUÍ ---

 async function exportarDatos(formato: 'csv' | 'pdf') {
  // Usamos las visitas filtradas para que el PDF coincida con lo que ves en pantalla
  if (visitasFiltradas.length === 0) {
    return alert('No hay datos registrados para exportar.');
  }

  if (formato === 'pdf') {
    // Llamamos a la lógica externa
    await generarPDFListado(visitasFiltradas);
  } else {
    // CSV usando Tauri
    const encabezados = ['Fecha', 'Congregación', 'Tipo', 'Observaciones Finales'];
    const filas = visitasFiltradas.map(v => [
      v.fecha || 'N/A', 
      v.congregacionId || 'N/A', 
      v.tipo || 'N/A', 
      v.observacionesFinales || ''
    ]);
    
    let contenido = encabezados.join(';') + '\n';
    filas.forEach(f => contenido += f.map(c => `"${c}"`).join(';') + '\n');
    const BOM = '\uFEFF';
    const contenidoFinal = BOM + contenido;
    
    try {
      const rutaGuardado = await save({
        defaultPath: 'Informe_Visitas.csv',
        filters: [{
          name: 'CSV',
          extensions: ['csv']
        }]
      });
      
      if (rutaGuardado) {
        await writeTextFile(rutaGuardado, contenidoFinal);
        mostrarToast('✅ CSV exportado correctamente');
      }
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      mostrarToast('❌ Error al exportar CSV', 'error');
    }
  }
}
  // --- FUNCIONES DE GESTIÓN DE VISITAS ---
  function cargarVisitaParaVer(visita: any) {
    // Rellenamos el formulario con los datos guardados
    nuevaVisita = JSON.parse(JSON.stringify(visita)); 
    // Cambiamos a la vista del formulario
    creandoVisita = true;
    // Subimos al inicio para ver el reporte
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Variables para el Perfil
  let nombreSuperintendente = "";
  let circuitoConfig = "";

</script>
 
<Sidebar />
<Header />
<BottomNav />
<Toast />
 
<main>
 {#if $vistaActual === 'inicio'}
  <div class="acciones">
    <button 
      class:activo={seccionInicio === 'registros'} 
      onclick={() => seccionInicio = 'registros'}
    >
      Visitas
    </button>
    
    <button 
      class:activo={seccionInicio === 'pendientes'} 
      onclick={() => seccionInicio = 'pendientes'}
    >
      Pendientes
      {#if totalPendientes > 0}
        <span class="badge-alerta">{totalPendientes}</span>
      {/if}
    </button>
  </div>

  <Panel titulo={seccionInicio === 'registros' ? "Visitas recientes" : "Agenda de asuntos"}>
    {#if seccionInicio === 'registros'}
      <ul class="lista-recientes">
        {#each visitasRecientes as item}
          <li>
            <span class="fecha-v">{item.fecha}:</span> 
            <span class="cong-v">{item.congregacion}</span>
          </li>
        {:else}
          <li class="vacio">No hay visitas registradas aún.</li>
        {/each}
      </ul>
    {:else}
      <div class="agenda-wrapper">
  <div class="agenda-layout-grid">
    <input 
      type="text" 
      class="agenda-input-texto"
      bind:value={nuevaTareaTexto} 
      placeholder="¿Qué hay que hacer?" 
      onkeydown={(e) => e.key === 'Enter' && agregarTarea()}
    />
    
    <input 
      type="datetime-local" 
      class="agenda-input-fecha"
      bind:value={nuevaTareaFecha}
    />

    <button class="agenda-btn-add" onclick={agregarTarea}>
      Añadir
    </button>
  </div>

        <ul class="lista-tareas">
  {#each tareasOrdenadas as item (item.id)}
    <li class="tarea-card" class:completada={item.completada}>
      <div class="tarea-main">
        <label class="check-container">
          <input type="checkbox" bind:checked={item.completada} />
          <span class="checkmark"></span>
        </label>
        
        <div class="tarea-info">
          <span class="tarea-texto" class:tachado={item.completada}>
  {#if item.completada}
    <CircleCheckBig size={16} style="display: inline; color: #22c55e; margin-right: 4px; vertical-align: middle;" />
  {/if}
  {item.texto}
</span>
          {#if item.fechaVencimiento}
  <span class="badge-vencimiento">
    <Calendar size={12} style="display: inline; margin-right: 4px; vertical-align: middle;" />
    {new Date(item.fechaVencimiento).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}
  </span>
{/if}
        </div>
      </div>

      <button class="btn-borrar" onclick={() => eliminarTarea(item.id)} title="Eliminar tarea">
        <Trash2 size={18} color="#ef4444" />
      </button>
    </li>
  {:else}
    <li class="vacio">No hay pendientes.</li>
  {/each}
</ul>
      </div>
    {/if}
  </Panel>
{/if}
 
  {#if $vistaActual === 'circuito'}
  <Panel titulo={creandoCircuito ? "Datos del Circuito" : "Circuitos"}>
    {#if !creandoCircuito}
      <div class="header-tabla">
        <button class="btn-primario" onclick={prepararNuevoCircuito} style="display: flex; align-items: center; gap: 8px;">
          <Plus size={18} /> Nuevo circuito
        </button>
      </div>
      
      <table class="tabla-estilizada">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Idioma</th>
            <th>País</th>
            <th class="col-acciones">Acciones</th> 
          </tr>
        </thead>
        <tbody>
          {#each $circuitos as c, index}
            <tr>
              <td><strong>{c.nombre}</strong></td>
              <td>{c.idioma}</td>
              <td>{c.pais}</td>
              <td class="celda-acciones"> 
                <div class="grupo-botones" style="display: flex; gap: 8px;">
                  <button class="btn-tabla btn-editar" onclick={() => editarCircuito(c, index)} style="display: flex; align-items: center; gap: 4px;">
                    <Pencil size={14} /> Editar
                  </button>
                  <button class="btn-tabla btn-eliminar" onclick={() => eliminarCircuito(index)} style="display: flex; align-items: center; gap: 4px;">
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <div class="form-grande">
        <div class="campo">
            <label for="nombre-circuito">Nombre del Circuito</label>
            <input id="nombre-circuito" bind:value={nuevoCircuito.nombre} />
        </div>
        <div class="campo">
            <label for="idioma-circuito">Idioma</label>
            <input id="idioma-circuito" bind:value={nuevoCircuito.idioma} />
        </div>
        <div class="campo">
            <label for="pais-circuito">País</label>
            <input id="pais-circuito" bind:value={nuevoCircuito.pais} />
        </div>
        <div class="acciones-inferiores">
          <button class="btn-secundario" onclick={() => creandoCircuito = false}>Cancelar</button>
          <button class="btn-primario" onclick={guardarCircuito}>Guardar</button>
        </div>
      </div>
    {/if}
  </Panel>
{/if}
 
  {#if $vistaActual === 'congregaciones'}
  <Panel titulo="Congregaciones">
    {#if !mostrarFormularioCongregacion}
      <div class="flex-end" style="margin-bottom: 15px;">
        <button class="btn-primario" onclick={prepararNuevaCongregacion} style="display: flex; align-items: center; gap: 8px;">
          <Plus size={18} /> Nueva
        </button>
      </div>
      
      <input type="text" placeholder="Buscar..." bind:value={textoBusqueda} class="input-buscador" />
      
      <div style="width: 100%; overflow-x: auto; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
  <table style="width: 100%; min-width: 1000px; border-collapse: collapse; table-layout: fixed;">
    <thead>
      <tr style="background-color: #f8fafc;">
        <th style="width: 80px; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">Número</th>
        <th style="width: 150px; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">Nombre</th>
        <th style="width: 100px; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">Ciudad</th>
        <th style="width: 80px; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">Prov.</th>
        <th style="width: 80px; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">País</th>
        <th style="width: 80px; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">Circuito</th>
        <th style="width: 100px; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">Sucursal</th>
        <th style="width: 120px; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">Entre semana</th>
        <th style="width: 120px; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">Fin de semana</th>
        <th style="width: 100px; padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">Acciones</th>
      </tr>
    </thead>
    <tbody>
      {#each congregacionesFiltradas as c, i}
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px; font-size: 0.85rem;">{c.numero}</td>
          <td style="padding: 10px; font-size: 0.85rem; font-weight: bold;">{c.nombre}</td>
          <td style="padding: 10px; font-size: 0.85rem;">{c.ciudad}</td>
          <td style="padding: 10px; font-size: 0.85rem;">{c.provincia}</td>
          <td style="padding: 10px; font-size: 0.85rem;">{c.pais}</td>
          <td style="padding: 10px; font-size: 0.85rem;">{c.circuito}</td>
          <td style="padding: 10px; font-size: 0.85rem;">{c.sucursal}</td>
          <td style="padding: 10px; font-size: 0.85rem;">{c.reunionEntreSemana} {c.horaEntreSemana}</td>
          <td style="padding: 10px; font-size: 0.85rem;">{c.reunionFinSemana} {c.horaFinSemana}</td>
          <td style="padding: 10px; text-align: center; position: relative;">
      <button 
  class="btn-tabla-accion" 
  onclick={(e) => { 
    e.stopPropagation(); 
    toggleMenu(i); 
  }}
>
  ACCIONES
</button>

      {#if menuAbiertoId === i}
  <div style="position: absolute; right: 10px; top: 40px; z-index: 100; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 140px; overflow: hidden;">
  <button 
    style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 15px; text-align: left; border: none; background: none; cursor: pointer; font-size: 0.85rem; border-bottom: 1px solid #f1f5f9; color: #475569;"
    onclick={() => { editarCongregacion(c, i); cerrarMenu(); }}
  >
    <Pencil size={14} /> Editar
  </button>
  
  <button 
  style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 15px; text-align: left; border: none; background: none; cursor: pointer; font-size: 0.85rem; color: #dc2626;"
  onclick={() => { eliminarCongregacion(c.nombre); cerrarMenu(); }}
>
  <Trash2 size={14} /> Eliminar
</button>
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
            <label for="circuito">Seleccione el circuito *</label>
            <select id="circuito" bind:value={nuevaCongregacion.circuito} class="select-estilizado">
              <option value="" disabled>Seleccione...</option>
              {#each $circuitos as circ}<option value={circ.nombre}>{circ.nombre}</option>{/each}
            </select>
          </div>
          <div class="campo">
            <label for="seccion">Sección del circuito</label>
            <input id="seccion" bind:value={nuevaCongregacion.seccion} placeholder="Ej. A" />
          </div>
          <div class="campo">
            <label for="sucursal">Seleccione la Sucursal</label>
            <input id="sucursal" bind:value={nuevaCongregacion.sucursal} placeholder="Sucursal" />
          </div>
        </div>

        <div class="fila">
          <div class="campo gran-campo">
            <label for="nombre">Nombre de Congregación *</label>
            <input id="nombre" bind:value={nuevaCongregacion.nombre} />
            <small>Solo el nombre, Ej. North Spanish</small>
          </div>
          <div class="campo">
            <label for="numero">Número</label>
            <input id="numero" bind:value={nuevaCongregacion.numero} />
          </div>
          <div class="campo">
            <label for="ciudad">Ciudad *</label>
            <input id="ciudad" bind:value={nuevaCongregacion.ciudad} />
          </div>
        </div>

        <div class="fila">
          <div class="campo">
            <label for="provincia">Estado/Provincia</label>
            <input id="provincia" bind:value={nuevaCongregacion.provincia} />
          </div>
          <div class="campo">
            <label for="pais">País</label>
            <input id="pais" bind:value={nuevaCongregacion.pais} />
          </div>
          <div class="campo">
            <label for="idioma">Seleccione el idioma</label>
            <select id="idioma" bind:value={nuevaCongregacion.idioma} class="select-estilizado">
              <option value="S">Español</option>
              <option value="E">Inglés</option>
            </select>
          </div>
          <div class="campo" style="flex-direction: row; align-items: center; gap: 10px; padding-top: 25px;">
            <input type="checkbox" id="ls" bind:checked={nuevaCongregacion.esLenguaSeñas} />
            <label for="ls">Lengua de señas</label>
          </div>
        </div>

        <div class="fila">
          <div class="campo">
            <label for="tel">Teléfono</label>
            <input id="tel" bind:value={nuevaCongregacion.telefono} placeholder="+53..." />
          </div>
        </div>

        <div class="fila-reunion">
          <div class="campo-reunion">
            <label for="reunion-semana">Reunión de entre semana</label>
            <div class="time-wrapper">
              <input type="text" bind:value={nuevaCongregacion.reunionEntreSemana} placeholder="Día" />
              <input type="time" bind:value={nuevaCongregacion.horaEntreSemana} />
            </div>
          </div>
          <div class="campo-reunion">
            <label for="reunion-fin-semana">Reunión de fin de semana</label>
            <div class="time-wrapper">
              <input type="text" bind:value={nuevaCongregacion.reunionFinSemana} placeholder="Día" />
              <input type="time" bind:value={nuevaCongregacion.horaFinSemana} />
            </div>
          </div>
        </div>

        <div class="acciones-inferiores">
          <button class="btn-secundario" onclick={() => mostrarFormularioCongregacion = false}>Cancelar</button>
          <button class="btn-primario" onclick={guardarCongregacion}>Guardar</button>
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
  <select 
    class="select-exportar" 
    onchange={(e) => {
      const v = e.currentTarget.value;
      if (v === 'csv' || v === 'pdf') exportarDatos(v as 'csv' | 'pdf');
    }}
  >
            <option value="" selected disabled>📥 Exportar informe...</option>
            <option value="csv">Formato CSV</option>
            <option value="pdf">Formato PDF (.pdf)</option>
          </select>
        </div>
          <button class="btn-primario" onclick={() => creandoVisita = true} style="display: inline-flex; align-items: center; gap: 8px;">
            <Plus size={18} /> Registrar Nueva Visita
          </button>
        </div> 

      <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="position: relative; flex: 2; min-width: 180px;">
          <Search size={18} style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #64748b;" />
          <input 
            type="text" 
            placeholder="Buscar congregación..." 
            bind:value={textoBusquedaVisitas}
            style="width: 100%; padding: 8px 8px 8px 35px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;"
          />
          </div>

        <select bind:value={filtroMes} style="flex: 1; min-width: 130px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; cursor: pointer;">
          <option value="Todos">📅 Mes: Todos</option>
          {#each meses as mes}
            <option value={mes}>{mes}</option>
          {/each}
        </select>

        <select bind:value={filtroAnio} style="flex: 1; min-width: 110px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; cursor: pointer;">
          <option value="Todos">🗓️ Año: Todos</option>
          {#each anios as anio}
            <option value={anio}>{anio}</option>
          {/each}
        </select>

        <button 
          onclick={() => { filtroMes = "Todos"; filtroAnio = "Todos"; textoBusquedaVisitas = ""; }}
          style="padding: 8px 12px; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer; color: #475569; font-weight: bold;"
        >
          🔄 RESET
        </button>
      </div>

      <div style="width: 100%; background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
  <table style="width: 100%; table-layout: fixed; border-collapse: collapse;">
    <thead>
      <tr style="background-color: #f8fafc;">
        <th style="width: 20%; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 0.85rem; color: #64748b;">Fecha</th>
        <th style="width: 40%; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 0.85rem; color: #64748b;">Congregación</th>
        <th style="width: 15%; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 0.85rem; color: #64748b;">Tipo</th>
        <th style="width: 25%; padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0; font-size: 0.85rem; color: #64748b;">Acciones</th>
      </tr>
    </thead>
    <tbody>
            {#each visitasFiltradas as v}
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 12px; font-family: monospace; font-size: 0.9rem;">{v.fecha}</td>
          <td style="padding: 10px 12px; font-weight: bold; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{v.congregacionId}</td>
          <td style="padding: 10px 12px; font-size: 0.9rem;">{v.tipo}</td>
          <td style="padding: 10px 12px;">
            <div style="display: flex; gap: 6px; justify-content: center;">
              <button 
                class="btn-tabla-accion" 
                style="padding: 4px 6px; cursor: pointer; border: 1px solid #d1d5db; background: white; border-radius: 4px; font-size: 0.75rem; font-weight: bold; white-space: nowrap;"
                onclick={() => cargarVisitaParaVer(v)}
              >
                VER INFORME
              </button>
              <button 
                type="button"
                style="padding: 4px 6px; cursor: pointer; background-color: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 4px; font-size: 0.75rem; white-space: nowrap;"
                onclick={() => eliminarVisita(v.id)}
              >
                ELIMINAR
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
        <h3>Registrar Nueva Visita</h3>
        
        <div class="fila">
          <div class="campo">
            <label for="v-cong">Seleccione Congregación *</label>
            <select id="v-cong" bind:value={nuevaVisita.congregacionId} class="select-estilizado">
              <option value="">Seleccione...</option>
              {#each $congregaciones as cong}
                <option value={cong.nombre}>{cong.nombre}</option>
              {/each}
            </select>
          </div>
          <div class="campo">
            <label for="v-fecha">Fecha *</label>
            <input type="date" id="v-fecha" bind:value={nuevaVisita.fecha} />
          </div>
        </div>

        <div class="fila">
          <div class="campo">
            <label for="v-tipo">Tipo de Visita</label>
            <select id="v-tipo" bind:value={nuevaVisita.tipo} class="select-estilizado">
              <option value="Regular">Regular</option>
              <option value="Pastoreo">Pastoreo</option>
              <option value="Entrenamiento">Entrenamiento</option>
            </select>
          </div>
        </div>

        <div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; background-color: white;">
          <div class="subtitulo-form" style="font-weight: bold; color: #2d3748; margin-bottom: 15px; font-size: 1.1rem; display: inline-block;">
            1. MINISTERIO CRISTIANO
          </div>

          <button 
            type="button" 
            style="width: 100%; padding: 10px; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #c53030;"
            onclick={() => mostrarPreguntas = !mostrarPreguntas}
          >
            {mostrarPreguntas ? 'OCULTAR PREGUNTAS ▲' : 'VER PREGUNTAS ▼'}
          </button>

          {#if mostrarPreguntas}
            <div style="background: #fff5f5; border-left: 4px solid #e53e3e; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.5; color: #2d3748; border-radius: 0 8px 8px 0;">
              
              <div style="margin-bottom: 15px;">
                <p><strong style="color: #c53030;">Resultados y Facetas:</strong></p>
                <ul style="padding-left: 20px; margin: 5px 0; list-style-type: disc;">
                  <li>¿En qué aspectos del ministerio están teniendo buenos resultados y en cuáles necesitan mejoras?</li>
                  <li>¿Participan los publicadores en diferentes facetas de la predicación?</li>
                  <li>¿Tiene planes la congregación para participar en otras formas (calles, negocios, teléfono, etc.)?</li>
                </ul>
              </div>

              <div style="margin-bottom: 15px;">
                <p><strong style="color: #c53030;">Sobre los Cursos Bíblicos:</strong></p>
                <ul style="padding-left: 20px; margin: 5px 0; list-style-type: disc;">
                  <li>¿El CA ha analizado cómo lograr que se dirijan más cursos bíblicos?</li>
                  <li>¿Los publicadores los ofrecen en toda ocasión apropiada y de manera directa?</li>
                  <li>¿Dan los ancianos y siervos ministeriales buen ejemplo de entusiasmo?</li>
                  <li>¿Brindan los SG ayuda personal y estímulo a quienes lo necesitan?</li>
                </ul>
              </div>

              <div style="margin-bottom: 15px;">
                <p><strong style="color: #c53030;">Sobre la Predicación de Casa en Casa:</strong></p>
                <ul style="padding-left: 20px; margin: 5px 0; list-style-type: disc;">
                  <li>¿Se da prioridad a la predicación de casa en casa? <small>(S-147-24.04)</small></li>
                  <li>¿Qué actitud manifiestan los publicadores? ¿Entusiastas o con temor?</li>
                  <li>¿Se predica en las horas en que es más probable encontrar a la gente?</li>
                  <li>¿Se dirigen RSC prácticas y bien preparadas? <small>[Km 3/15 4 párrs. 4-7]</small></li>
                </ul>
              </div>

              <div>
                <p><strong style="color: #c53030;">Eficacia y Herramientas:</strong></p>
                <ul style="padding-left: 20px; margin: 5px 0; list-style-type: disc;">
                  <li>¿Necesitan ayuda para ser más eficaces en revisitas o usar herramientas?</li>
                  <li>¿Vuelven a visitar a los que muestran interés en la verdad?</li>
                  <li>¿Se están usando apropiada y eficazmente las publicaciones?</li>
                </ul>
              </div>

            </div>
          {/if}

          <div style="margin-bottom: 20px;">
            <label for="analisis-actividad" style="display: block; font-weight: bold; margin-bottom: 5px;">
                Análisis de Actividad:
            </label>
            <textarea 
              style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 120px;"
              bind:value={nuevaVisita.ministerio.observaciones}
              placeholder="Escribe aquí el análisis basado en las preguntas anteriores..."
            ></textarea>
          </div>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

          <label for="programa-predicacion" style="font-weight: bold; display: block; margin-bottom: 10px;">
              Programa de Predicación:
          </label>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            {#each diasSemana as dia}
              {@const programaDia = nuevaVisita.ministerio.programa.find(p => p.dia === dia)}
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 10px; border: 1px solid {programaDia ? '#3182ce' : '#e2e8f0'}; border-radius: 8px; background: {programaDia ? '#f0f7ff' : '#ffffff'}; min-width: 90px; flex: 1;">
                <label style="display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; font-size: 0.8rem; font-weight: 600; color: #4a5568;">
                  <input type="checkbox" onchange={() => toggleDiaMinisterio(dia)} checked={!!programaDia} />
                  {dia.substring(0, 3)}. 
                </label>
                {#if programaDia}
                  <input type="text" placeholder="00:00" style="width: 65px; padding: 4px; text-align: center; border: 1px solid #3182ce; border-radius: 4px; font-size: 0.8rem;" bind:value={programaDia.hora} />
                {:else}
                  <div style="height: 26px;"></div>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <div style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-weight: bold; color: #2d3748; font-size: 0.95rem; text-transform: uppercase;">
              Atención al Territorio (Rom. 15:23a)
            </div>
            <button 
              type="button" 
              style="padding: 4px 10px; font-size: 0.75rem; background: #ebf8ff; border: 1px solid #90cdf4; color: #2b6cb0; border-radius: 4px; cursor: pointer; font-weight: bold;"
              onclick={() => mostrarPreguntasTerritorio = !mostrarPreguntasTerritorio}
            >
              {mostrarPreguntasTerritorio ? 'OCULTAR PREGUNTAS ▲' : 'VER PREGUNTAS ▼'}
            </button>
          </div>

          {#if mostrarPreguntasTerritorio}
            <div style="background: #ebf8ff; border-left: 4px solid #3182ce; padding: 15px; margin-bottom: 15px; font-size: 0.9rem; color: #2c5282; border-radius: 0 4px 4px 0;">
              <ul style="padding-left: 15px; margin: 0; list-style-type: disc;">
                <li>¿Se están predicando los territorios de manera completa? (Frecuencia y cabalidad).</li>
                <li>¿Se están trabajando los NC antes de dar por terminado un territorio?</li>
                <li>¿Tiene la congregación un mapa grande de toda la zona claramente marcado? <small>(sfg-S 3)</small>.</li>
              </ul>
            </div>
          {/if}
          <textarea style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 80px;" bind:value={nuevaVisita.ministerio.territorioObs} placeholder="Análisis sobre la cobertura del territorio..."></textarea>
        </div>

        <div style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 15px; background-color: #fffaf0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-weight: bold; color: #2d3748; font-size: 0.95rem; text-transform: uppercase;">
              Servicio de Precursor (Regular y Auxiliar)
            </div>
            <button 
              type="button" 
              style="padding: 4px 10px; font-size: 0.75rem; background: #fffaf0; border: 1px solid #fbd38d; color: #9c4221; border-radius: 4px; cursor: pointer; font-weight: bold;"
              onclick={() => mostrarPreguntasPrecursores = !mostrarPreguntasPrecursores}
            >
              {mostrarPreguntasPrecursores ? 'OCULTAR PREGUNTAS ▲' : 'VER PREGUNTAS ▼'}
            </button>
          </div>

          {#if mostrarPreguntasPrecursores}
            <div style="background: #feebc8; border-left: 4px solid #ed8936; padding: 15px; margin-bottom: 15px; font-size: 0.9rem; color: #7b341e; border-radius: 0 4px 4px 0;">
              <ul style="padding-left: 15px; margin: 0; list-style-type: disc;">
                <li>¿Qué actitud manifiestan los hermanos respecto al servicio de precursor?</li>
                <li>¿Están animando a quiénes tienen potencial para que sirvan como precursores?</li>
                <li>¿Los nombrados y sus familias están dando un buen ejemplo? <small>(Heb. 13:17)</small>.</li>
              </ul>
            </div>
          {/if}
          <textarea style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 80px;" bind:value={nuevaVisita.ministerio.precursoresObs} placeholder="Situación y ánimo de los precursores..."></textarea>
        </div> 

        <div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: white;">
  <div class="subtitulo-form" style="font-weight: bold; color: #2d3748; margin-bottom: 15px; font-size: 1.1rem;">
    2. REUNIONES DE CONGREGACIÓN
  </div>

  <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
    <p style="font-weight: bold; font-size: 0.9rem; margin-bottom: 10px; color: #475569; border-bottom: 1px solid #cbd5e0; padding-bottom: 5px;">
      Registro de Asistencia (S-88)
    </p>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; width: 100%;">
  <div class="campo-mini">
    <label for="estudiantes"style="display: block; font-size: 0.8rem; margin-bottom: 4px;">Estudiantes:</label>
    <input type="number" style="width: 100%; box-sizing: border-box;" bind:value={nuevaVisita.reuniones.asistencia.estudiantes} />
  </div>
  <div class="campo-mini">
    <label for="Sacados" style="display: block; font-size: 0.8rem; margin-bottom: 4px;">Sacados:</label>
    <input type="number" style="width: 100%; box-sizing: border-box;" bind:value={nuevaVisita.reuniones.asistencia.sacados} />
  </div>
  <div class="campo-mini">
    <label for="Inactivos" style="display: block; font-size: 0.8rem; margin-bottom: 4px;">Inactivos:</label>
    <input type="number" style="width: 100%; box-sizing: border-box;" bind:value={nuevaVisita.reuniones.asistencia.inactivos} />
  </div>
  <div class="campo-mini">
    <label for="Hijos Testigos" style="display: block; font-size: 0.8rem; margin-bottom: 4px;">Hijos Testigos:</label>
    <input type="number" style="width: 100%; box-sizing: border-box;" bind:value={nuevaVisita.reuniones.asistencia.hijosTestigos} />
  </div>
  <div class="campo-mini">
    <label for="No pueden asistir" style="display: block; font-size: 0.8rem; margin-bottom: 4px;">No pueden asistir:</label>
    <input type="number" style="width: 100%; box-sizing: border-box;" bind:value={nuevaVisita.reuniones.asistencia.noAsisten} />
  </div>
</div>

    <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="background: white; padding: 10px; border-radius: 4px; border: 1px solid #cbd5e0;">
        <span style="font-weight: bold; font-size: 0.8rem; display: block; margin-bottom: 8px;">ENTRE SEMANA (Promedio)</span>
        <div style="display: flex; gap: 10px;">
          <input type="text" placeholder="Aum/Dism" bind:value={nuevaVisita.reuniones.entreSemana.tendencia} style="flex: 2;" />
          <input type="number" placeholder="Faltan" bind:value={nuevaVisita.reuniones.entreSemana.faltan} style="flex: 1;" />
          <input type="text" placeholder="%" bind:value={nuevaVisita.reuniones.entreSemana.porcentaje} style="flex: 1;" />
        </div>
      </div>
      <div style="background: white; padding: 10px; border-radius: 4px; border: 1px solid #cbd5e0; flex: 1; min-width: 0;">
  <span style="font-weight: bold; font-size: 0.8rem; display: block; margin-bottom: 8px;">FIN DE SEMANA (Promedio)</span>
  <div style="display: flex; gap: 8px; width: 100%;">
    <input 
      type="text" 
      placeholder="Aum/Dism" 
      bind:value={nuevaVisita.reuniones.finSemana.tendencia} 
      style="flex: 2; min-width: 0; width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;" 
    />
    <input 
      type="number" 
      placeholder="0" 
      bind:value={nuevaVisita.reuniones.finSemana.faltan} 
      style="flex: 1; min-width: 0; width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;" 
    />
    <input 
      type="text" 
      placeholder="%" 
      bind:value={nuevaVisita.reuniones.finSemana.porcentaje} 
      style="flex: 1; min-width: 0; width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;" 
    />
  </div>
      </div>
    </div>
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #ebf8ff; border: 1px solid #bee3f8; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #2b6cb0;"
    onclick={() => mostrarPreguntasReuniones = !mostrarPreguntasReuniones}
  >
    {mostrarPreguntasReuniones ? 'OCULTAR PREGUNTAS ▲' : 'VER PREGUNTAS ▼'}
  </button>

  {#if mostrarPreguntasReuniones}
    <div style="background: #ebf8ff; border-left: 4px solid #3182ce; padding: 20px; margin-bottom: 20px; font-size: 0.9rem; line-height: 1.6; color: #2c5282; border-radius: 0 8px 8px 0;">
      
      <div style="margin-bottom: 15px;">
        <p><strong>Asistencia y Factores de Aumento:</strong></p>
        <ul style="padding-left: 20px; list-style-type: disc;">
          <li>¿Qué retos están superando los hermanos para asistir?</li>
          <li>Si hubo aumento, ¿qué ha contribuido?</li>
          <li>¿El aumento se debe al esfuerzo de los hermanos o al número de estudiantes y otros que asisten?</li>
        </ul>
      </div>

      <div style="margin-bottom: 15px;">
        <p><strong>Causas de Disminución o Inasistencia:</strong></p>
        <ul style="padding-left: 20px; list-style-type: disc;">
          <li>¿Cuáles son las causas de la disminución? ¿Viajan mucho los hermanos?</li>
          <li>¿Es la enseñanza de calidad? ¿Son los horarios convenientes?</li>
          <li>¿Quiénes se están perdiendo las reuniones y por qué?</li>
          <li>¿Qué medidas toma el CA por los que no pueden asistir (mayores, salud, etc.)?</li>
          <li>¿Qué hacen los ancianos para ayudar a quienes faltan?</li>
          <li>Zonas rurales: ¿Se pueden organizar reuniones como sección en algún poblado?</li>
        </ul>
      </div>

      <div>
        <p><strong>Sobre la Enseñanza:</strong></p>
        <ul style="padding-left: 20px; list-style-type: disc;">
          <li>¿Se presentan con calidad los discursos y otras asignaciones?</li>
          <li>¿Necesitan ayuda los hermanos para mejorar su oratoria?</li>
          <li>¿Están los ancianos capacitando a los SM para enseñar en público?</li>
          <li>Programa de discursos públicos: ¿Mejoras sugeridas? ¿Se invita a oradores?</li>
          <li>¿Los oradores son mayormente de la congregación o invitados?</li>
          <li>Participación: ¿Los comentarios reflejan buena preparación?</li>
        </ul>
      </div>
    </div>
  {/if}

  <div style="margin-top: 10px;">
    <label for="Análisis de las Reuniones y Ensñanza" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis de las Reuniones y Enseñanza:</label>
    <textarea 
      style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 150px;"
      bind:value={nuevaVisita.reuniones.observaciones}
      placeholder="Redacte aquí las observaciones..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: white;">
  <div class="subtitulo-form" style="font-weight: bold; color: #2d3748; margin-bottom: 15px; font-size: 1.1rem;">
    3. PASTOREO
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #2f855a;"
    onclick={() => mostrarPreguntasPastoreo = !mostrarPreguntasPastoreo}
  >
    {mostrarPreguntasPastoreo ? 'OCULTAR PREGUNTAS DE PASTOREO ▲' : 'VER PREGUNTAS DE PASTOREO ▼'}
  </button>

  {#if mostrarPreguntasPastoreo}
    <div style="background: #f0fff4; border-left: 4px solid #38a169; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #22543d; border-radius: 0 8px 8px 0;">
      <ul style="padding-left: 20px; list-style-type: disc;">
        <li>¿Es patente que los publicadores reciben visitas de pastoreo periódicas? ¿Son eficaces tales visitas?</li>
        <li>¿Hay inactivos en la congregación? ¿Qué han hecho los ancianos para ayudarlos a regresar?</li>
        <li>¿Cuántos han sido sacados de la congregación y cuáles han sido las razones?</li>
      </ul>
    </div>
  {/if}

  <div style="display: flex; gap: 20px; margin-bottom: 15px;">
    <div style="flex: 1;">
      <label for="Inactivos en la congregación" style="display: block; font-size: 0.85rem; font-weight: bold; color: #4a5568; margin-bottom: 5px;">Inactivos en la congregación:</label>
      <input 
        type="number" 
        style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 6px;" 
        bind:value={nuevaVisita.pastoreo.inactivos} 
      />
    </div>
    <div style="flex: 1;">
      <label for="Cantidad de sacados" style="display: block; font-size: 0.85rem; font-weight: bold; color: #4a5568; margin-bottom: 5px;">Cantidad de sacados:</label>
      <input 
        type="number" 
        style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 6px;" 
        bind:value={nuevaVisita.pastoreo.sacados} 
      />
    </div>
  </div>

  <div style="margin-top: 10px;">
    <label for="Análisis del Pastoreo y Ayuda Espiritual" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis del Pastoreo y Ayuda Espiritual:</label>
    <textarea 
      style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 120px;"
      bind:value={nuevaVisita.pastoreo.observaciones}
      placeholder="Redacte aquí el análisis sobre la eficacia del pastoreo y las razones de las bajas..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: white;">
  <div class="subtitulo-form" style="font-weight: bold; color: #2d3748; margin-bottom: 15px; font-size: 1.1rem;">
    4. CRECIMIENTO DE LA CONGREGACIÓN
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #fff5f7; border: 1px solid #fed7e2; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #b83280;"
    onclick={() => mostrarPreguntasCrecimiento = !mostrarPreguntasCrecimiento}
  >
    {mostrarPreguntasCrecimiento ? 'OCULTAR PREGUNTAS DE CRECIMIENTO ▲' : 'VER PREGUNTAS DE CRECIMIENTO ▼'}
  </button>

  {#if mostrarPreguntasCrecimiento}
    <div style="background: #fff5f7; border-left: 4px solid #d53f8c; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #702459; border-radius: 0 8px 8px 0;">
      <ul style="padding-left: 20px; list-style-type: disc;">
        <li>¿Están progresando espiritualmente los estudiantes? ¿Qué ha contribuido a su progreso?</li>
        <li>Si algunos no progresan, ¿qué está frenando su avance?</li>
        <li>¿Se dirigen regularmente los cursos bíblicos?</li>
        <li>¿Usan los hermanos las herramientas recomendadas de manera hábil y eficaz?</li>
        <li>¿Invitan semanalmente a los estudiantes a las reuniones?</li>
        <li>¿Los ancianos acompañan a los hermanos a dirigir sus cursos, les ayudan y les dan ánimo?</li>
      </ul>
    </div>
  {/if}

  <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px; background: #fdf2f8; padding: 10px; border-radius: 6px;">
    <label for="¿Se dirigen regularmente los cursos bíblicos?" style="font-size: 0.9rem; font-weight: bold; color: #b83280;">¿Se dirigen regularmente los cursos bíblicos?</label>
    <select bind:value={nuevaVisita.crecimiento.cursosRegulares} style="padding: 4px; border-radius: 4px; border: 1px solid #fed7e2;">
        <option value={true}>Sí</option>
        <option value={false}>No / Algunos</option>
    </select>
  </div>

  <div style="margin-top: 10px;">
    <label for="Análisis del Crecimiento y Estudiantes:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis del Crecimiento y Estudiantes:</label>
    <textarea 
      style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 140px;"
      bind:value={nuevaVisita.crecimiento.observaciones}
      placeholder="Redacte aquí el progreso de los estudiantes, el uso de herramientas y el apoyo de los ancianos..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: white;">
  <div class="subtitulo-form" style="font-weight: bold; color: #2d3748; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 2px solid #ed8936; display: inline-block;">
    5. SUPERINTENDENTE DE SERVICIO (sfg-S 1; od-S 5:28)
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #fffaf0; border: 1px solid #fbd38d; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #9c4221;"
    onclick={() => mostrarPreguntasSuperServicio = !mostrarPreguntasSuperServicio}
  >
    {mostrarPreguntasSuperServicio ? 'OCULTAR PREGUNTAS ▲' : 'VER PREGUNTAS ▼'}
  </button>

  {#if mostrarPreguntasSuperServicio}
    <div style="background: #fffaf0; border-left: 4px solid #ed8936; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #7b341e; border-radius: 0 8px 8px 0;">
      <ul style="padding-left: 20px; list-style-type: disc;">
        <li>¿Visita periódicamente los grupos de servicio al campo?</li>
        <li>¿Cómo realiza las visitas?</li>
        <li>¿Colaboran los SG (Siervos de Grupo) para el éxito de sus visitas?</li>
      </ul>
    </div>
  {/if}

  <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 15px;">
    <span style="font-size: 0.9rem; font-weight: bold; color: #7b341e;">¿Visitas periódicas?:</span>
    <div style="display: flex; gap: 10px;">
        <label><input type="radio" bind:group={nuevaVisita.superintendenteServicio.visitaPeriodica} value="si" /> Sí</label>
        <label><input type="radio" bind:group={nuevaVisita.superintendenteServicio.visitaPeriodica} value="no" /> No</label>
        <label><input type="radio" bind:group={nuevaVisita.superintendenteServicio.visitaPeriodica} value="irregular" /> Irregular</label>
    </div>
  </div>

  <div style="margin-top: 10px;">
    <label for="Observaciones sobre su labor y colaboración de los SG:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Observaciones sobre su labor y colaboración de los SG:</label>
    <textarea 
      style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 120px;"
      bind:value={nuevaVisita.superintendenteServicio.observaciones}
      placeholder="Describa el método de visita y la actitud de los siervos de grupo..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: white;">
  <div class="subtitulo-form" style="font-weight: bold; color: #2d3748; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 2px solid #4a5568; display: inline-block;">
    6. PUBLICACIONES [S-56; S-147]
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #edf2f7; border: 1px solid #cbd5e0; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #4a5568;"
    onclick={() => mostrarPreguntasPublicaciones = !mostrarPreguntasPublicaciones}
  >
    {mostrarPreguntasPublicaciones ? 'OCULTAR REQUISITOS ▲' : 'VER PREGUNTAS DE EXAMEN ▼'}
  </button>

  {#if mostrarPreguntasPublicaciones}
    <div style="background: #edf2f7; border-left: 4px solid #4a5568; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #2d3748; border-radius: 0 8px 8px 0;">
      <ul style="padding-left: 20px; list-style-type: disc;">
        <li>¿Tiene la congregación excedente de publicaciones?</li>
        <li>Las cantidades solicitadas, ¿están en proporción al número de publicadores?</li>
        <li>¿Están capacitando al siervo de publicaciones para cumplir con su asignación?</li>
        <li>¿Se realiza cada mes un inventario de las publicaciones en JW Hub?</li>
        <li>Según el formulario <strong>S-28</strong>, ¿existen controles adecuados para las cantidades que se solicitan?</li>
      </ul>
    </div>
  {/if}

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; background: #f8fafc; padding: 15px; border-radius: 6px;">
    <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #4a5568;">¿Hay excedentes?</span>
        <select bind:value={nuevaVisita.publicaciones.excedente} style="padding: 5px; border-radius: 4px; border: 1px solid #cbd5e0;">
            <option value="no">No</option>
            <option value="si">Sí (Mencionar en análisis)</option>
            <option value="poco">Cantidades mínimas</option>
        </select>
    </div>
    <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #4a5568;">Inventario mensual JW Hub:</span>
        <select bind:value={nuevaVisita.publicaciones.inventarioMensual} style="padding: 5px; border-radius: 4px; border: 1px solid #cbd5e0;">
            <option value={true}>Al día</option>
            <option value={false}>Pendiente / Irregular</option>
        </select>
    </div>
  </div>

  <div style="margin-top: 10px;">
    <label for="Análisis sobre Gestión, Inventarios (S-28) y Capacitación:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis sobre Gestión, Inventarios (S-28) y Capacitación:</label>
    <textarea 
      style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 120px;"
      bind:value={nuevaVisita.publicaciones.observaciones}
      placeholder="Comente sobre la proporcionalidad de los pedidos y la eficacia del siervo..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: white;">
  <div class="subtitulo-form" style="font-weight: bold; color: #2d3748; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 2px solid #6b46c1; display: inline-block;">
    7. METAS Y PROGRESO ESPIRITUAL
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #faf5ff; border: 1px solid #e9d8fd; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #6b46c1;"
    onclick={() => mostrarPreguntasProgreso = !mostrarPreguntasProgreso}
  >
    {mostrarPreguntasProgreso ? 'OCULTAR GUÍA DE ANÁLISIS FAMILIAR ▲' : 'VER PREGUNTAS SOBRE PROGRESO ▼'}
  </button>

  {#if mostrarPreguntasProgreso}
    <div style="background: #faf5ff; border-left: 4px solid #6b46c1; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #44337a; border-radius: 0 8px 8px 0;">
      <div style="margin-bottom: 10px;">
        <strong>Familias y Adoración en Familia:</strong>
        <ul style="padding-left: 20px; list-style-type: disc;">
          <li>¿Reciben los hijos ayuda para ser publicadores y bautizarse? ¿Cursos regulares con publicaciones recomendadas?</li>
          <li>¿Tienen buenos hábitos de estudio personal y adoración en familia? ¿Qué ha contribuido al éxito?</li>
          <li>Si hay dificultades, ¿están ofreciendo ayuda los ancianos?</li>
        </ul>
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Niños y Jóvenes:</strong>
        <ul style="padding-left: 20px; list-style-type: disc;">
          <li>¿Saben leer y entender bien lo que leen? ¿Hábitos de estudio?</li>
          <li>¿Van tras metas espirituales? ¿Reciben ayuda de padres y ancianos?</li>
        </ul>
      </div>
      <div>
        <strong>Matrimonios y Tendencias:</strong>
        <ul style="padding-left: 20px; list-style-type: disc;">
          <li>¿Están unidos y trabajan juntos? ¿Dan buen ejemplo?</li>
          <li>¿Hay alguna tendencia que esté afectando a las familias?</li>
        </ul>
      </div>
    </div>
  {/if}

  <div style="margin-bottom: 15px; background: #f9f7ff; padding: 12px; border-radius: 6px; border: 1px dashed #d6bcfa;">
    <label for="Estado general de hábitos espirituales:" style="font-size: 0.9rem; font-weight: bold; color: #553c9a; display: block; margin-bottom: 8px;">Estado general de hábitos espirituales:</label>
    <div style="display: flex; gap: 15px;">
        <label><input type="radio" bind:group={nuevaVisita.progresoEspiritual.habitosEstudio} value="buenos" /> Buenos / Ejempl</label>
        <label><input type="radio" bind:group={nuevaVisita.progresoEspiritual.habitosEstudio} value="mejorables" /> Nec. mejora</label>
        <label><input type="radio" bind:group={nuevaVisita.progresoEspiritual.habitosEstudio} value="preocupantes" /> Tend negativ.</label>
    </div>
  </div>

  <div style="margin-top: 10px;">
    <label for="Análisis detallado sobre Familias, Jóvenes y Matrimonios:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis detallado sobre Familias, Jóvenes y Matrimonios:</label>
    <textarea 
      style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 160px;"
      bind:value={nuevaVisita.progresoEspiritual.observaciones}
      placeholder="Redacte aquí sobre la calidad del estudio personal, la unidad de los matrimonios y el progreso de los jóvenes..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: white;">
  <div class="subtitulo-form" style="font-weight: bold; color: #2d3748; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 2px solid #2b6cb0; display: inline-block;">
    8. CUERPO DE ANCIANOS Y SIERVOS MINISTERIALES
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #ebf8ff; border: 1px solid #bee3f8; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #2b6cb0;"
    onclick={() => mostrarPreguntasAncianos = !mostrarPreguntasAncianos}
  >
    {mostrarPreguntasAncianos ? 'OCULTAR GUÍA DE EVALUACIÓN ▲' : 'VER PREGUNTAS SOBRE LOS NOMBRADOS ▼'}
  </button>

  {#if mostrarPreguntasAncianos}
    <div style="background: #ebf8ff; border-left: 4px solid #2b6cb0; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #2a4365; border-radius: 0 8px 8px 0;">
      <ul style="padding-left: 20px; list-style-type: disc;">
        <li>¿Llevan la delantera ellos y sus familias en la predicación? ¿Podrían algunos ser precursores?</li>
        <li>¿Están dando atención al pastoreo periódico?</li>
        <li>¿Es su enseñanza de calidad y eficaz?</li>
        <li>¿Existe un ambiente de confianza y cariño entre los nombrados y los demás publicadores?</li>
        <li>¿Hay unidad en el Cuerpo de Ancianos?</li>
        <li>¿Tienen un programa de capacitación para ayudar a los hermanos a progresar espiritualmente?</li>
      </ul>
    </div>
  {/if}

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; background: #f7fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
    <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #2d3748;">Unidad del Cuerpo:</span>
        <select bind:value={nuevaVisita.cuerpoNombrados.unidadCuerpo} style="padding: 5px; border-radius: 4px; border: 1px solid #cbd5e0;">
            <option value="buena">Buena Unidad</option>
            <option value="regular">Regular / Trabajando en ello</option>
            <option value="problemas">Existen diferencias notables</option>
        </select>
    </div>
    <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #2d3748;">Programa de Capacitación:</span>
        <select bind:value={nuevaVisita.cuerpoNombrados.programaCapacitacion} style="padding: 5px; border-radius: 4px; border: 1px solid #cbd5e0;">
            <option value={true}>Activo y en marcha</option>
            <option value={false}>No existe / Pendiente</option>
        </select>
    </div>
  </div>

  <div style="margin-top: 10px;">
    <label for="Análisis sobre el ejemplo, unidad y eficacia de los nombrados:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis sobre el ejemplo, unidad y eficacia de los nombrados:</label>
    <textarea 
      style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 160px;"
      bind:value={nuevaVisita.cuerpoNombrados.observaciones}
      placeholder="Comente sobre el ambiente de confianza, la calidad de la enseñanza y la disposición para pastorear..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: white;">
  <div class="subtitulo-form" style="font-weight: bold; color: #2d3748; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 2px solid #38a169; display: inline-block;">
    9. LOCAL DE REUNIÓN
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #2f855a;"
    onclick={() => mostrarPreguntasLocal = !mostrarPreguntasLocal}
  >
    {mostrarPreguntasLocal ? 'OCULTAR PREGUNTAS SOBRE EL LOCAL ▲' : 'VER PREGUNTAS SOBRE EL LOCAL ▼'}
  </button>

  {#if mostrarPreguntasLocal}
    <div style="background: #f0fff4; border-left: 4px solid #38a169; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #22543d; border-radius: 0 8px 8px 0;">
      <div style="margin-bottom: 10px;">
        <strong>Limpieza y Cuidado:</strong>
        <ul style="padding-left: 20px; list-style-type: disc;">
          <li>¿Está el local bien cuidado? ¿Funciona bien el programa de limpieza?</li>
          <li>¿Participan todos los que pueden (incluyendo niños y jóvenes)?</li>
          <li>¿Tablero de anuncios actualizado?</li>
        </ul>
      </div>
      <div>
        <strong>Seguridad y LDC:</strong>
        <ul style="padding-left: 20px; list-style-type: disc;">
          <li>¿Hay un plan de seguridad para reuniones y se sigue?</li>
          <li>¿Se vela por la seguridad en tareas de reparación?</li>
          <li>¿Se siguen las instrucciones del LDC mediante el Capacitador de Mantenimiento?</li>
        </ul>
      </div>
    </div>
  {/if}

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; background: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
    <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #374151;">Programa de Limpieza:</span>
        <select bind:value={nuevaVisita.localReunion.programaLimpieza} style="padding: 5px; border-radius: 4px; border: 1px solid #d1d5db;">
            <option value="si">Funciona bien</option>
            <option value="mejorable">Necesita ajustes</option>
            <option value="no">Deficiente / No existe</option>
        </select>
    </div>
    <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #374151;">Plan de Seguridad:</span>
        <select bind:value={nuevaVisita.localReunion.planSeguridad} style="padding: 5px; border-radius: 4px; border: 1px solid #d1d5db;">
            <option value={true}>Establecido y en uso</option>
            <option value={false}>No establecido / No se sigue</option>
        </select>
    </div>
  </div>

  <div style="margin-top: 10px;">
    <label for="Análisis sobre Mantenimiento, Seguridad y LDC:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis sobre Mantenimiento, Seguridad y LDC:</label>
    <textarea 
      style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 140px;"
      bind:value={nuevaVisita.localReunion.observaciones}
      placeholder="Comente sobre la participación de los jóvenes, el estado del tablero y el uso del Capacitador de Mantenimiento..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: white;">
  <div class="subtitulo-form" style="font-weight: bold; color: #2d3748; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 2px solid #718096; display: inline-block;">
    10. IRREGULARES E INACTIVOS
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #4a5568;"
    onclick={() => mostrarPreguntasInactivos = !mostrarPreguntasInactivos}
  >
    {mostrarPreguntasInactivos ? 'OCULTAR GUÍA DE ANÁLISIS ▲' : 'VER PREGUNTAS SOBRE INACTIVOS ▼'}
  </button>

  {#if mostrarPreguntasInactivos}
    <div style="background: #f7fafc; border-left: 4px solid #718096; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #2d3748; border-radius: 0 8px 8px 0;">
      <ul style="padding-left: 20px; list-style-type: disc;">
        <li>Hablar sobre las razones de su irregularidad / inactividad.</li>
        <li>¿De qué manera se les puede ayudar eficazmente?</li>
        <li>¿Qué acciones concretas han tomado los ancianos para ayudarlos a regresar?</li>
      </ul>
    </div>
  {/if}

  <div style="margin-bottom: 15px; background: #edf2f7; padding: 12px; border-radius: 6px; display: flex; align-items: center; gap: 10px;">
    <label for="¿Existe un plan de ayuda definido por los ancianos?" style="font-size: 0.9rem; font-weight: bold; color: #4a5568;">¿Existe un plan de ayuda definido por los ancianos?</label>
    <select bind:value={nuevaVisita.analisisInactivos.planAccion} style="padding: 4px; border-radius: 4px; border: 1px solid #cbd5e0;">
        <option value={true}>Sí</option>
        <option value={false}>No / En proceso</option>
    </select>
  </div>

  <div style="margin-top: 10px;">
    <label for="Análisis de causas y labor de ayuda:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis de causas y labor de ayuda:</label>
    <textarea 
      style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 140px;"
      bind:value={nuevaVisita.analisisInactivos.observaciones}
      placeholder="Describa las razones detectadas (salud, espirituales, desánimo) y las medidas de pastoreo que se están aplicando..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: #fffaf0;">
  <div class="subtitulo-form" style="font-weight: bold; color: #7b341e; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 2px solid #ed8936; display: inline-block;">
    11. ANÁLISIS DE LA ACTIVIDAD DE LOS PRECURSORES
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #feebc8; border: 1px solid #fbd38d; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #9c4221;"
    onclick={() => mostrarPreguntasDetallePrecursores = !mostrarPreguntasDetallePrecursores}
  >
    {mostrarPreguntasDetallePrecursores ? 'OCULTAR GUÍA DE ANÁLISIS ▲' : 'VER PREGUNTAS SOBRE PRECURSORES ▼'}
  </button>

  {#if mostrarPreguntasDetallePrecursores}
    <div style="background: #fffaf0; border-left: 4px solid #ed8936; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #7b341e; border-radius: 0 8px 8px 0;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <ul style="padding-left: 20px; list-style-type: disc;">
          <li>¿Cómo marcha el año de servicio? ¿Tienen horario práctico?</li>
          <li>¿Participan en todas las facetas y dirigen cursos regularmente?</li>
          <li>¿Usan publicaciones recomendadas y siguen sugerencias?</li>
          <li>¿Reciben estímulo y apoyo de los ancianos?</li>
        </ul>
        <ul style="padding-left: 20px; list-style-type: disc;">
          <li>¿Asisten a las reuniones de servicio? Si no, ¿por qué?</li>
          <li>¿Tienden a salir precursor con precursor? ¿Por qué?</li>
          <li>¿Animan a otros a emprender el servicio o mejorar su ministerio?</li>
        </ul>
      </div>
    </div>
  {/if}

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; background: white; padding: 15px; border-radius: 6px; border: 1px solid #fbd38d;">
    <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #7b341e;">Apoyo de los ancianos:</span>
        <select bind:value={nuevaVisita.precursoresAnalisis.apoyoAncianos} style="padding: 5px; border-radius: 4px; border: 1px solid #cbd5e0;">
            <option value="si">Excelente apoyo</option>
            <option value="irregular">Podría mejorar</option>
            <option value="no">Escaso estímulo</option>
        </select>
    </div>
    <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #7b341e;">Horarios prácticos:</span>
        <select bind:value={nuevaVisita.precursoresAnalisis.horarioPractico} style="padding: 5px; border-radius: 4px; border: 1px solid #cbd5e0;">
            <option value={true}>La mayoría tiene horario fijo</option>
            <option value={false}>Tienen dificultades con las horas</option>
        </select>
    </div>
  </div>

  <div style="margin-top: 10px;">
    <label for="Observaciones sobre el desempeño y espíritu de los precursores:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Observaciones sobre el desempeño y espíritu de los precursores:</label>
    <textarea 
      style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 150px;"
      bind:value={nuevaVisita.precursoresAnalisis.observaciones}
      placeholder="Comente sobre el uso de publicaciones, asistencia a reuniones de servicio y la tendencia de salir acompañados..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: white;">
  <div class="subtitulo-form" style="font-weight: bold; color: #2d3748; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 2px solid #319795; display: inline-block;">
    12. CONTABILIDAD Y COMITÉ DE MANTENIMIENTO
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #e6fffa; border: 1px solid #b2f5ea; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #2c7a7b;"
    onclick={() => mostrarPreguntasContabilidad = !mostrarPreguntasContabilidad}
  >
    {mostrarPreguntasContabilidad ? 'OCULTAR PUNTOS DE REVISIÓN ▲' : 'VER PREGUNTAS DE CONTABILIDAD ▼'}
  </button>

  {#if mostrarPreguntasContabilidad}
    <div style="background: #e6fffa; border-left: 4px solid #319795; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #234e52; border-radius: 0 8px 8px 0;">
      <ul style="padding-left: 20px; list-style-type: disc;">
        <li><strong>Contabilidad en línea:</strong> ¿Han probado la función de contabilidad en línea según la instrucción S147_S_202506?</li>
        <li><strong>Revisión de Archivos:</strong> Analizar cualquier pregunta o duda que haya surgido al revisar los registros contables físicos o digitales.</li>
        <li><strong>Comité de Mantenimiento:</strong> Si aplica, evaluar la coordinación entre contabilidad y los gastos de mantenimiento del local.</li>
      </ul>
    </div>
  {/if}

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; background: #f0fff4; padding: 15px; border-radius: 6px; border: 1px solid #b2f5ea;">
    <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #234e52;">Función en línea (S-147):</span>
        <select bind:value={nuevaVisita.contabilidad.contabilidadEnLinea} style="padding: 5px; border-radius: 4px; border: 1px solid #cbd5e0;">
            <option value="no">No utilizada aún</option>
            <option value="si">Implementada con éxito</option>
            <option value="proceso">En proceso de prueba</option>
        </select>
    </div>
    <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #234e52;">Revisión de archivos:</span>
        <select bind:value={nuevaVisita.contabilidad.archivosRevisados} style="padding: 5px; border-radius: 4px; border: 1px solid #cbd5e0;">
            <option value={true}>Archivos en orden</option>
            <option value={false}>Se hallaron discrepancias</option>
        </select>
    </div>
  </div>

  <div style="margin-top: 10px;">
    <label for="Observaciones sobre Contabilidad y Archivos:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Observaciones sobre Contabilidad y Archivos:</label>
    <textarea 
      style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 120px;"
      bind:value={nuevaVisita.contabilidad.observaciones}
      placeholder="Detalle aquí el progreso con la contabilidad en línea y cualquier hallazgo relevante en la auditoría de archivos..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 2px solid #feb2b2; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: #fff5f5;">
  <div class="subtitulo-form" style="font-weight: bold; color: #c53030; margin-bottom: 15px; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;">
    <span style="font-size: 1.4rem;">⚠️</span> 13. PROBLEMAS GRAVES QUE REQUIERAN ATENCIÓN
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #fed7d7; border: 1px solid #feb2b2; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #9b2c2c;"
    onclick={() => mostrarPreguntasProblemas = !mostrarPreguntasProblemas}
  >
    {mostrarPreguntasProblemas ? 'OCULTAR GUÍA DE PRIORIDAD ▲' : 'VER PUNTOS DE ATENCIÓN ▼'}
  </button>

  {#if mostrarPreguntasProblemas}
    <div style="background: white; border-left: 4px solid #c53030; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #742a2a; border-radius: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <ul style="padding-left: 20px; list-style-type: disc;">
        <li>¿Existen problemas de conducta, desunión o doctrinales que amenacen la paz de la congregación?</li>
        <li>¿Hay asuntos legales o de abuso que requieran atención inmediata?</li>
        <li>¿Existen negligencias graves en la administración de fondos o en el cuidado del Salón?</li>
        <li>¿Se requiere de la intervención o guía adicional de la Sucursal?</li>
      </ul>
    </div>
  {/if}

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; background: white; padding: 15px; border-radius: 6px; border: 1px solid #feb2b2;">
    <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #c53030;">Nivel de Urgencia:</span>
        <select bind:value={nuevaVisita.problemasGraves.nivelUrgencia} style="padding: 5px; border-radius: 4px; border: 1px solid #cbd5e0;">
            <option value="bajo">Bajo (Solo seguimiento)</option>
            <option value="medio">Medio (Requiere acción en la visita)</option>
            <option value="alto">Alto (Crítico / Prioridad máxima)</option>
        </select>
    </div>
    <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #c53030;">¿Notificar a Sucursal?:</span>
        <select bind:value={nuevaVisita.problemasGraves.requiereIntervencionSucursal} style="padding: 5px; border-radius: 4px; border: 1px solid #cbd5e0;">
            <option value={false}>No por ahora</option>
            <option value={true}>SÍ, se requiere guía de la Sucursal</option>
        </select>
    </div>
  </div>

  <div style="margin-top: 10px;">
    <label for="Descripción detallada del problema y medidas tomadas:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem; color: #c53030;">Descripción detallada del problema y medidas tomadas:</label>
    <textarea 
      style="width: 100%; border: 1px solid #feb2b2; border-radius: 6px; padding: 10px; min-height: 140px; background-color: #fff;"
      bind:value={nuevaVisita.problemasGraves.observaciones}
      placeholder="Describa con claridad el problema, las personas implicadas y qué pasos se han dado hasta ahora..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: #f8fafc;">
  <div class="subtitulo-form" style="font-weight: bold; color: #4a5568; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 2px solid #718096; display: inline-block;">
    14. MISCELÁNEOS
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #edf2f7; border: 1px solid #cbd5e0; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #4a5568;"
    onclick={() => mostrarPreguntasMiscelaneos = !mostrarPreguntasMiscelaneos}
  >
    {mostrarPreguntasMiscelaneos ? 'OCULTAR GUÍA ▲' : 'VER PUNTOS ADICIONALES ▼'}
  </button>

  {#if mostrarPreguntasMiscelaneos}
    <div style="background: white; border-left: 4px solid #718096; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #2d3748; border-radius: 0 8px 8px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <ul style="padding-left: 20px; list-style-type: disc;">
        <li>Asuntos locales específicos que no corresponden a los módulos anteriores.</li>
        <li>Situaciones excepcionales surgidas durante la semana de la visita.</li>
        <li>Reconocimientos especiales o esfuerzos loables de la congregación.</li>
        <li>Acuerdos menores tomados con el Cuerpo de Ancianos que no son "Problemas Graves".</li>
      </ul>
    </div>
  {/if}

  <div style="margin-bottom: 15px; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px;">
    <label for="¿Quedan temas pendientes para la próxima visita?" style="font-size: 0.9rem; font-weight: bold; color: #4a5568;">¿Quedan temas pendientes para la próxima visita?</label>
    <select bind:value={nuevaVisita.miscelaneos.temasPendientes} style="padding: 4px; border-radius: 4px; border: 1px solid #cbd5e0;">
        <option value={false}>No, todo concluido</option>
        <option value={true}>Sí, anotar en el análisis</option>
    </select>
  </div>

  <div style="margin-top: 10px;">
    <label for="Otros temas y observaciones adicionales:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Otros temas y observaciones adicionales:</label>
    <textarea 
      style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 120px;"
      bind:value={nuevaVisita.miscelaneos.observaciones}
      placeholder="Utilice este espacio para cualquier otro asunto relevante detectado durante la visita..."
    ></textarea>
  </div>
</div>

<div class="seccion-form-bloque" style="border: 1px solid #cbd5e0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: #f1f5f9;">
  <div class="subtitulo-form" style="font-weight: bold; color: #1e293b; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 2px solid #64748b; display: inline-block;">
    15. IDEAS PARA DISCURSOS DE SERVICIO
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #475569;"
    onclick={() => mostrarPreguntasDiscursos = !mostrarPreguntasDiscursos}
  >
    {mostrarPreguntasDiscursos ? 'OCULTAR SUGERENCIAS DE ENFOQUE ▲' : 'VER SUGERENCIAS DE ENFOQUE ▼'}
  </button>

  {#if mostrarPreguntasDiscursos}
    <div style="background: white; border-left: 4px solid #64748b; padding: 15px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #334155; border-radius: 0 8px 8px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="margin-bottom: 8px;"><strong>Temas útiles para la congregación:</strong></p>
      <ul style="padding-left: 20px; list-style-type: disc;">
        <li>Elogios específicos por lo visto en la semana.</li>
        <li>Cómo mejorar la calidad de las revisitas.</li>
        <li>Animar a los jóvenes con metas progresivas.</li>
      </ul>
    </div>
  {/if}

  <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
    
    <div style="background: #ffffff; border: 1px solid #bee3f8; padding: 15px; border-radius: 8px; border-left: 5px solid #3182ce; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <label for="Sugerencias del Cuerpo de Ancianos (para mencionar):" style="display: block; font-weight: bold; margin-bottom: 8px; font-size: 0.9rem; color: #2b6cb0;">
        📢 Sugerencias del Cuerpo de Ancianos (para mencionar):
      </label>
      <textarea 
        style="width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; min-height: 80px; background-color: #f0f7ff; font-style: italic;"
        bind:value={nuevaVisita.ideasDiscursos.sugerenciasAncianos}
        placeholder="¿Qué puntos específicos quieren los ancianos que usted refuerce?"
      ></textarea>
    </div>

    <div>
      <label for="Textos bíblicos seleccionados:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem; color: #334155;">Textos bíblicos seleccionados:</label>
      <input 
        type="text" 
        style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px;"
        bind:value={nuevaVisita.ideasDiscursos.textosBiblicos}
        placeholder="Ej: Hechos 20:20; 2 Tim. 4:5..."
      />
    </div>

    <div>
      <label for="Esquema y puntos clave personales:" style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem; color: #334155;">Esquema y puntos clave personales:</label>
      <textarea 
        style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 140px;"
        bind:value={nuevaVisita.ideasDiscursos.puntosClave}
        placeholder="Desarrolle aquí sus ideas principales y aplicaciones prácticas para la congregación..."
      ></textarea>
    </div>
  </div>
  </div>

  <div class="seccion-form-bloque" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; background-color: #fdf2f2;">
  <div class="subtitulo-form" style="font-weight: bold; color: #9b2c2c; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 2px solid #e53e3e; display: inline-block;">
    16. SUGERENCIAS SOBRE REUNIONES (Observaciones de la semana)
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #c53030;"
    onclick={() => mostrarSugerenciasReuniones = !mostrarSugerenciasReuniones}
  >
    {mostrarSugerenciasReuniones ? 'OCULTAR GUÍA DE OBSERVACIÓN ▲' : 'VER PUNTOS A EVALUAR (S-38) ▼'}
  </button>

  {#if mostrarSugerenciasReuniones}
    <div style="background: white; border-left: 4px solid #e53e3e; padding: 20px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; color: #742a2a; border-radius: 0 8px 8px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p><strong>De acuerdo con S-38 y sfg-S cap. 4:</strong></p>
      <ul style="padding-left: 20px; list-style-type: disc;">
        <li><strong>Vida y Ministerio:</strong> Revise si los formularios S-89 se entregan con semanas de antelación y si el consejero auxiliar actúa con tacto y eficacia.</li>
        <li><strong>Fin de Semana:</strong> Observe si el conductor del Estudio de La Atalaya hace preguntas adicionales breves para resaltar puntos clave y si anima a participar con sus propias palabras.</li>
      </ul>
    </div>
  {/if}

  <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
    <div style="background: white; border: 1px solid #fed7d7; padding: 15px; border-radius: 6px;">
      <h4 style="font-size: 0.9rem; color: #9b2c2c; margin-bottom: 10px; font-weight: bold;">Vida y Ministerio Cristianos</h4>
      
      <label for="Procedimiento de asignaciones (S-89/Tablero):" style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 5px;">Procedimiento de asignaciones (S-89/Tablero):</label>
      <textarea 
        style="width: 100%; border: 1px solid #cbd5e0; border-radius: 4px; padding: 8px; margin-bottom: 10px; min-height: 60px;"
        bind:value={nuevaVisita.observacionesReuniones.vidaMinisterio.asignacionesS89}
        placeholder="Anote sus sugerencias sobre el orden y la prontitud..."></textarea>

      <label for="Función del consejero auxiliar:" style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 5px;">Función del consejero auxiliar:</label>
      <textarea 
        style="width: 100%; border: 1px solid #cbd5e0; border-radius: 4px; padding: 8px; min-height: 60px;"
        bind:value={nuevaVisita.observacionesReuniones.vidaMinisterio.consejeroAuxiliar}
        placeholder="Observaciones sobre cómo se está brindando la ayuda a los estudiantes..."></textarea>
    </div>

    <div style="background: white; border: 1px solid #fed7d7; padding: 15px; border-radius: 6px;">
      <h4 style="font-size: 0.9rem; color: #9b2c2c; margin-bottom: 10px; font-weight: bold;">Reunión del Fin de Semana</h4>
      <label for="Estudio de La Atalaya:" style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 5px;">Estudio de La Atalaya:</label>
      <textarea 
        style="width: 100%; border: 1px solid #cbd5e0; border-radius: 4px; padding: 8px; min-height: 80px;"
        bind:value={nuevaVisita.observacionesReuniones.finDeSemana.estudioAtalaya}
        placeholder="Sugerencias para el conductor o sobre la calidad de los comentarios..."></textarea>
    </div>
  </div>
</div>

        <div class="campo" style="margin-top: 20px; display: flex; flex-direction: column;">
          <label for="v-obs" style="font-weight: bold; margin-bottom: 5px;">Observaciones Finales / Pendientes</label>
          <textarea id="v-obs" bind:value={nuevaVisita.observacionesFinales} rows="4" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;" placeholder="Temas adicionales o seguimiento..."></textarea>
        </div>

        <div class="acciones-inferiores" style="margin-top: 20px; display: flex; gap: 10px;">
          <button class="btn-secundario" onclick={() => creandoVisita = false}>Cancelar</button>
          <button class="btn-primario" onclick={guardarVisita}>Guardar Registro Completo</button>
        </div>
      </div> 
    {/if}
  </Panel>
{/if}

{#if $vistaActual === 'informes'}
  <Panel titulo="Estadísticas Mensuales">
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Visitas este mes</span>
        <span class="stat-value">{statsMes.total}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Congregaciones</span>
        <span class="stat-value">{statsMes.congreDistintas}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Promedio semanal</span>
        <span class="stat-value">{statsMes.promedioPorSemana}</span>
      </div>
    </div>

    <div class="config-card" style="margin-top: 20px;">
      <h3>📋 Detalle de Visitas</h3>
      {#if statsMes.total === 0}
        <p class="texto-vacio">No hay visitas registradas este mes aún.</p>
      {:else}
        <ul class="lista-informe">
          {#each visitasMesActual as visita}
            <li>
              <strong>{new Date(visita.fecha + 'T00:00:00').toLocaleDateString()}</strong>: 
              {visita.congregacionId} 
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </Panel>
{/if}

{#if $vistaActual === 'configuracion'}
  <div class="config-container" in:fade>
    <header class="config-header">
      <h1>Configuración</h1>
      <p>Gestiona los datos y preferencias de la aplicación</p>
    </header>

    <div class="config-grid">
      <section class="config-card">
        <h3>📦 Gestión de Datos</h3>
        <p>Copia de seguridad y restauración (útil para mover datos entre PCs)</p>
        <div class="acciones-datos">
          <button class="btn-config" onclick={exportarBackup}>
           📥 Exportar Backup (JSON)
          </button>

          <button class="btn-config btn-secundario" onclick={importarBackup}>
           📤 Importar Datos
          </button>
  
        </div>
      </section>

      <section class="config-card">
        <h3>💻 Información del Sistema</h3>
        <div class="info-item">
          <span>Versión:</span>
          <strong>1.0.0 (Tauri Desktop)</strong>
        </div>
        <div class="info-item">
          <span>Ubicación:</span>
          <strong>Holguín, Cuba</strong>
        </div>
      </section>

      <section class="config-card">
  <h3>🎨 Apariencia</h3>
  <p>Personaliza los colores y el estilo visual de tu asistente.</p>
  
  <div class="config-item">
    <span>Tema del sistema:</span>
    <select class="select-estilizado" bind:value={$temaOscuro}>
      <option value={false}>☀️ Modo Claro</option>
      <option value={true}>🌙 Modo Oscuro</option>
    </select>
  </div>

  <div class="config-item" style="margin-top: 15px;">
    <span>Color de acento:</span>
    <div class="selector-colores">
      <button 
  class="color-dot" 
  style="background: #b63a3a;" 
  aria-label="Cambiar color de acento a rojo"
  onclick={() => $colorAcento = '#b63a3a'}
  class:activo={$colorAcento === '#b63a3a'}></button>

<button 
  class="color-dot" 
  style="background: #2b6cb0;" 
  aria-label="Cambiar color de acento a azul"
  onclick={() => $colorAcento = '#2b6cb0'}
  class:activo={$colorAcento === '#2b6cb0'}></button>

<button 
  class="color-dot" 
  style="background: #2d3748;" 
  aria-label="Cambiar color de acento a gris oscuro"
  onclick={() => $colorAcento = '#2d3748'}
  class:activo={$colorAcento === '#2d3748'}></button>
    </div>
  </div>
</section>

      <section class="config-card">
        <h3 style="color: #dc2626;">⚠️ Zona Peligrosa</h3>
        <p>Esto borrará todas las congregaciones y visitas guardadas.</p>
        <button class="btn-eliminar" onclick={limpiarTodo}>
          Borrrar todos los datos
        </button>
      </section>
    </div>
  </div>
{/if}
</main>
 
<style>
  :global(html, body) {
  overflow-x: hidden; /* Prohibido el scroll horizontal en toda la app */
  width: 100%;
  position: relative;
}
  :global(body) { font-family: "Segoe UI", sans-serif; margin: 0; background-color: #f5f5f5; }
  main { padding: 15px; padding-bottom: 80px; max-width: 1200px; margin: 0 auto; }
  .acciones { display: flex; gap: 10px; margin-bottom: 15px; }
  .acciones button { padding: 8px 15px; border-radius: 20px; border: 1px solid #ccc; background: white; cursor: pointer; }
  .acciones button.activo { background: #ede9fb; border-color: #5b4cc4; color: #5b4cc4; font-weight: bold; }

  .btn-tabla-accion { background: white; color: #2d3748; border: 1px solid #cbd5e0; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; cursor: pointer; }

  .btn-primario { background: #5b4cc4; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
  .btn-secundario { background: #f0f0f0; border: 1px solid #ccc; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
  .form-grande { 
  background: white; 
  padding: 20px; 
  border-radius: 8px; 
  width: 100%;       /* Ocupa el ancho disponible */
  box-sizing: border-box; /* Incluye el padding en el cálculo del ancho */
  overflow-x: hidden; /* Evita que el formulario mismo cree scroll horizontal */
}
  .fila { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
  .campo { flex: 1 1 200px; display: flex; flex-direction: column; min-width: 0; }
  .campo input, .select-estilizado, textarea { width: 100%; box-sizing: border-box; padding: 8px; border: none; border-bottom: 1px solid #ccc; background: #fafafa; }
  .fila-reunion { 
  display: grid; 
  /* 'auto-fit' hará que si no caben dos columnas de 250px, se pongan una debajo de otra */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
  gap: 15px; 
  background: #f9f9f9; 
  padding: 15px; 
  border-radius: 8px; /* Un toque estético */
}
  /* Forzamos que los inputs de hora no empujen el ancho */
.time-wrapper { 
  display: flex; 
  gap: 5px; 
  flex-wrap: wrap; /* Si el label y el input no caben, se envuelven */
}

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

  /* Efecto visual cuando pasas el ratón por encima del botón de preguntas */
  button[type="button"]:hover {
    background-color: #e2e8f0 !important;
    transition: background-color 0.2s;
  }

  /* Mejora de los labels de los días */
  label {
    user-select: none; /* Evita que el texto se sombreado al hacer clic rápido */
  }

  .config-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    padding-bottom: 100px;
  }

  .config-header {
    margin-bottom: 30px;
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .config-card {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow-wrap: break-word; /* Si hay un título muy largo, lo rompe para que no empuje */
    background: white;
    padding: 15px !important;
    margin-bottom: 10px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .config-card h3 {
    margin-top: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .acciones-datos {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
  }

  .btn-config {
    background: #b63a3a; /* Tu color de marca */
    color: white;
    border: none;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
  }

  .btn-secundario {
    background: #f1f5f9;
    color: #475569;
  }

  .btn-eliminar {
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fca5a5;
    padding: 10px;
    width: 90%;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 10px;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.9rem;
  }

  /* ESTILOS PARA MODO OSCURO */
/* El :global es necesario para que afecte a toda la pantalla */
:global(body.dark-mode) {
  background-color: #121212 !important; /* Fondo casi negro */
  color: #ffffff !important;           /* Texto blanco */
}

/* Cambia el color de las tarjetas de configuración en modo oscuro */
:global(body.dark-mode .config-card) {
  background-color: #1e1e1e !important;
  border-color: #333333 !important;
  color: #ffffff !important;
}

/* Cambia el color de las tablas y textos secundarios */
:global(body.dark-mode td), 
:global(body.dark-mode th),
:global(body.dark-mode p) {
  color: #e0e0e0 !important;
}

/* Estilo para los selectores en modo oscuro */
:global(body.dark-mode .select-estilizado) {
  background-color: #2d3748;
  color: white;
  border: 1px solid #4a5568;
}
  /* Botón Editar - Estilo neutral */
  .btn-editar {
    background-color: #f1f5f9;
    color: #475569;
    border-color: #e2e8f0;
  }

  .btn-editar:hover {
    background-color: #e2e8f0;
    color: #1e293b;
  }

  /* Botón Eliminar - Estilo de advertencia */
   .btn-borrar {
    background: #fff1f2; /* Fondo rojo muy suave */
    border: 1px solid #ffe4e6;
    border-radius: 8px;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
  }

  /* Efecto al pasar el ratón */
  .btn-borrar:hover {
    background-color: #ffe4e6;
    transform: scale(1.1);
    border-color: #fca5a5;
  }
  /* Contenedor del botón superior */
  .header-tabla {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 15px;
  }

  /* Tabla Estilizada */
  .tabla-estilizada {
    width: 90%;
    border-collapse: collapse;
    background: white;
  }

  .tabla-estilizada th, .tabla-estilizada td {
    padding: 12px;
    border-bottom: 1px solid #eee;
    text-align: left;
  }

  /* ALINEACIÓN DE ACCIONES */
  .col-acciones {
    text-align: center !important;
  }

  .celda-acciones {
    width: 180px; /* Ancho fijo para que no se mueva */
  }

  .grupo-botones {
    display: flex;
    gap: 8px;
    justify-content: center; /* Centra los botones bajo el título 'Acciones' */
  }

  /* Botones internos de la tabla */
  .btn-tabla {
    flex: 1; /* Ambos botones ocupan el mismo espacio */
    padding: 6px 0;
    font-size: 0.85rem;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
  }

  .btn-editar {
    background-color: #f1f5f9;
    color: #475569;
    border-color: #e2e8f0;
  }

  .btn-eliminar {
    background-color: #fef2f2;
    color: #dc2626;
    border-color: #fee2e2;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    border: 1px solid #eee;
  }

  .stat-label {
    display: block;
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 5px;
  }

  .stat-value {
    display: block;
    font-size: 1.8rem;
    font-weight: bold;
    color: #b63a3a; /* Tu color de acento rojo */
  }

  /* Adaptación a Modo Oscuro */
  :global(body.dark-mode) .stat-card {
    background: #1e1e1e;
    border-color: #333;
  }
  
  :global(body.dark-mode) .stat-label {
    color: #94a3b8;
  }

  .tarea-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f9f9f9;
    border-radius: 8px;
    margin-bottom: 8px;
    border-left: 4px solid #b63a3a;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    animation: entradaSuave 0.3s ease-out;
    
  }

  .tarea-card.completada {
    border-left-color: #4caf50;
    opacity: 0.7;
  }

  .tarea-main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .tarea-info {
    display: flex;
    flex-direction: column;
  }

  .badge-vencimiento {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #fff0f0; /* Fondo rojizo suave */
  color: #b63a3a;            /* Texto rojo oscuro */
  padding: 4px 12px;         /* Espacio interno para que no esté apretado */
  border-radius: 50px;       /* Forma de píldora redondeada */
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #ffdbdb; /* Un borde sutil para definir la etiqueta */
  margin-top: 8px;           /* Separación del texto de la tarea */
  width: fit-content;
}

  .tachado {
    text-decoration: line-through;
    color: #888;
  }

  .vacio {
    color: #999;
    text-align: center;
    padding: 20px;
    list-style: none;
  }

  /* FUERZA BRUTA PARA EL DISEÑO DE LA AGENDA */
  .agenda-layout-grid {
    display: flex !important;
    flex-wrap: wrap !important; /* Permite que los elementos bajen en móvil */
    gap: 10px !important;
    width: 100% !important;
    margin-bottom: 25px !important;
  }

  .agenda-input-texto {
    flex: 1 1 100% !important; /* Ocupa toda la fila en móvil */
    height: 46px !important;
    border: 1px solid #d1d5db !important;
    border-radius: 10px !important;
    padding: 0 15px !important;
    font-size: 15px !important;
    box-sizing: border-box !important;
  }

  .agenda-input-fecha {
    flex: 1 1 45% !important; /* Dos por fila en móvil (Fecha y Botón) */
    height: 46px !important;
    border: 1px solid #d1d5db !important;
    border-radius: 10px !important;
    padding: 0 10px !important;
    background: white !important;
  }

  .agenda-btn-add {
    flex: 1 1 45% !important; /* Dos por fila en móvil junto a la fecha */
    height: 46px !important;
    background-color: #b63a3a !important;
    color: white !important;
    border: none !important;
    border-radius: 10px !important;
    font-weight: bold !important;
    cursor: pointer !important;
  }

  .agenda-btn-add:hover {
    background-color: #962f2f !important;
  }

  .badge-alerta {
    background-color: #b63a3a; /* El rojo de tu marca */
    color: white;
    font-size: 11px;
    font-weight: bold;
    padding: 2px 7px;
    border-radius: 10px;
    margin-left: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    
    /* Estos son los detalles de pulido que añadimos: */
    border: 1.5px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    
    /* Animación para que aparezca suavemente */
    animation: aparecer 0.3s ease-out;
  }

  @keyframes aparecer {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes entradaSuave {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Contenedor para alinear los botones en la misma fila */
  .grupo-botones {
    display: flex;
    gap: 8px;
    justify-content: center; 
    align-items: center; /* Esto nivela las alturas perfectamente */
    height: 100%;        /* Asegura que use todo el alto de la celda */
    vertical-align: middle;
  }

  /* Estilo base para los botones de la tabla */
  .btn-tabla {
    height: 32px; /* Altura fija para ambos */
    padding: 0 15px;
    font-size: 0.85rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    margin: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    line-height: 1;
  }

  /* Estilo Editar (Azul grisáceo) */
  .btn-editar {
    background-color: #f1f5f9;
    color: #475569;
    border-color: #cbd5e1;
  }

  .btn-editar:hover {
    background-color: #e2e8f0;
  }

  /* Estilo Eliminar (Rojo suave) */
  .btn-eliminar {
    background-color: #fff1f2;
    color: #e11d48;
    border-color: #fecdd3;
  }

  .btn-eliminar:hover {
    background-color: #ffe4e6;
  }

  /* Alineación de la columna de acciones */
  .col-acciones {
    text-align: right;
    padding-right: 20px;
  }

  /* Tablets y pantallas medianas (768px en adelante) */
  @media (min-width: 768px) {
    /* Añadimos aquí lo de la agenda para que se ponga en fila en tablets/PC */
    .agenda-input-texto { flex: 1 !important; }
    .agenda-input-fecha { flex: 0 0 220px !important; }
    .agenda-btn-add { flex: 0 0 auto !important; }
  }

  /* Computadoras (1024px en adelante) */
  @media (min-width: 1024px) {
 
  }

  /* --- AJUSTE DE PRECISIÓN: MÓDULO 7 Y DÍAS --- */
@media (max-width: 600px) {

  /* 3. PROTECCIÓN: Evitamos que los módulos se pongan uno al lado del otro */
  /* Forzamos a que cada tarjeta ocupe su propia línea siempre */
  .config-card, section, .form-grande {
    display: block !important; 
    width: 100% !important;
    max-width: 100vw !important;
    margin: 10px 0 !important;
    box-sizing: border-box !important;
  }

  /* 4. TAMAÑO DE BOTONES: Que no se estiren */
  input[type="radio"], input[type="checkbox"] {
    width: 20px !important;
    height: 20px !important;
    flex-shrink: 0 !important;
    margin-right: 8px !important;
  }
  /* 5. CAMPOS DE TEXTO: Que se ajusten al ancho de su tarjeta */
  input:not([type="radio"]):not([type="checkbox"]), select, textarea {
    width: 100% !important;
    max-width: 100% !important;
    display: block !important;
  }
}
</style>