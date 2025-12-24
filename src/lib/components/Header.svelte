<script lang="ts">
  import { menuAbierto, vistaActual } from '$lib/stores';

  // Manejador para el menú con stopPropagation manual (estilo Svelte 5)
  function handleMenuClick(e: Event) {
    e.stopPropagation();
    $menuAbierto = true;
  }
</script>

<header class="header">
  <div class="header-top">
    <button class="menu-toggle" onclick={handleMenuClick}>
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

    <button class="config-button" onclick={() => $vistaActual = 'configuracion'}>
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
    /* Volvemos al padding original para PC para que no se amontone */
    padding: 0 20px 0 160px; 
    box-sizing: border-box;
    width: 100%;
    position: relative;
  }

  .barra-oscura-inferior {
    background-color: #333333;
    height: 48px;
    width: 100%;
  }

  .header-logo { 
    position: absolute; 
    left: 0; 
    top: 0; 
    width: 90px; 
    height: 96px; 
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
    left: 105px; /* Posición cómoda en PC */
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

  /* --- AQUÍ ESTÁ LA MAGIA: SOLO PARA MÓVILES --- */
  @media (max-width: 600px) {
    .header-top {
        /* En móvil bajamos el espacio para que quepa todo */
        padding: 0 10px 0 115px; 
    }
    
    .header-logo {
        width: 75px; /* Logo más estrecho solo en móvil */
    }

    .logo-text {
        font-size: 35px;
    }

    .menu-toggle {
        left: 82px; /* Pegado al logo estrecho */
    }

    .header-info h1 {
        font-size: 1rem; /* Título ajustado al móvil */
    }

    .header-info p {
        font-size: 0.7rem; /* Subtítulo muy pequeño para que no empuje */
        white-space: nowrap;
    }
  }
</style>