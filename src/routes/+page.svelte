<script lang="ts">
  import { onMount } from 'svelte';
  import Panel from '$lib/components/Panel.svelte';
  import { vistaActual, circuitos, congregaciones } from '$lib/stores';
  import type { Circuito, Congregacion, Vista } from '$lib/types';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Header from '$lib/components/Header.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { jsPDF } from 'jspdf';
  import autoTable from 'jspdf-autotable';
  import { visitasStore } from '$lib/stores';

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
  $: visitasRecientes = $visitasStore
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
    // Eliminados: idiomaFormulario y enlaceJw
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
  let mostrarPreguntas = false;
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  // Inicializamos con un array vacío para evitar errores de "undefined"
  let mostrarPreguntasTerritorio = false;
  let mostrarPreguntasPrecursores = false;
  let mostrarPreguntasReuniones = false;
  let mostrarPreguntasPastoreo = false;
  let mostrarPreguntasCrecimiento = false;
  let mostrarPreguntasSuperServicio = false;
  let mostrarPreguntasPublicaciones = false;
  let mostrarPreguntasProgreso = false;
  let mostrarPreguntasAncianos = false;
  let mostrarPreguntasLocal = false;
  let mostrarPreguntasInactivos = false;
  let mostrarPreguntasDetallePrecursores = false;
  let mostrarPreguntasContabilidad = false;
  let mostrarPreguntasProblemas = false;
  let mostrarPreguntasMiscelaneos = false;
  let mostrarPreguntasDiscursos = false;
  let mostrarSugerenciasReuniones = false;
  

  let nuevaVisita = {
    fecha: '',
    congregacionId: '',
    tipo: 'Ordinaria',
    ministerio: {
      observaciones: '',
      territorioObs: '',
      precursoresObs: '',
      programa: [] as Array<{ dia: string; hora: string }>
    },
    reuniones: {
      asistencia: {
        estudiantes: 0,
        sacados: 0,
        inactivos: 0,
        hijosTestigos: 0,
        noAsisten: 0
      },
      entreSemana: { tendencia: '', faltan: 0, porcentaje: '' },
      finSemana: { tendencia: '', faltan: 0, porcentaje: '' },
      observaciones: ''
    },
    pastoreo: {
      observaciones: '',
      inactivos: 0,
      sacados: 0
    },
    crecimiento: {
      observaciones: '',
      cursosRegulares: false // Añadimos un selector para esta pregunta específica
    },
    superintendenteServicio: {
      observaciones: '',
      visitaPeriodica: 'si'
    },
    publicaciones: {
      observaciones: '',
      inventarioMensual: false,
      excedente: 'no'
    },
    progresoEspiritual: {
      observaciones: '',
      habitosEstudio: 'buenos'
    },
    cuerpoNombrados: {
      observaciones: '',
      unidadCuerpo: 'buena',
      programaCapacitacion: false
    },
    localReunion: {
      observaciones: '',
      programaLimpieza: 'si',
      planSeguridad: false
    },
    analisisInactivos: {
      observaciones: '',
      planAccion: false
    },
    precursoresAnalisis: {
      observaciones: '',
      apoyoAncianos: 'si',
      horarioPractico: true
    },
    contabilidad: {
      observaciones: '',
      contabilidadEnLinea: 'no',
      archivosRevisados: false
    },
    problemasGraves: {
      observaciones: '',
      nivelUrgencia: 'bajo',
      requiereIntervencionSucursal: false
    },
    miscelaneos: {
      observaciones: '',
      temasPendientes: false
    },
    ideasDiscursos: {
      puntosClave: '',
      textosBiblicos: ''
    },
    ideasDiscursos: {
      puntosClave: '',
      textosBiblicos: '',
      sugerenciasAncianos: ''
    },
    observacionesReuniones: {
      vidaMinisterio: {
        asignacionesS89: '',
        consejeroAuxiliar: ''
      },
      finDeSemana: {
        estudioAtalaya: ''
      }
    },
    observacionesFinales: ''
  };

  function toggleDiaMinisterio(dia: string) {
    const programa = nuevaVisita.ministerio.programa;
    const index = programa.findIndex(p => p.dia === dia);
    
    if (index !== -1) {
      // Si el día ya existe, lo eliminamos
      nuevaVisita.ministerio.programa = programa.filter(p => p.dia !== dia);
    } else {
      // Si no existe, lo añadimos con una hora vacía para evitar errores de compilación
      nuevaVisita.ministerio.programa = [...programa, { dia: dia, hora: '' }];
    }
    // Forzamos a Svelte a actualizar la pantalla
    nuevaVisita = nuevaVisita; 
  }

  let textoBusquedaVisitas = '';

  // Esta lista se actualizará sola cada vez que escribas o cambien las visitas
  $: visitasFiltradas = $visitasStore.filter(v => 
    v.congregacionId.toLowerCase().includes(textoBusquedaVisitas.toLowerCase()) ||
    v.tipo.toLowerCase().includes(textoBusquedaVisitas.toLowerCase())
  );

  function guardarVisita() {
  if (!nuevaVisita.congregacionId) return alert('Seleccione una congregación');
    
    // 1. Guardar la visita
    const visitaGuardada = { ...nuevaVisita, id: Date.now() };
    $visitasStore = [...$visitasStore, visitaGuardada];

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

  function exportarDatos(formato: 'csv' | 'pdf') {
  // CORRECCIÓN: Usar $visitasStore en lugar de $visitas
  if ($visitasStore.length === 0) {
    return alert('No hay datos registrados para exportar.');
  }

  const encabezados = ['Fecha', 'Congregación', 'Tipo', 'Observaciones'];
  
  // Mapeamos los datos asegurando que no haya valores nulos
  const filas = $visitasStore.map(v => [
    v.fecha || 'N/A', 
    v.congregacionId || 'N/A', 
    v.tipo || 'N/A', 
    v.observaciones || ''
  ]);

  if (formato === 'pdf') {
  const doc = new jsPDF();
  
  // Título del documento
  doc.setFontSize(18);
  doc.text('Informe Mensual de Visitas', 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 22);

  // Generar la tabla usando el plugin autoTable correctamente
  autoTable(doc, {
    head: [encabezados],
    body: filas,
    startY: 25,
    theme: 'striped', // Filas alternas con color suave
    headStyles: { 
        fillColor: [91, 76, 196], // El color morado (#5b4cc4) de tu botón "Registrar"
        textColor: [255, 255, 255],
        fontStyle: 'bold'
    },
    alternateRowStyles: {
        fillColor: [245, 245, 255] // Un tono lila muy suave para las filas
    },
    margin: { top: 20 }
});

  doc.save(`Informe_Visitas_${new Date().toISOString().slice(0, 10)}.pdf`);
}
  
  else {
    // GENERACIÓN DE CSV (Mantenemos el punto y coma para compatibilidad)
    let contenido = encabezados.join(';') + '\n';
    filas.forEach(f => contenido += f.map(c => `"${c}"`).join(';') + '\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Informe_Visitas.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
      <div class="flex-end" style="margin-bottom: 15px;">
        <button class="btn-primario" on:click={prepararNuevaCongregacion}>
          ➕ Nueva
        </button>
      </div>
      
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
                  <button class="btn-tabla-accion" on:click|stopPropagation={() => toggleMenu(i)}>ACCIONES</button>
                  {#if menuAbiertoId === i}
                    <div class="overlay-invisible" on:click={cerrarMenu}></div>
                    <div class="menu-flotante">
                      <div class="menu-header">{c.nombre}</div>
                      <div class="menu-acciones">
                        <button class="opcion-editar" on:click={() => { editarCongregacion(c, i); cerrarMenu(); }}>✏️ EDITAR</button>
                        <button class="opcion-eliminar" on:click={() => { eliminarCongregacion(i); cerrarMenu(); }}>ELIMINAR 🗑️</button>
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
          <select 
            class="select-exportar" 
            on:change={(e) => {
              const v = e.currentTarget.value;
              if (v === 'csv' || v === 'pdf') exportarDatos(v as 'csv' | 'pdf');
            }}
          >
            <option value="" selected disabled>📥 Exportar informe...</option>
            <option value="csv">Formato CSV</option>
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
            {#each visitasFiltradas as v}
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
              <option value="Ordinaria">Ordinaria</option>
              <option value="Especial">Especial</option>
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
            on:click={() => mostrarPreguntas = !mostrarPreguntas}
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
            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Análisis de Actividad:</label>
            <textarea 
              style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px; min-height: 120px;"
              bind:value={nuevaVisita.ministerio.observaciones}
              placeholder="Escribe aquí el análisis basado en las preguntas anteriores..."
            ></textarea>
          </div>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

          <label style="font-weight: bold; display: block; margin-bottom: 10px;">Programa de Predicación:</label>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            {#each diasSemana as dia}
              {@const programaDia = nuevaVisita.ministerio.programa.find(p => p.dia === dia)}
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 10px; border: 1px solid {programaDia ? '#3182ce' : '#e2e8f0'}; border-radius: 8px; background: {programaDia ? '#f0f7ff' : '#ffffff'}; min-width: 90px; flex: 1;">
                <label style="display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; font-size: 0.8rem; font-weight: 600; color: #4a5568;">
                  <input type="checkbox" on:change={() => toggleDiaMinisterio(dia)} checked={!!programaDia} />
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
              on:click={() => mostrarPreguntasTerritorio = !mostrarPreguntasTerritorio}
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
              on:click={() => mostrarPreguntasPrecursores = !mostrarPreguntasPrecursores}
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
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
      <div class="campo-mini">
        <label>Estudiantes:</label>
        <input type="number" bind:value={nuevaVisita.reuniones.asistencia.estudiantes} />
      </div>
      <div class="campo-mini">
        <label>Sacados:</label>
        <input type="number" bind:value={nuevaVisita.reuniones.asistencia.sacados} />
      </div>
      <div class="campo-mini">
        <label>Inactivos:</label>
        <input type="number" bind:value={nuevaVisita.reuniones.asistencia.inactivos} />
      </div>
      <div class="campo-mini">
        <label>Hijos Testigos:</label>
        <input type="number" bind:value={nuevaVisita.reuniones.asistencia.hijosTestigos} />
      </div>
      <div class="campo-mini">
        <label>No pueden asistir:</label>
        <input type="number" bind:value={nuevaVisita.reuniones.asistencia.noAsisten} />
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
      <div style="background: white; padding: 10px; border-radius: 4px; border: 1px solid #cbd5e0;">
        <span style="font-weight: bold; font-size: 0.8rem; display: block; margin-bottom: 8px;">FIN DE SEMANA (Promedio)</span>
        <div style="display: flex; gap: 10px;">
          <input type="text" placeholder="Aum/Dism" bind:value={nuevaVisita.reuniones.finSemana.tendencia} style="flex: 2;" />
          <input type="number" placeholder="Faltan" bind:value={nuevaVisita.reuniones.finSemana.faltan} style="flex: 1;" />
          <input type="text" placeholder="%" bind:value={nuevaVisita.reuniones.finSemana.porcentaje} style="flex: 1;" />
        </div>
      </div>
    </div>
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #ebf8ff; border: 1px solid #bee3f8; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #2b6cb0;"
    on:click={() => mostrarPreguntasReuniones = !mostrarPreguntasReuniones}
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
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis de las Reuniones y Enseñanza:</label>
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
    on:click={() => mostrarPreguntasPastoreo = !mostrarPreguntasPastoreo}
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
      <label style="display: block; font-size: 0.85rem; font-weight: bold; color: #4a5568; margin-bottom: 5px;">Inactivos en la congregación:</label>
      <input 
        type="number" 
        style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 6px;" 
        bind:value={nuevaVisita.pastoreo.inactivos} 
      />
    </div>
    <div style="flex: 1;">
      <label style="display: block; font-size: 0.85rem; font-weight: bold; color: #4a5568; margin-bottom: 5px;">Cantidad de sacados:</label>
      <input 
        type="number" 
        style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 6px;" 
        bind:value={nuevaVisita.pastoreo.sacados} 
      />
    </div>
  </div>

  <div style="margin-top: 10px;">
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis del Pastoreo y Ayuda Espiritual:</label>
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
    on:click={() => mostrarPreguntasCrecimiento = !mostrarPreguntasCrecimiento}
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
    <label style="font-size: 0.9rem; font-weight: bold; color: #b83280;">¿Se dirigen regularmente los cursos bíblicos?</label>
    <select bind:value={nuevaVisita.crecimiento.cursosRegulares} style="padding: 4px; border-radius: 4px; border: 1px solid #fed7e2;">
        <option value={true}>Sí</option>
        <option value={false}>No / Algunos</option>
    </select>
  </div>

  <div style="margin-top: 10px;">
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis del Crecimiento y Estudiantes:</label>
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
    on:click={() => mostrarPreguntasSuperServicio = !mostrarPreguntasSuperServicio}
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
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Observaciones sobre su labor y colaboración de los SG:</label>
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
    on:click={() => mostrarPreguntasPublicaciones = !mostrarPreguntasPublicaciones}
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
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis sobre Gestión, Inventarios (S-28) y Capacitación:</label>
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
    on:click={() => mostrarPreguntasProgreso = !mostrarPreguntasProgreso}
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
    <label style="font-size: 0.9rem; font-weight: bold; color: #553c9a; display: block; margin-bottom: 8px;">Estado general de hábitos espirituales:</label>
    <div style="display: flex; gap: 15px;">
        <label><input type="radio" bind:group={nuevaVisita.progresoEspiritual.habitosEstudio} value="buenos" /> Buenos / Ejemplares</label>
        <label><input type="radio" bind:group={nuevaVisita.progresoEspiritual.habitosEstudio} value="mejorables" /> Necesitan mejora</label>
        <label><input type="radio" bind:group={nuevaVisita.progresoEspiritual.habitosEstudio} value="preocupantes" /> Hay tendencias negativas</label>
    </div>
  </div>

  <div style="margin-top: 10px;">
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis detallado sobre Familias, Jóvenes y Matrimonios:</label>
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
    on:click={() => mostrarPreguntasAncianos = !mostrarPreguntasAncianos}
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
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis sobre el ejemplo, unidad y eficacia de los nombrados:</label>
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
    on:click={() => mostrarPreguntasLocal = !mostrarPreguntasLocal}
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
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis sobre Mantenimiento, Seguridad y LDC:</label>
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
    on:click={() => mostrarPreguntasInactivos = !mostrarPreguntasInactivos}
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
    <label style="font-size: 0.9rem; font-weight: bold; color: #4a5568;">¿Existe un plan de ayuda definido por los ancianos?</label>
    <select bind:value={nuevaVisita.analisisInactivos.planAccion} style="padding: 4px; border-radius: 4px; border: 1px solid #cbd5e0;">
        <option value={true}>Sí</option>
        <option value={false}>No / En proceso</option>
    </select>
  </div>

  <div style="margin-top: 10px;">
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Análisis de causas y labor de ayuda:</label>
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
    on:click={() => mostrarPreguntasDetallePrecursores = !mostrarPreguntasDetallePrecursores}
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
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Observaciones sobre el desempeño y espíritu de los precursores:</label>
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
    on:click={() => mostrarPreguntasContabilidad = !mostrarPreguntasContabilidad}
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
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Observaciones sobre Contabilidad y Archivos:</label>
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
    on:click={() => mostrarPreguntasProblemas = !mostrarPreguntasProblemas}
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
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem; color: #c53030;">Descripción detallada del problema y medidas tomadas:</label>
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
    on:click={() => mostrarPreguntasMiscelaneos = !mostrarPreguntasMiscelaneos}
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
    <label style="font-size: 0.9rem; font-weight: bold; color: #4a5568;">¿Quedan temas pendientes para la próxima visita?</label>
    <select bind:value={nuevaVisita.miscelaneos.temasPendientes} style="padding: 4px; border-radius: 4px; border: 1px solid #cbd5e0;">
        <option value={false}>No, todo concluido</option>
        <option value={true}>Sí, anotar en el análisis</option>
    </select>
  </div>

  <div style="margin-top: 10px;">
    <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">Otros temas y observaciones adicionales:</label>
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
    on:click={() => mostrarPreguntasDiscursos = !mostrarPreguntasDiscursos}
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
      <label style="display: block; font-weight: bold; margin-bottom: 8px; font-size: 0.9rem; color: #2b6cb0;">
        📢 Sugerencias del Cuerpo de Ancianos (para mencionar):
      </label>
      <textarea 
        style="width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; min-height: 80px; background-color: #f0f7ff; font-style: italic;"
        bind:value={nuevaVisita.ideasDiscursos.sugerenciasAncianos}
        placeholder="¿Qué puntos específicos quieren los ancianos que usted refuerce?"
      ></textarea>
    </div>

    <div>
      <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem; color: #334155;">Textos bíblicos seleccionados:</label>
      <input 
        type="text" 
        style="width: 100%; border: 1px solid #cbd5e0; border-radius: 6px; padding: 10px;"
        bind:value={nuevaVisita.ideasDiscursos.textosBiblicos}
        placeholder="Ej: Hechos 20:20; 2 Tim. 4:5..."
      />
    </div>

    <div>
      <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem; color: #334155;">Esquema y puntos clave personales:</label>
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
    2. SUGERENCIAS SOBRE REUNIONES (Observaciones de la semana)
  </div>

  <button 
    type="button" 
    style="width: 100%; padding: 10px; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; color: #c53030;"
    on:click={() => mostrarSugerenciasReuniones = !mostrarSugerenciasReuniones}
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
      
      <label style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 5px;">Procedimiento de asignaciones (S-89/Tablero):</label>
      <textarea 
        style="width: 100%; border: 1px solid #cbd5e0; border-radius: 4px; padding: 8px; margin-bottom: 10px; min-height: 60px;"
        bind:value={nuevaVisita.observacionesReuniones.vidaMinisterio.asignacionesS89}
        placeholder="Anote sus sugerencias sobre el orden y la prontitud..."></textarea>

      <label style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 5px;">Función del consejero auxiliar:</label>
      <textarea 
        style="width: 100%; border: 1px solid #cbd5e0; border-radius: 4px; padding: 8px; min-height: 60px;"
        bind:value={nuevaVisita.observacionesReuniones.vidaMinisterio.consejeroAuxiliar}
        placeholder="Observaciones sobre cómo se está brindando la ayuda a los estudiantes..."></textarea>
    </div>

    <div style="background: white; border: 1px solid #fed7d7; padding: 15px; border-radius: 6px;">
      <h4 style="font-size: 0.9rem; color: #9b2c2c; margin-bottom: 10px; font-weight: bold;">Reunión del Fin de Semana</h4>
      <label style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 5px;">Estudio de La Atalaya:</label>
      <textarea 
        style="width: 100%; border: 1px solid #cbd5e0; border-radius: 4px; padding: 8px; min-height: 80px;"
        bind:value={nuevaVisita.observacionesReuniones.finDeSemana.estudioAtalaya}
        placeholder="Sugerencias para el conductor o sobre la calidad de los comentarios..."></textarea>
    </div>
  </div>
</div>

        <div class="campo" style="margin-top: 20px; display: flex; flex-direction: column;">
          <label for="v-obs" style="font-weight: bold; margin-bottom: 5px;">Observaciones Finales / Pendientes</label>
          <textarea id="v-obs" bind:value={nuevaVisita.observaciones} rows="4" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;" placeholder="Temas adicionales o seguimiento..."></textarea>
        </div>

        <div class="acciones-inferiores" style="margin-top: 20px; display: flex; gap: 10px;">
          <button class="btn-secundario" on:click={() => creandoVisita = false}>Cancelar</button>
          <button class="btn-primario" on:click={guardarVisita}>Guardar Registro Completo</button>
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

  .contenedor-buscador-visitas {
    margin-bottom: 15px;
    display: flex;
    justify-content: flex-start;
  }

  .input-con-lupa {
    position: relative;
    width: 100%;
    max-width: 300px; /* Ancho controlado */
    display: flex;
    align-items: center;
  }

  .input-con-lupa svg {
    position: absolute;
    left: 12px;
  }

  .input-con-lupa input {
    width: 100%;
    padding: 10px 10px 10px 40px;
    border: 1px solid #ddd;
    border-radius: 20px; /* Bordes redondeados modernos */
    font-size: 0.9rem;
    outline: none;
  }

  .input-con-lupa input:focus {
    border-color: #5b4cc4;
    box-shadow: 0 0 0 3px rgba(91, 76, 196, 0.1);
  }

  /* Estilo para que el grid de días se vea bien en móviles */
  .grid-dias-horarios {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }

  /* Efecto visual cuando pasas el ratón por encima del botón de preguntas */
  button[type="button"]:hover {
    background-color: #e2e8f0 !important;
    transition: background-color 0.2s;
  }

  /* Estilo para los inputs de hora */
  input[type="text"].input-hora-mini {
    border: 1px solid #cbd5e0;
    border-radius: 4px;
    padding: 4px 8px;
    font-family: monospace;
    outline-color: #3182ce;
  }

  /* Mejora de los labels de los días */
  label {
    user-select: none; /* Evita que el texto se sombreado al hacer clic rápido */
  }
</style>