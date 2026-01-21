<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { fade, scale, fly } from "svelte/transition";
    import { quintOut, elasticOut, backOut } from "svelte/easing";

    export let duration = 2500; // Duration before auto-hide
    export let minLoadTime = 1000; // Minimum display time

    const dispatch = createEventDispatcher();

    let visible = true;
    let showLogo = false;
    let showTitle = false;
    let showSubtitle = false;
    let showLoader = false;
    let showGlow = false;
    let progress = 0;

    onMount(() => {
        // Staggered animation sequence
        setTimeout(() => (showGlow = true), 100);
        setTimeout(() => (showLogo = true), 200);
        setTimeout(() => (showTitle = true), 600);
        setTimeout(() => (showSubtitle = true), 900);
        setTimeout(() => (showLoader = true), 1200);

        // Progress animation
        const progressInterval = setInterval(() => {
            if (progress < 100) {
                progress += Math.random() * 15 + 5;
                if (progress > 100) progress = 100;
            }
        }, 200);

        // Hide splash after duration
        const hideTimeout = setTimeout(
            () => {
                visible = false;
                dispatch("complete");
            },
            Math.max(duration, minLoadTime),
        );

        return () => {
            clearInterval(progressInterval);
            clearTimeout(hideTimeout);
        };
    });

    function skipSplash() {
        visible = false;
        dispatch("complete");
    }
</script>

