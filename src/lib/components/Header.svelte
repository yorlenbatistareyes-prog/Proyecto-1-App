<script>
  import { Settings, Menu } from 'lucide-svelte';
</script>

<div class="header-full">
  <div class="top-white-bar">
    <div class="logo-section">
      <div class="logo-red-floating">AV</div>
      
      <div class="spacer"></div>
      
      <button class="menu-btn"><Menu size={20} /></button>
      <div class="titles">
        <h1>Asistente de Visitas</h1>
        <p>Documenta todas tus visitas</p>
      </div>
    </div>
    <button class="settings-btn"><Settings size={20} /></button>
  </div>

  <div class="bottom-dark-bar"></div>
</div>

<style>
  .header-full {
    display: flex;
    flex-direction: column;
    width: 100%;
    position: relative;
  }

  .top-white-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    background: white;
    height: 65px;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .logo-red-floating {
    background: #b91c1c;
    color: white;
    width: 65px;
    height: 85px; /* Controla cuánto baja sobre lo gris */
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.8rem;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .spacer {
    width: 65px;
  }

  .menu-btn, .settings-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #334155;
  }

  .titles h1 {
    font-size: 1.1rem;
    margin: 0;
    color: #1e293b;
    font-weight: bold;
  }

  .titles p {
    font-size: 0.8rem;
    margin: 0;
    color: #64748b;
  }

  .bottom-dark-bar {
    background: #333;
    height: 45px;
    width: 100%;
  }
</style>