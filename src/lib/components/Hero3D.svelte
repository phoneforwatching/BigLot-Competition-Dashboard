<script lang="ts">
    import { Canvas } from "@threlte/core";
    import HeroScene from "./HeroScene.svelte";
</script>

<div
    class="absolute inset-0 z-0 pointer-events-none opacity-60 dark:opacity-40"
>
    <Canvas dpr={1.5}>
        <HeroScene />
    </Canvas>
</div>

<style>
    /* Ensure the canvas fills the container */
    :global(canvas) {
        width: 100% !important;
        height: 100% !important;
    }
</style>
