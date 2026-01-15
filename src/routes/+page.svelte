<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import LeaderboardTable from "$lib/components/LeaderboardTable.svelte";
    import TopTradersCards from "$lib/components/TopTradersCards.svelte";
    import PullToRefresh from "$lib/components/PullToRefresh.svelte";
    import type { PageData } from "./$types";

    export let data: PageData;

    let isRefreshing = false;

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
        class="min-h-screen bg-white dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
        <!-- Background Decorative Elements -->
        <div
            class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-gold-900/10 to-transparent pointer-events-none -z-10"
        ></div>
        <div
            class="absolute -top-24 -left-24 w-96 h-96 bg-gold-500/5 blur-[120px] rounded-full pointer-events-none -z-10"
        ></div>

        <div class="max-w-6xl mx-auto">
            <!-- Hero Section -->
            <section class="text-center mb-16 space-y-6 animate-fade-in">
                <div
                    class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-500 text-xs font-bold tracking-widest uppercase"
                >
                    <span class="relative flex h-2 w-2">
                        <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"
                        ></span>
                        <span
                            class="relative inline-flex rounded-full h-2 w-2 bg-gold-500"
                        ></span>
                    </span>
                    Live Competition
                </div>

                <h1
                    class="text-5xl md:text-7xl font-black tracking-tighter text-gray-900 dark:text-white"
                >
                    Unleash Your <br />
                    <span
                        class="bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 bg-clip-text text-transparent drop-shadow-sm"
                        >Trading Potential</span
                    >
                </h1>

                <p
                    class="text-lg text-gray-600 dark:text-gold-200/60 max-w-2xl mx-auto leading-relaxed"
                >
                    Join the elite ranks of BigLot traders. Compete, analyze,
                    and dominate the markets in the ultimate trading challenge.
                </p>
            </section>

            <!-- Top 3 Showcase -->
            <TopTradersCards traders={data.leaderboard} />

            <!-- Main Leaderboard -->
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <h2
                        class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3"
                    >
                        <span class="w-2 h-8 bg-gold-500 rounded-full"></span>
                        Full Rankings
                    </h2>
                    <div class="text-xs text-gray-500 italic">
                        Updated every 5 minutes
                    </div>
                </div>

                <div
                    class="bg-white dark:bg-dark-surface/30 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden shadow-2xl"
                >
                    <LeaderboardTable data={data.leaderboard} />
                </div>
            </div>
        </div>
    </div>
</PullToRefresh>
