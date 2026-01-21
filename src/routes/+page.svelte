<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import LeaderboardTable from "$lib/components/LeaderboardTable.svelte";
    import TopTradersCards from "$lib/components/TopTradersCards.svelte";
    import PullToRefresh from "$lib/components/PullToRefresh.svelte";
    import Hero3D from "$lib/components/Hero3D.svelte";
    import type { PageData } from "./$types";
    import { onMount } from "svelte";

    export let data: PageData;

    let isRefreshing = false;
    let mounted = false;

    onMount(() => {
        mounted = true;
    });

    async function handleRefresh() {
        isRefreshing = true;
        await invalidateAll();
        // Add small delay for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 500));
        isRefreshing = false;
    }
</script>

<PullToRefresh {isRefreshing} on:refresh={handleRefresh}>
    <div
        class="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
        <!-- 3D Hero Background -->
        {#if mounted}
            <Hero3D />
        {/if}

        <!-- Ambient Background Glows -->
        <div
            class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold-500/10 blur-[150px] rounded-full pointer-events-none -z-10"
        ></div>
        <div
            class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-600/5 blur-[120px] rounded-full pointer-events-none -z-10"
        ></div>

        <!-- Grid Floor Effect -->
        <div
            class="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-t from-gold-500/5 to-transparent pointer-events-none -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"
        >
            <div
                class="absolute inset-0 bg-[linear-gradient(rgba(243,156,18,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(243,156,18,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(1000px)_rotateX(60deg)_scale(2)]"
            ></div>
        </div>

        <div class="max-w-6xl mx-auto relative z-10">
            <!-- Hero Section -->
            <section class="text-center pt-8 pb-20 space-y-8 animate-fade-in">
                <div
                    class="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-gold-500 text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl"
                >
                    <span class="relative flex h-2.5 w-2.5">
                        <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"
                        ></span>
                        <span
                            class="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold-500 shadow-[0_0_10px_rgba(243,156,18,0.8)]"
                        ></span>
                    </span>
                    Live Trading Battle
                </div>

                <div class="space-y-4">
                    <h1
                        class="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white"
                    >
                        DOMINATE THE <br />
                        <span
                            class="bg-gradient-to-r from-gold-600 via-gold-200 to-gold-500 bg-clip-text text-transparent drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                            >MARKETS</span
                        >
                    </h1>

                    <p
                        class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium"
                    >
                        Join the elite ranks of <span
                            class="text-gold-500 font-bold">BigLot</span
                        >. Compete in the ultimate challenge for traders who
                        dare to be legendary.
                    </p>
                </div>

                <div class="flex flex-wrap justify-center gap-4 pt-4">
                    <button
                        class="px-8 py-4 bg-gold-500 hover:bg-gold-400 text-black font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(243,156,18,0.3)]"
                    >
                        Join Battle
                    </button>
                    <button
                        class="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-xl transition-all border border-white/10 backdrop-blur-md"
                    >
                        View Rules
                    </button>
                </div>
            </section>

            <!-- Top 3 Showcase -->
            <TopTradersCards traders={data.leaderboard} />

            <!-- Main Leaderboard -->
            <div class="space-y-8 pt-12">
                <div
                    class="flex flex-col md:flex-row md:items-end justify-between gap-4"
                >
                    <div class="space-y-2">
                        <h2
                            class="text-3xl md:text-4xl font-black text-white flex items-center gap-4 uppercase tracking-tighter"
                        >
                            <span
                                class="w-2.5 h-10 bg-gold-500 rounded-full shadow-[0_0_15px_rgba(243,156,18,0.5)]"
                            ></span>
                            Hall of Fame
                        </h2>
                        <p class="text-gray-500 font-medium">
                            Global rankings of all active participants
                        </p>
                    </div>
                    <div
                        class="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gold-500/60 font-bold uppercase tracking-widest backdrop-blur-sm"
                    >
                        Refresh: 5m
                    </div>
                </div>

                <div
                    class="bg-white/[0.02] backdrop-blur-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)]"
                >
                    <LeaderboardTable data={data.leaderboard} />
                </div>
            </div>
        </div>
    </div>
</PullToRefresh>

<style>
    :global(.animate-fade-in) {
        animation: fadeIn 1s ease-out forwards;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
