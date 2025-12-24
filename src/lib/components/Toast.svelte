<script>
  import { toast } from '$lib/stores';
  import { fade, fly } from 'svelte/transition';
</script>

{#if $toast}
  <div 
    class="toast {$toast.tipo}" 
    in:fly={{ y: 20, duration: 300 }} 
    out:fade
  >
    {$toast.mensaje}
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 80px; /* Por encima de la barra inferior */
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    border-radius: 50px;
    color: white;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
  }
  .exito { background-color: #10b981; }
  .error { background-color: #ef4444; }
</style>