<script>
  import { onMount } from 'svelte';
  import { 
    Calendar, FileText, Users, Folder, 
    ListTodo, SlidersHorizontal, Plus, ChevronRight, MapPin, X, Clock, Network, ChevronDown
  } from 'lucide-svelte';
  
  let congregaciones = [
    { id: 1, nombre: "AEROPUERTO", activo: true },
    { id: 2, nombre: "CACOCUM", activo: false }
  ];

  let seleccionadaId = 1;
  let usuario = "Yorlen";
  let horaActual = "21:03";
  
  let showModal = false; 
  let nuevaCong = {
    circuito: "", seccion: "", sucursal: "",
    nombre: "", numero: "", ciudad: "", estado: "", pais: "Cuba", 
    idioma: "Español", esLenguaSenas: false, telefono: "", 
    reunionEntreSemana: "19:00", diaEntreSemana: "Jueves",
    reunionFinSemana: "10:00", diaFinSemana: "Domingo"
  };

  const paises = ["Cuba", "México", "España", "Estados Unidos", "Colombia"];
  const idiomas = ["Español", "Inglés", "Francés", "Portugués"];
  const secciones = ["A", "B", "C", "D", "E"];
  
  const diasEntreSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const diasFinSemana = ["Sábado", "Domingo"];

  function abrirModal() { showModal = true; }
  function cerrarModal() {
    showModal = false;
    nuevaCong = { circuito: "", seccion: "", sucursal: "", nombre: "", numero: "", ciudad: "", estado: "", pais: "Cuba", idioma: "Español", esLenguaSenas: false, telefono: "", reunionEntreSemana: "19:00", diaEntreSemana: "Jueves", reunionFinSemana: "10:00", diaFinSemana: "Domingo" };
  }

  function guardarCongregacion() {
    if (nuevaCong.nombre.trim() !== "") {
      const nueva = { id: Date.now(), nombre: nuevaCong.nombre.toUpperCase(), activo: false };
      congregaciones = [...congregaciones, nueva];
      cerrarModal();
    }
  }
   
  function seleccionar(id) {
    seleccionadaId = id;
    congregaciones = congregaciones.map(c => ({...c, activo: c.id === id}));
  }

  onMount(() => {
    const actualizar = () => {
      const ahora = new Date();
      horaActual = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    };
    actualizar();
    const intervalo = setInterval(actualizar, 1000);
    return () => clearInterval(intervalo);
  });

  const herramientas = [
    { nombre: 'Programación', icon: Calendar },
    { nombre: 'Informes', icon: FileText },
    { nombre: 'Registro de personas', icon: Users },
    { nombre: 'Documentos', icon: Folder },
    { nombre: 'Asuntos pendientes', icon: ListTodo },
  ];

  $: nombreSeleccionado = congregaciones.find(c => c.id === seleccionadaId)?.nombre || "";
</script>

