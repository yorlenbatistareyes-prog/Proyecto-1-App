<script>
  import { Globe, Search, LayoutGrid } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte'; // Importamos el despachador de eventos

  const dispatch = createEventDispatcher();

  export let nombreCircuito = "Holguín-14";
  export let cantidadCongregaciones = 2;

  // Función para enviar el evento al padre (+page.svelte)
  function manejarGestionar() {
    dispatch('abrirGestionar');
  }
</script>

<div class="toolbar-wrapper">
  <div class="toolbar">
    <div class="circuit-info">
      <div class="icon-wrapper">
        <Globe size={18} strokeWidth={2.5} />
      </div>
      <span>Circuito: <strong>{nombreCircuito}</strong></span>
    </div>

    <div class="search-section">
      <div class="search-container">
        <Search size={19} class="search-icon" strokeWidth={2.5} />
        <input type="text" placeholder="Buscar en documentos, personas o notas..." />
      </div>
    </div>

    <div class="actions">
      <div class="cong-badge">
        <span class="number">{cantidadCongregaciones}</span>
        <span class="text">Congregaciones</span>
      </div>
      
      <button class="btn-manage" on:click={manejarGestionar}>
        <LayoutGrid size={18} strokeWidth={2.5} />
        <span>Gestionar Circuitos</span>
      </button>
    </div>
  </div>
</div>

<style>
  :root {
    --brand-red: #b91c1c;
    --brand-red-light: rgba(185, 28, 28, 0.1);
    --brand-red-soft: rgba(185, 28, 28, 0.05);
    --border-strong: #cbd5e1;
    --text-main: #1e293b;
  }

  .toolbar-wrapper {
    padding: 10px 20px;
    background-color: transparent;
  }

  .toolbar {
    background: #ffffff;
    display: flex;
    align-items: center;
    padding: 0 15px;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    height: 65px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
  }

  .circuit-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1.5px solid var(--border-strong);
    font-size: 0.9rem;
    background: white;
    white-space: nowrap;
  }

  .icon-wrapper { color: var(--brand-red); display: flex; }

  .search-section { 
    flex-grow: 1; 
    padding: 0 20px; 
    display: flex;
    justify-content: center;
  }

  .search-container { 
    position: relative; 
    display: flex; 
    align-items: center;
    width: 100%;
    max-width: 550px;
  }

  .search-container :global(.search-icon) { 
    position: absolute; 
    left: 14px; 
    color: #64748b; 
  }

  .search-container input {
    width: 100%;
    height: 42px;
    padding: 0 12px 0 45px;
    border-radius: 10px;
    border: 1.5px solid var(--border-strong);
    background: #f8fafc;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s ease;
  }

  .search-container input:focus {
    background: white;
    border-color: var(--brand-red);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .cong-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--brand-red-soft);
    padding: 6px 14px;
    border-radius: 10px;
    border: 1.5px solid var(--brand-red-light);
    white-space: nowrap;
  }

  .cong-badge .number {
    background: var(--brand-red);
    color: #ffffff;
    font-weight: 800;
    padding: 1px 7px;
    border-radius: 5px;
    font-size: 0.85rem;
  }

  .cong-badge .text {
    color: var(--brand-red);
    font-weight: 700;
    font-size: 0.85rem;
  }

  .btn-manage {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #1e293b;
    color: #ffffff;
    border: none;
    padding: 10px 18px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 700;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .btn-manage:hover {
    background: var(--brand-red);
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(185, 28, 28, 0.2);
  }
</style>