<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { fade, scale, fly, blur } from "svelte/transition";
    import { quintOut, elasticOut, backOut, cubicOut, expoOut } from "svelte/easing";
    import { supabase } from "$lib/supabaseClient";

    export let duration = 3500; // Duration before auto-hide
    export let minLoadTime = 2000; // Minimum display time

    const dispatch = createEventDispatcher();

    let visible = true;
    let phase = 0; // Animation phases
    let showLogo = false;
    let showTitle = false;
    let showSubtitle = false;
    let showLoader = false;
    let showGlow = false;
    let showStats = false;
    let progress = 0;
    let displayProgress = 0;
    
    // Title animation
    const titleText = "BigLot";
    const subtitleText = "Trading Competition";
    let visibleChars = 0;
    let visibleSubChars = 0;
    
    // Stats animation - will be loaded from database
    let traders = 0;
    let volume = 0;
    let totalTrades = 0;
    
    // Target values from database
    let targetTraders = 0;
    let targetVolume = 0;
    let targetTrades = 0;

    function easeOutExpo(t: number): number {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function animateValue(start: number, end: number, duration: number, callback: (val: number) => void) {
        const startTime = performance.now();
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);
            callback(Math.floor(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
    
    async function fetchStats() {
        try {
            if (!supabase) {
                // Fallback to mock data if supabase is not configured
                targetTraders = 24;
                targetVolume = 500;
                targetTrades = 1250;
                return;
            }
            
            // Fetch total participants count
            const { count: participantsCount } = await supabase
                .from('participants')
                .select('*', { count: 'exact', head: true });
            
            targetTraders = participantsCount || 0;
            
            // Fetch latest stats for total volume (sum of equity from latest date)
            const { data: latestStats } = await supabase
                .from('daily_stats')
                .select('equity, date')
                .order('date', { ascending: false })
                .limit(100);
            
            if (latestStats && latestStats.length > 0) {
                // Get the latest date
                const latestDate = latestStats[0]?.date;
                // Sum equity for that date
                const latestDateStats = latestStats.filter(s => s.date === latestDate);
                const totalEquity = latestDateStats.reduce((sum, s) => sum + (Number(s.equity) || 0), 0);
                targetVolume = Math.round(totalEquity / 1000); // Convert to K
            }
            
            // Fetch total trades count
            const { count: tradesCount } = await supabase
                .from('trades')
                .select('*', { count: 'exact', head: true });
            
            targetTrades = tradesCount || 0;
            
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Fallback values
            targetTraders = 24;
            targetVolume = 500;
            targetTrades = 1250;
        }
    }

    onMount(() => {
        // Fetch stats from database
        fetchStats();
        
        // Phase 1: Initial glow and background
        setTimeout(() => { phase = 1; showGlow = true; }, 100);
        
        // Phase 2: Logo entrance with 3D effect
        setTimeout(() => { phase = 2; showLogo = true; }, 400);
        
        // Phase 3: Title character animation
        setTimeout(() => {
            phase = 3;
            showTitle = true;
            const titleInterval = setInterval(() => {
                if (visibleChars < titleText.length) {
                    visibleChars++;
                } else {
                    clearInterval(titleInterval);
                }
            }, 80);
        }, 800);
        
        // Phase 4: Subtitle animation
        setTimeout(() => {
            phase = 4;
            showSubtitle = true;
            const subInterval = setInterval(() => {
                if (visibleSubChars < subtitleText.length) {
                    visibleSubChars++;
                } else {
                    clearInterval(subInterval);
                }
            }, 40);
        }, 1300);
        
        // Phase 5: Stats and loader
        setTimeout(() => {
            phase = 5;
            showStats = true;
            showLoader = true;
            // Animate stats from database values
            animateValue(0, targetTraders, 1500, (val) => traders = val);
            animateValue(0, targetVolume, 1500, (val) => volume = val);
            animateValue(0, targetTrades, 1500, (val) => totalTrades = val);
        }, 1600);

        // Smooth progress animation
        const progressInterval = setInterval(() => {
            if (progress < 100) {
                progress += Math.random() * 8 + 2;
                if (progress > 100) progress = 100;
            }
        }, 100);
        
        // Smooth display progress
        const displayInterval = setInterval(() => {
            if (displayProgress < progress) {
                displayProgress += (progress - displayProgress) * 0.15;
                if (progress - displayProgress < 0.5) displayProgress = progress;
            }
        }, 16);

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
            clearInterval(displayInterval);
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
        transition:fade={{ duration: 600, easing: cubicOut }}
    >
        <!-- Animated Background -->
        <div class="background-effects">
            <!-- Aurora Effect -->
            <div class="aurora"></div>
            <div class="aurora aurora-2"></div>
            
            <!-- Gradient Orbs -->
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
            <div class="orb orb-3"></div>
            <div class="orb orb-4"></div>

            <!-- Grid Pattern -->
            <div class="grid-pattern"></div>
            
            <!-- Noise Texture -->
            <div class="noise"></div>

            <!-- Floating Particles -->
            {#each Array(30) as _, i}
                <div
                    class="particle"
                    style="--delay: {i * 0.15}s; --x: {Math.random() * 100}%; --size: {2 + Math.random() * 4}px; --duration: {3 + Math.random() * 4}s; --drift: {(Math.random() - 0.5) * 100}px"
                ></div>
            {/each}
            
            <!-- Sparkles -->
            {#each Array(15) as _, i}
                <div
                    class="sparkle"
                    style="--delay: {i * 0.2}s; --x: {10 + Math.random() * 80}%; --y: {10 + Math.random() * 80}%"
                ></div>
            {/each}
        </div>

        <!-- Main Content -->
        <div class="content">
            <!-- Glow Effect Behind Logo -->
            {#if showGlow}
                <div class="logo-glow-container">
                    <div
                        class="logo-glow"
                        in:scale={{ duration: 1200, easing: expoOut }}
                    ></div>
                    <div class="logo-glow-inner" in:scale={{ duration: 800, delay: 200 }}></div>
                </div>
            {/if}

            <!-- Logo with 3D Effect -->
            {#if showLogo}
                <div
                    class="logo-container"
                    in:scale={{ duration: 1000, start: 0.3, easing: elasticOut }}
                >
                    <div class="logo-3d-wrapper">
                        <img
                            src="/logo-masterpiece.png"
                            alt="BigLot Logo"
                            class="logo"
                        />
                        <div class="logo-reflection"></div>
                    </div>
                    
                    <!-- Multiple expanding rings -->
                    <div class="logo-ring ring-1"></div>
                    <div class="logo-ring ring-2"></div>
                    <div class="logo-ring ring-3"></div>
                    
                    <!-- Orbiting dots -->
                    <div class="orbit-container">
                        <div class="orbit-dot dot-1"></div>
                        <div class="orbit-dot dot-2"></div>
                        <div class="orbit-dot dot-3"></div>
                    </div>
                </div>
            {/if}

            <!-- Title with Character Animation -->
            {#if showTitle}
                <h1
                    class="title"
                    in:fly={{ y: 40, duration: 800, easing: backOut }}
                >
                    <span class="title-text">
                        {#each titleText.split('') as char, i}
                            <span 
                                class="char {i < visibleChars ? 'visible' : ''}"
                                style="--char-delay: {i * 0.05}s"
                            >{char}</span>
                        {/each}
                    </span>
                    <span class="title-line"></span>
                </h1>
            {/if}

            <!-- Subtitle with Typing Effect -->
            {#if showSubtitle}
                <div
                    class="subtitle-container"
                    in:fly={{ y: 20, duration: 600, easing: quintOut }}
                >
                    <p class="subtitle">
                        {#each subtitleText.split('') as char, i}
                            <span class="sub-char {i < visibleSubChars ? 'visible' : ''}">{char}</span>
                        {/each}
                        <span class="cursor"></span>
                    </p>
                </div>
            {/if}
            
            <!-- Stats Section -->
            {#if showStats}
                <div class="stats-container" in:fly={{ y: 30, duration: 600, delay: 100 }}>
                    <div class="stat-item">
                        <span class="stat-value">{traders.toLocaleString()}</span>
                        <span class="stat-label">Traders</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <span class="stat-value">${volume.toLocaleString()}K</span>
                        <span class="stat-label">Total Equity</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <span class="stat-value">{totalTrades.toLocaleString()}</span>
                        <span class="stat-label">Total Trades</span>
                    </div>
                </div>
            {/if}

            <!-- Enhanced Loader -->
            {#if showLoader}
                <div class="loader-container" in:fade={{ duration: 400 }}>
                    <div class="loader-wrapper">
                        <div class="loader-track">
                            <div
                                class="loader-progress"
                                style="width: {displayProgress}%"
                            >
                                <div class="loader-glow"></div>
                            </div>
                        </div>
                        <div class="loader-dots">
                            <span class="dot"></span>
                            <span class="dot"></span>
                            <span class="dot"></span>
                        </div>
                    </div>
                    <p class="loader-text">
                        <span class="loader-status">Initializing</span>
                        <span class="loader-percent">{Math.floor(displayProgress)}%</span>
                    </p>
                </div>
            {/if}
        </div>

        <!-- Skip Hint -->
        <div class="skip-hint" in:fade={{ delay: 2000, duration: 500 }}>
            <span class="skip-icon">↵</span> Tap anywhere to skip
        </div>
        
        <!-- Bottom Gradient -->
        <div class="bottom-gradient"></div>
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
            145deg,
            #030303 0%,
            #0a0a0a 30%,
            #111111 60%,
            #050505 100%
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
    
    /* Aurora Effect */
    .aurora {
        position: absolute;
        width: 150%;
        height: 150%;
        top: -25%;
        left: -25%;
        background: conic-gradient(
            from 180deg at 50% 50%,
            transparent 0deg,
            rgba(243, 156, 18, 0.08) 60deg,
            transparent 120deg,
            rgba(218, 165, 32, 0.05) 180deg,
            transparent 240deg,
            rgba(184, 134, 11, 0.08) 300deg,
            transparent 360deg
        );
        animation: auroraRotate 20s linear infinite;
    }
    
    .aurora-2 {
        animation-direction: reverse;
        animation-duration: 25s;
        opacity: 0.7;
    }
    
    @keyframes auroraRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(100px);
        opacity: 0.5;
        animation: float 10s ease-in-out infinite;
    }

    .orb-1 {
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, rgba(243, 156, 18, 0.4) 0%, transparent 70%);
        top: -150px;
        left: -150px;
        animation-delay: 0s;
    }

    .orb-2 {
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(184, 134, 11, 0.3) 0%, transparent 70%);
        bottom: -100px;
        right: -100px;
        animation-delay: -3s;
    }

    .orb-3 {
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(218, 165, 32, 0.25) 0%, transparent 70%);
        top: 40%;
        left: 60%;
        transform: translate(-50%, -50%);
        animation-delay: -6s;
    }
    
    .orb-4 {
        width: 250px;
        height: 250px;
        background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
        top: 60%;
        left: 20%;
        animation-delay: -9s;
    }

    .grid-pattern {
        position: absolute;
        inset: 0;
        background-image: 
            linear-gradient(rgba(243, 156, 18, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(243, 156, 18, 0.02) 1px, transparent 1px);
        background-size: 60px 60px;
        animation: gridMove 30s linear infinite;
        mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
        -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    }
    
    .noise {
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        opacity: 0.03;
        pointer-events: none;
    }

    .particle {
        position: absolute;
        width: var(--size);
        height: var(--size);
        background: radial-gradient(circle, #f39c12 0%, rgba(243, 156, 18, 0) 70%);
        border-radius: 50%;
        left: var(--x);
        bottom: -20px;
        opacity: 0;
        animation: rise var(--duration) ease-out infinite;
        animation-delay: var(--delay);
    }
    
    .sparkle {
        position: absolute;
        width: 4px;
        height: 4px;
        left: var(--x);
        top: var(--y);
        animation: sparkle 2s ease-in-out infinite;
        animation-delay: var(--delay);
    }
    
    .sparkle::before,
    .sparkle::after {
        content: '';
        position: absolute;
        background: #f39c12;
    }
    
    .sparkle::before {
        width: 100%;
        height: 1px;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
    }
    
    .sparkle::after {
        width: 1px;
        height: 100%;
        left: 50%;
        top: 0;
        transform: translateX(-50%);
    }
    
    @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
        50% { opacity: 1; transform: scale(1) rotate(90deg); }
    }

    @keyframes float {
        0%, 100% {
            transform: translate(0, 0) scale(1);
        }
        25% {
            transform: translate(30px, -40px) scale(1.1);
        }
        50% {
            transform: translate(-20px, 30px) scale(0.95);
        }
        75% {
            transform: translate(40px, 20px) scale(1.05);
        }
    }

    @keyframes gridMove {
        0% { transform: translate(0, 0); }
        100% { transform: translate(60px, 60px); }
    }

    @keyframes rise {
        0% {
            transform: translateY(0) translateX(0) scale(0);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) translateX(var(--drift)) scale(0.5);
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
    .logo-glow-container {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .logo-glow {
        position: absolute;
        width: 280px;
        height: 280px;
        background: radial-gradient(
            circle,
            rgba(243, 156, 18, 0.3) 0%,
            rgba(218, 165, 32, 0.15) 40%,
            transparent 70%
        );
        border-radius: 50%;
        filter: blur(50px);
        animation: pulseGlow 3s ease-in-out infinite;
    }
    
    .logo-glow-inner {
        position: absolute;
        width: 150px;
        height: 150px;
        background: radial-gradient(
            circle,
            rgba(255, 215, 0, 0.4) 0%,
            transparent 70%
        );
        border-radius: 50%;
        filter: blur(30px);
        animation: pulseGlow 2s ease-in-out infinite reverse;
    }

    @keyframes pulseGlow {
        0%, 100% {
            transform: scale(1);
            opacity: 0.5;
        }
        50% {
            transform: scale(1.3);
            opacity: 0.8;
        }
    }

    /* Logo Container */
    .logo-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        perspective: 1000px;
    }
    
    .logo-3d-wrapper {
        position: relative;
        transform-style: preserve-3d;
        animation: logo3D 6s ease-in-out infinite;
    }

    .logo {
        width: 140px;
        height: 140px;
        object-fit: contain;
        filter: drop-shadow(0 0 40px rgba(243, 156, 18, 0.6));
        animation: logoFloat 4s ease-in-out infinite;
    }
    
    .logo-reflection {
        position: absolute;
        bottom: -80px;
        left: 50%;
        transform: translateX(-50%) rotateX(180deg) scaleY(0.4);
        width: 140px;
        height: 140px;
        background: inherit;
        opacity: 0.15;
        filter: blur(4px);
        mask-image: linear-gradient(to bottom, transparent 30%, black 100%);
        -webkit-mask-image: linear-gradient(to bottom, transparent 30%, black 100%);
    }
    
    @keyframes logo3D {
        0%, 100% {
            transform: rotateY(0deg) rotateX(0deg);
        }
        25% {
            transform: rotateY(5deg) rotateX(3deg);
        }
        50% {
            transform: rotateY(-5deg) rotateX(-2deg);
        }
        75% {
            transform: rotateY(3deg) rotateX(2deg);
        }
    }

    @keyframes logoFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
    }

    .logo-ring {
        position: absolute;
        border-radius: 50%;
        border: 2px solid transparent;
        animation: ringPulse 3s ease-out infinite;
    }
    
    .ring-1 {
        width: 180px;
        height: 180px;
        border-color: rgba(243, 156, 18, 0.4);
        animation-delay: 0s;
    }
    
    .ring-2 {
        width: 220px;
        height: 220px;
        border-color: rgba(218, 165, 32, 0.3);
        animation-delay: 0.5s;
    }
    
    .ring-3 {
        width: 260px;
        height: 260px;
        border-color: rgba(184, 134, 11, 0.2);
        animation-delay: 1s;
    }

    @keyframes ringPulse {
        0% {
            transform: scale(0.8);
            opacity: 0.8;
        }
        100% {
            transform: scale(1.4);
            opacity: 0;
        }
    }
    
    /* Orbiting Dots */
    .orbit-container {
        position: absolute;
        width: 200px;
        height: 200px;
        animation: orbitSpin 8s linear infinite;
    }
    
    .orbit-dot {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #f39c12;
        border-radius: 50%;
        box-shadow: 0 0 15px rgba(243, 156, 18, 0.8);
    }
    
    .dot-1 {
        top: 0;
        left: 50%;
        transform: translateX(-50%);
    }
    
    .dot-2 {
        bottom: 15%;
        left: 10%;
    }
    
    .dot-3 {
        bottom: 15%;
        right: 10%;
    }
    
    @keyframes orbitSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    /* Title */
    .title {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
    }

    .title-text {
        font-size: 4rem;
        font-weight: 900;
        letter-spacing: -0.02em;
        display: flex;
    }
    
    .char {
        display: inline-block;
        background: linear-gradient(135deg, #fff 0%, #f5f5f5 50%, #e0e0e0 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        opacity: 0;
        transform: translateY(30px) rotateX(-90deg);
        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        transition-delay: var(--char-delay);
    }
    
    .char.visible {
        opacity: 1;
        transform: translateY(0) rotateX(0deg);
        text-shadow: 0 0 40px rgba(243, 156, 18, 0.3);
    }
    
    .title-line {
        width: 0;
        height: 3px;
        background: linear-gradient(90deg, transparent, #f39c12, #daa520, #f39c12, transparent);
        border-radius: 3px;
        animation: lineExpand 1s ease-out 1.2s forwards;
    }
    
    @keyframes lineExpand {
        to { width: 150px; }
    }

    /* Subtitle */
    .subtitle-container {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .subtitle {
        font-size: 1rem;
        font-weight: 500;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: transparent;
        margin: 0;
        display: flex;
    }
    
    .sub-char {
        opacity: 0;
        color: rgba(255, 255, 255, 0.6);
        transition: opacity 0.1s ease;
    }
    
    .sub-char.visible {
        opacity: 1;
    }
    
    .cursor {
        display: inline-block;
        width: 2px;
        height: 1em;
        background: #f39c12;
        margin-left: 2px;
        animation: blink 0.8s step-end infinite;
    }
    
    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
    }
    
    /* Stats */
    .stats-container {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-top: 1rem;
        padding: 1rem 2rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(243, 156, 18, 0.1);
        border-radius: 16px;
        backdrop-filter: blur(10px);
    }
    
    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
    }
    
    .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #f39c12;
        font-variant-numeric: tabular-nums;
    }
    
    .stat-label {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
    
    .stat-divider {
        width: 1px;
        height: 30px;
        background: linear-gradient(to bottom, transparent, rgba(243, 156, 18, 0.3), transparent);
    }

    /* Loader */
    .loader-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin-top: 2rem;
    }
    
    .loader-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }

    .loader-track {
        width: 240px;
        height: 4px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
    }

    .loader-progress {
        height: 100%;
        background: linear-gradient(90deg, #b8860b, #f39c12, #daa520, #f39c12);
        background-size: 300% 100%;
        border-radius: 4px;
        transition: width 0.1s linear;
        animation: shimmer 2s linear infinite;
        position: relative;
    }
    
    .loader-glow {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(243, 156, 18, 0.8) 0%, transparent 70%);
        border-radius: 50%;
        filter: blur(4px);
    }
    
    .loader-dots {
        display: flex;
        gap: 6px;
    }
    
    .loader-dots .dot {
        width: 6px;
        height: 6px;
        background: rgba(243, 156, 18, 0.5);
        border-radius: 50%;
        animation: dotPulse 1.4s ease-in-out infinite;
    }
    
    .loader-dots .dot:nth-child(2) { animation-delay: 0.2s; }
    .loader-dots .dot:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes dotPulse {
        0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
        }
        40% {
            transform: scale(1.2);
            opacity: 1;
        }
    }

    @keyframes shimmer {
        0% { background-position: 100% 0; }
        100% { background-position: -100% 0; }
    }

    .loader-text {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        letter-spacing: 0.05em;
        margin: 0;
    }
    
    .loader-status {
        animation: statusPulse 2s ease-in-out infinite;
    }
    
    @keyframes statusPulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }
    
    .loader-percent {
        font-weight: 600;
        color: #f39c12;
        min-width: 35px;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    /* Skip Hint */
    .skip-hint {
        position: absolute;
        bottom: 2.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.25);
        letter-spacing: 0.05em;
        transition: color 0.3s ease;
    }
    
    .skip-hint:hover {
        color: rgba(255, 255, 255, 0.5);
    }
    
    .skip-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        font-size: 0.625rem;
    }
    
    /* Bottom Gradient */
    .bottom-gradient {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 150px;
        background: linear-gradient(to top, rgba(243, 156, 18, 0.05), transparent);
        pointer-events: none;
    }

    /* Mobile Adjustments */
    @media (max-width: 640px) {
        .logo {
            width: 110px;
            height: 110px;
        }
        
        .ring-1 { width: 150px; height: 150px; }
        .ring-2 { width: 180px; height: 180px; }
        .ring-3 { width: 210px; height: 210px; }
        
        .orbit-container { width: 160px; height: 160px; }

        .title-text {
            font-size: 3rem;
        }
        
        .subtitle {
            font-size: 0.8rem;
            letter-spacing: 0.15em;
        }
        
        .stats-container {
            gap: 1rem;
            padding: 0.75rem 1.25rem;
        }
        
        .stat-value {
            font-size: 1rem;
        }
        
        .loader-track {
            width: 200px;
        }

        .orb-1 { width: 300px; height: 300px; }
        .orb-2 { width: 250px; height: 250px; }
        .orb-3 { width: 180px; height: 180px; }
        .orb-4 { width: 150px; height: 150px; }
        
        .logo-glow { width: 200px; height: 200px; }
    }
</style>
