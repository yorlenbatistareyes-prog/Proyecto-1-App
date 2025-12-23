<script lang="ts">
  import { menuAbierto, vistaActual } from '$lib/stores';
</script>

<header class="header">
  <div class="header-top">
    <button class="menu-toggle" on:click|stopPropagation={() => $menuAbierto = true}>
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

    <button class="config-button" on:click={() => $vistaActual = 'configuracion'}>
      ⚙️
    </button>
  </div>

  <div class="barra-oscura-inferior"></div>
</header>

<style>
  .header { 
    width: 100%; 
    position: relative; 
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  /* FRANJA BLANCA */
  .header-top { 
    display: flex; 
    align-items: center; 
    background: #ffffff; 
    height: 72px; 
    padding: 0 20px 0 140px; 
    box-sizing: border-box;
    width: 100%;
    position: relative;
  }

  /* FRANJA GRIS OSCURA (AHORA DEBAJO) */
  .barra-oscura-inferior {
    background-color: #333333; /* El color gris oscuro/negro */
    height: 48px; /* Ajusta la altura según prefieras */
    width: 100%;
  }

  .header-logo { 
    position: absolute; 
    left: 0; 
    top: 0; 
    width: 90px; 
    height: 96px; /* Ajustado para que baje un poco sobre la franja oscura */
    background: #b63a3a; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    z-index: 10; 
  }

  .logo-text { 
    color: white; 
    font-size: 46px; 
    font-weight: bold; 
  }

  .header-info h1 {
    margin: 0;
    font-size: 1.3rem;
    color: #333;
    font-weight: bold;
  }

  .header-info p {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
  }

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

  .spacer { flex: 1; }

  .config-button { 
    background: none; 
    border: none; 
    padding: 8px; 
    cursor: pointer; 
    font-size: 20px;
  }
</style>