{#if visible}
    <div
        class="splash-container"
        on:click={skipSplash}
        on:keydown={(e) => e.key === "Enter" && skipSplash()}
        role="button"
        tabindex="0"
        transition:fade={{ duration: 500, easing: quintOut }}
    >
        <!-- Animated Background -->
        <div class="background-effects">
            <!-- Gradient Orbs -->
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
            <div class="orb orb-3"></div>

            <!-- Grid Pattern -->
            <div class="grid-pattern"></div>

            <!-- Particles -->
            {#each Array(20) as _, i}
                <div
                    class="particle"
                    style="--delay: {i * 0.1}s; --x: {Math.random() *
                        100}%; --duration: {2 + Math.random() * 3}s"
                ></div>
            {/each}
        </div>

        <!-- Main Content -->
        <div class="content">
            <!-- Glow Effect Behind Logo -->
            {#if showGlow}
                <div
                    class="logo-glow"
                    in:scale={{ duration: 1000, easing: elasticOut }}
                ></div>
            {/if}

            <!-- Logo -->
            {#if showLogo}
                <div
                    class="logo-container"
                    in:scale={{ duration: 800, start: 0.5, easing: backOut }}
                >
                    <img
                        src="/logo-masterpiece.png"
                        alt="BigLot Logo"
                        class="logo"
                    />
                    <div class="logo-ring"></div>
                    <div class="logo-ring ring-2"></div>
                </div>
            {/if}

            <!-- Title -->
            {#if showTitle}
                <h1
                    class="title"
                    in:fly={{ y: 30, duration: 600, easing: quintOut }}
                >
                    <span class="title-text">BigLot</span>
                    <span class="title-highlight">Trading</span>
                </h1>
            {/if}

            <!-- Subtitle -->
            {#if showSubtitle}
                <p
                    class="subtitle"
                    in:fly={{ y: 20, duration: 500, easing: quintOut }}
                >
                    Compete • Analyze • Dominate
                </p>
            {/if}

            <!-- Loader -->
            {#if showLoader}
                <div class="loader-container" in:fade={{ duration: 300 }}>
                    <div class="loader-track">
                        <div
                            class="loader-progress"
                            style="width: {progress}%"
                        ></div>
                    </div>
                    <p class="loader-text">Loading experience...</p>
                </div>
            {/if}
        </div>

        <!-- Skip Hint -->
        <div class="skip-hint" in:fade={{ delay: 1500, duration: 500 }}>
            Tap anywhere to skip
        </div>
    </div>
{/if}

<style>
    .splash-container {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
            135deg,
            #0a0a0a 0%,
            #1a1a1a 50%,
            #0d0d0d 100%
        );
        cursor: pointer;
        overflow: hidden;
    }

    /* Background Effects */
    .background-effects {
        position: absolute;
        inset: 0;
        overflow: hidden;
    }

    .orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.4;
        animation: float 8s ease-in-out infinite;
    }

    .orb-1 {
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, #f39c12 0%, transparent 70%);
        top: -100px;
        left: -100px;
        animation-delay: 0s;
    }

    .orb-2 {
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, #b8860b 0%, transparent 70%);
        bottom: -50px;
        right: -50px;
        animation-delay: -2s;
    }

    .orb-3 {
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, #daa520 0%, transparent 70%);
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation-delay: -4s;
    }

    .grid-pattern {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(
                rgba(243, 156, 18, 0.03) 1px,
                transparent 1px
            ),
            linear-gradient(
                90deg,
                rgba(243, 156, 18, 0.03) 1px,
                transparent 1px
            );
        background-size: 50px 50px;
        animation: gridMove 20s linear infinite;
    }

    .particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: #f39c12;
        border-radius: 50%;
        left: var(--x);
        bottom: -10px;
        opacity: 0;
        animation: rise var(--duration) ease-out infinite;
        animation-delay: var(--delay);
    }

    @keyframes float {
        0%,
        100% {
            transform: translate(0, 0) scale(1);
        }
        25% {
            transform: translate(20px, -30px) scale(1.1);
        }
        50% {
            transform: translate(-10px, 20px) scale(0.95);
        }
        75% {
            transform: translate(30px, 10px) scale(1.05);
        }
    }

    @keyframes gridMove {
        0% {
            transform: translate(0, 0);
        }
        100% {
            transform: translate(50px, 50px);
        }
    }

    @keyframes rise {
        0% {
            transform: translateY(0) scale(0);
            opacity: 0;
        }
        10% {
            opacity: 0.8;
        }
        90% {
            opacity: 0.2;
        }
        100% {
            transform: translateY(-100vh) scale(1);
            opacity: 0;
        }
    }

    /* Content */
    .content {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        z-index: 10;
    }

    /* Logo Glow */
    .logo-glow {
        position: absolute;
        width: 200px;
        height: 200px;
        background: radial-gradient(
            circle,
            rgba(243, 156, 18, 0.4) 0%,
            transparent 70%
        );
        border-radius: 50%;
        filter: blur(40px);
        animation: pulseGlow 2s ease-in-out infinite;
    }

    @keyframes pulseGlow {
        0%,
        100% {
            transform: scale(1);
            opacity: 0.4;
        }
        50% {
            transform: scale(1.2);
            opacity: 0.6;
        }
    }

    /* Logo Container */
    .logo-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .logo {
        width: 120px;
        height: 120px;
        object-fit: contain;
        filter: drop-shadow(0 0 30px rgba(243, 156, 18, 0.5));
        animation: logoFloat 3s ease-in-out infinite;
    }

    @keyframes logoFloat {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-10px);
        }
    }

    .logo-ring {
        position: absolute;
        width: 160px;
        height: 160px;
        border: 2px solid rgba(243, 156, 18, 0.3);
        border-radius: 50%;
        animation: ringExpand 2s ease-out infinite;
    }

    .ring-2 {
        animation-delay: 1s;
    }

    @keyframes ringExpand {
        0% {
            transform: scale(0.8);
            opacity: 0.8;
        }
        100% {
            transform: scale(1.5);
            opacity: 0;
        }
    }

    /* Title */
    .title {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        margin: 0;
    }

    .title-text {
        font-size: 3rem;
        font-weight: 900;
        letter-spacing: -0.02em;
        background: linear-gradient(135deg, #fff 0%, #f5f5f5 50%, #ddd 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .title-highlight {
        font-size: 1.5rem;
        font-weight: 600;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        background: linear-gradient(
            135deg,
            #f39c12 0%,
            #daa520 50%,
            #b8860b 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    /* Subtitle */
    .subtitle {
        font-size: 0.875rem;
        font-weight: 500;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.5);
        margin: 0;
    }

    /* Loader */
    .loader-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        margin-top: 2rem;
    }

    .loader-track {
        width: 200px;
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
    }

    .loader-progress {
        height: 100%;
        background: linear-gradient(90deg, #f39c12, #daa520, #f39c12);
        background-size: 200% 100%;
        border-radius: 3px;
        transition: width 0.3s ease-out;
        animation: shimmer 1.5s linear infinite;
    }

    @keyframes shimmer {
        0% {
            background-position: -200% 0;
        }
        100% {
            background-position: 200% 0;
        }
    }

    .loader-text {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
        letter-spacing: 0.1em;
        margin: 0;
    }

    /* Skip Hint */
    .skip-hint {
        position: absolute;
        bottom: 2rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.3);
        letter-spacing: 0.05em;
    }

    /* Mobile Adjustments */
    @media (max-width: 640px) {
        .logo {
            width: 100px;
            height: 100px;
        }

        .logo-ring {
            width: 140px;
            height: 140px;
        }

        .title-text {
            font-size: 2.5rem;
        }

        .title-highlight {
            font-size: 1.25rem;
        }

        .orb-1 {
            width: 250px;
            height: 250px;
        }

        .orb-2 {
            width: 180px;
            height: 180px;
        }
    }
</style>
