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
</header>

<style>
  .header { 
    height: 120px; 
    width: 100%; 
    position: relative; 
    background-color: #f5f5f5;
  }

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

  .header-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* Eliminamos márgenes negativos o extraños si los hubiera */
  margin: 0; 
}

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

.spacer { flex: 1; } /* Empuja la configuración a la derecha */

.config-button { 
    background: none; 
    border: none; 
    padding: 8px; 
    cursor: pointer; 
    font-size: 20px;
  }
</style>