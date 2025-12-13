<script>
  export let titulo = '';
</script>

<div class="panel">
  {#if titulo}
    <h2>{titulo}</h2>
  {/if}

  <slot />
</div>

<style>
  .panel {
    border: 1px solid #ccc;
    padding: 1rem;
    margin-top: 1rem;
    border-radius: 6px;
  }
</style>