<div class="dashboard-outer">
  <div class="main-card">
    <aside class="sidebar">
      <div class="sidebar-header">
        <MapPin size={13} strokeWidth={2.5} color="#94a3b8" />
        <span>CONGREGACIONES</span>
      </div>
      <div class="nav-list">
        {#each congregaciones as cong (cong.id)}
          <button class="nav-item" class:active={cong.id === seleccionadaId} on:click={() => seleccionar(cong.id)}>
            <span class="nav-text">{cong.nombre}</span>
            <ChevronRight size={14} class="chevron" />
          </button>
        {/each}
        <button class="btn-new-cong" on:click={abrirModal}>
          <Plus size={16} strokeWidth={3} />
          <span>Nueva Congregación</span>
        </button>
      </div>
    </aside>

    <section class="content">
      <header class="welcome-zone">
        <h1 class="clock">{horaActual}</h1>
        <p class="greeting">Buenas noches, {usuario}</p>
      </header>
      <div class="main-action-area">
        <div class="action-header">
          <div class="title-box">
            <h2>Congregación <strong>{nombreSeleccionado}</strong></h2>
            <span class="badge">EN VISITA</span>
          </div>
          <button class="btn-config-pill">
            <SlidersHorizontal size={14} strokeWidth={2} />
            <span>Configuración</span>
          </button>
        </div>
        <div class="grid-tools">
          {#each herramientas as tool}
            <button class="tool-card">
              <div class="icon-box"><svelte:component this={tool.icon} size={20} strokeWidth={1.5} color="#1e293b" /></div>
              <div class="card-info"><h3>{tool.nombre}</h3><span>Acceder a sección</span></div>
            </button>
          {/each}
        </div>
      </div>
    </section>
  </div>
</div>

{#if showModal}
  <div 
    class="modal-overlay" 
    on:click|self={cerrarModal} 
    on:keydown={(e) => e.key === 'Escape' && cerrarModal()}
    role="button"
    tabindex="-1"
  >
    <div class="modal-content" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>Nueva Congregación</h3>
        <button type="button" class="btn-close-x" on:click={cerrarModal} aria-label="Cerrar">
          <X size={20}/>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-row circuit-header">
          <div class="field flex-2">
            <div class="input-with-icon left">
              <Network size={16} class="input-icon-left"/>
              <input 
                type="text" 
                bind:value={nuevaCong.circuito} 
                placeholder="Seleccione el circuito" 
                aria-label="Circuito"
              />
            </div>
          </div>
          <div class="field flex-1">
            <div class="select-wrapper">
              <select bind:value={nuevaCong.seccion} aria-label="Sección">
                <option value="" disabled selected>Sección</option>
                {#each secciones as letra}
                  <option value={letra}>{letra}</option>
                {/each}
              </select>
              <ChevronDown size={14} class="select-icon" />
            </div>
          </div>
          <div class="field flex-2">
            <input 
              type="text" 
              bind:value={nuevaCong.sucursal} 
              placeholder="Sucursal" 
              aria-label="Sucursal"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="field flex-3">
            <label for="nombre-cong">Nombre de Congregación *</label>
            <input id="nombre-cong" type="text" bind:value={nuevaCong.nombre} placeholder="Nombre" />
          </div>
          <div class="field flex-2">
            <label for="num-cong">Número</label>
            <input id="num-cong" type="text" bind:value={nuevaCong.numero} />
          </div>
          <div class="field flex-2">
            <label for="ciudad-cong">Ciudad *</label>
            <input id="ciudad-cong" type="text" bind:value={nuevaCong.ciudad} />
          </div>
        </div>

        <div class="form-row">
          <div class="field flex-2">
            <label for="pais-cong">País</label>
            <div class="select-wrapper">
              <select id="pais-cong" bind:value={nuevaCong.pais}>
                {#each paises as p}<option value={p}>{p}</option>{/each}
              </select>
              <ChevronDown size={14} class="select-icon" />
            </div>
          </div>
          <div class="field flex-2">
            <label for="idioma-cong">Idioma</label>
            <div class="select-wrapper">
              <select id="idioma-cong" bind:value={nuevaCong.idioma}>
                {#each idiomas as i}<option value={i}>{i}</option>{/each}
              </select>
              <ChevronDown size={14} class="select-icon" />
            </div>
          </div>
          <div class="field flex-2 checkbox-container">
            <input type="checkbox" id="l-senas" bind:checked={nuevaCong.esLenguaSeñas} />
            <label for="l-senas" class="cb-label">Lengua de señas</label>
          </div>
          <div class="field flex-3">
            <label for="tel-cong">Teléfono Principal</label>
            <input id="tel-cong" type="text" bind:value={nuevaCong.telefono} />
          </div>
        </div>

        <div class="reunion-container">
          <div class="reunion-box">
            <label for="dia-semana" class="reunion-label">Reunión entre semana</label>
            <div class="reunion-row">
              <div class="field flex-2">
                <div class="select-wrapper">
                  <select id="dia-semana" bind:value={nuevaCong.reunionEntreSemana}>
                    {#each diasEntreSemana as d}<option value={d}>{d}</option>{/each}
                  </select>
                  <ChevronDown size={14} class="select-icon" />
                </div>
              </div>
              <div class="field flex-1">
                <div class="time-input-box">
                  <Clock size={16} color="#94a3b8" />
                  <input type="time" bind:value={nuevaCong.horaEntreSemana} aria-label="Hora entre semana" />
                </div>
              </div>
            </div>
          </div>

          <div class="reunion-box">
            <label for="dia-fin" class="reunion-label">Reunión fin de semana</label>
            <div class="reunion-row">
              <div class="field flex-2">
                <div class="select-wrapper">
                  <select id="dia-fin" bind:value={nuevaCong.reunionFinSemana}>
                    {#each diasFinSemana as d}<option value={d}>{d}</option>{/each}
                  </select>
                  <ChevronDown size={14} class="select-icon" />
                </div>
              </div>
              <div class="field flex-1">
                <div class="time-input-box">
                  <Clock size={16} color="#94a3b8" />
                  <input type="time" bind:value={nuevaCong.horaFinSemana} aria-label="Hora fin de semana" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancel" on:click={cerrarModal}>Cancelar</button>
        <button type="button" class="btn-save" on:click={guardarCongregacion}>Crear Congregación</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* --- ESTILOS DASHBOARD --- */
  .dashboard-outer { padding: 0 24px 24px 24px; height: calc(100vh - 165px); display: flex; justify-content: center; background-color: #f1f5f9; }
  .main-card { display: flex; width: 100%; background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
  .sidebar { width: 250px; padding: 30px 15px; border-right: 1px solid #f8fafc; display: flex; flex-direction: column; }
  .sidebar-header { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 25px; padding-left: 10px; }
  .nav-item { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 10px 16px; border-radius: 8px; background: transparent; border: 1px solid transparent; color: #64748b; cursor: pointer; margin-bottom: 4px; }
  .nav-item.active { background: #fff5f5; color: #b91c1c; border-color: #fecaca; }
  .nav-text { font-weight: 700; font-size: 0.9rem; }
  .btn-new-cong { margin-top: 15px; display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px dashed #e2e8f0; border-radius: 10px; color: #b91c1c; font-size: 0.85rem; font-weight: 600; background: white; cursor: pointer; }
  .content { flex: 1; padding: 40px 60px; overflow-y: auto; }
  .clock { font-size: 4rem; font-weight: 900; color: #1e293b; margin: 0; letter-spacing: -2px; }
  .greeting { font-size: 1.3rem; color: #64748b; margin: 5px 0 55px 0; }
  .action-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .title-box { display: flex; align-items: center; gap: 12px; }
  .title-box h2 { font-size: 1.8rem; color: #1e293b; font-weight: 400; margin: 0; }
  .title-box strong { font-weight: 800; }
  .badge { background: #dcfce7; color: #15803d; font-size: 10px; font-weight: 800; padding: 2px 10px; border-radius: 20px; }
  .btn-config-pill { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 16px; border-radius: 99px; color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; }
  .grid-tools { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 15px; }
  .tool-card { background: white; border: 1px solid #e2e8f0; padding: 20px 24px; border-radius: 12px; display: flex; align-items: center; gap: 15px; cursor: pointer; text-align: left; transition: all 0.25s; }
  .tool-card:hover { border-color: #b91c1c; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(185, 28, 28, 0.05); }
  .icon-box { background: #f1f5f9; padding: 10px; border-radius: 8px; display: flex; }

  /* --- MODAL --- */
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999; }
  .modal-content { background: white; width: 95%; max-width: 1000px; border-radius: 8px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; }
  .modal-header { padding: 15px 25px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
  .modal-header h3 { margin: 0; font-size: 1rem; color: #64748b; font-weight: 600; }
  .btn-close-x { background: none; border: none; color: #94a3b8; cursor: pointer; }

  .modal-body { padding: 0px 40px 30px 40px; }
  .circuit-header { background: #f1f5f9; margin: 0 -40px 25px -40px; padding: 15px 40px; border-bottom: 1px solid #e2e8f0; }

  .form-row { display: flex; gap: 20px; margin-bottom: 25px; align-items: flex-start; }
  .field { display: flex; flex-direction: column; position: relative; }
  .flex-1 { flex: 1; } .flex-2 { flex: 2; } .flex-3 { flex: 3; }

  .field label { font-size: 0.85rem; color: #64748b; margin-bottom: 4px; font-weight: 600; }
  .field input:not([type="checkbox"]), .field select { border: none; border-bottom: 1px solid #cbd5e1; padding: 8px 0; font-size: 0.95rem; background: transparent; color: #334155; width: 100%; appearance: none; }
  .field input:focus, .field select:focus { outline: none; border-bottom: 2px solid #b91c1c; }

  .select-wrapper { position: relative; width: 100%; }
  .select-icon { position: absolute; right: 0; bottom: 10px; color: #94a3b8; pointer-events: none; }

  .input-with-icon.left input { padding-left: 25px !important; }
  .input-icon-left { position: absolute; left: 0; bottom: 10px; color: #64748b; }

  .checkbox-container { flex-direction: row; align-items: center; gap: 8px; padding-top: 22px; }
  .cb-label { margin: 0 !important; color: #334155 !important; font-size: 0.85rem; }

  /* REUNIONES */
  .reunion-container { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 10px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
  .reunion-label { font-size: 0.85rem; color: #64748b; font-weight: 700; margin-bottom: 5px; display: block; }
  .reunion-row { display: flex; gap: 15px; align-items: flex-end; }

  .time-input-box { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
  .time-input-box input { border: none; background: transparent; font-size: 0.95rem; outline: none; width: 85px; padding: 0; }

  .modal-footer { padding: 20px 40px; background: white; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 15px; }
  .btn-cancel { background: transparent; border: none; padding: 10px 20px; font-weight: 600; color: #64748b; cursor: pointer; }
  .btn-save { background: #1e293b; color: white; border: none; padding: 10px 25px; border-radius: 4px; cursor: pointer; font-weight: 600; }
</style>