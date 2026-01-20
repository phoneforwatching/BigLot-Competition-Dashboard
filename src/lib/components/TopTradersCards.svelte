<script lang="ts">
    import type { LeaderboardEntry } from "$lib/mock/leaderboard";

    export let traders: LeaderboardEntry[] = [];

    // Correct sorting by points
    $: top3 = [...traders]
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 3);

    // Reorder for the grid: [Rank 2, Rank 1, Rank 3]
    // This makes Rank 1 appear in the middle column on a 3-column grid
    $: podiumTraders = [
        top3[1] || null, // Left (2nd)
        top3[0] || null, // Center (1st)
        top3[2] || null, // Right (3rd)
    ];

    function formatProfit(profit: number): string {
        const sign = profit > 0 ? "+" : profit < 0 ? "-" : "";
        return `${sign}$${Math.abs(profit).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }

    function getRank(traderId: string) {
        return top3.findIndex((t) => t?.id === traderId) + 1;
    }
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
    {#each podiumTraders as trader, i}
        {#if trader}
            {@const rank = getRank(trader.id)}
            <a
                href="/leaderboard/{trader.id}"
                class="group relative flex flex-col items-center p-6 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95
               {rank === 1
                    ? 'md:h-80 justify-center order-1 md:order-2 bg-gradient-to-b from-gold-500/20 to-gold-500/5 border-2 border-gold-500 shadow-[0_0_40px_rgba(243,156,18,0.15)]'
                    : 'md:h-64 justify-end order-2 bg-dark-surface/50 border border-dark-border hover:border-gold-500/50'}
               {rank === 2 ? 'md:order-1' : 'md:order-3'}"
            >
                <!-- Rank Badge -->
                <div
                    class="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg border-2 z-10
                    {rank === 1 ? 'bg-gold-500 border-gold-400 text-black' : ''}
                    {rank === 2 ? 'bg-gray-300 border-white text-black' : ''}
                    {rank === 3
                        ? 'bg-orange-400 border-orange-300 text-black'
                        : ''}"
                >
                    {#if rank === 1}🥇{:else if rank === 2}🥈{:else}🥉{/if}
                </div>

                <!-- Avatar -->
                <div
                    class="relative w-24 h-24 rounded-full bg-gradient-to-br from-dark-surface-light to-dark-bg border-4 border-dark-border mb-4 flex items-center justify-center text-4xl overflow-hidden group-hover:border-gold-500/50 transition-colors shadow-xl"
                >
                    {#if rank === 1}🤴{:else if rank === 2}👤{:else}👤{/if}

                    {#if rank === 1}
                        <div
                            class="absolute inset-x-0 bottom-0 bg-gold-500/20 py-1 text-center font-black text-[10px] text-gold-500 uppercase tracking-tighter"
                        >
                            Champion
                        </div>
                    {/if}
                </div>

                <div class="text-center w-full">
                    <h3
                        class="text-xl font-black text-white mb-1 group-hover:text-gold-400 transition-colors truncate px-2 uppercase tracking-tight"
                    >
                        {trader.nickname}
                    </h3>
                    <p
                        class="text-[10px] font-bold text-gray-500 mb-4 uppercase tracking-[0.2em]"
                    >
                        {rank === 1 ? "Competition Leader" : "Elite Challenger"}
                    </p>

                    <div
                        class="grid grid-cols-2 gap-2 pt-4 border-t border-dark-border/50"
                    >
                        <div class="text-center border-r border-dark-border/30">
                            <div
                                class="text-[9px] uppercase tracking-widest text-gray-500 mb-1"
                            >
                                Points
                            </div>
                            <div
                                class="{rank === 1
                                    ? 'text-gold-400'
                                    : 'text-white'} font-black tabular-nums"
                            >
                                {trader.points.toLocaleString()}
                            </div>
                        </div>
                        <div class="text-center">
                            <div
                                class="text-[9px] uppercase tracking-widest text-gray-500 mb-1"
                            >
                                Profit
                            </div>
                            <div
                                class="{trader.profit >= 0
                                    ? 'text-green-500'
                                    : 'text-red-500'} font-black tabular-nums"
                            >
                                {formatProfit(trader.profit)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Glow effect for Rank 1 -->
                {#if rank === 1}
                    <div
                        class="absolute inset-0 bg-gold-500/5 blur-3xl rounded-full -z-10 animate-pulse"
                    ></div>
                {/if}
            </a>
        {/if}
    {/each}
</div>

<style>
    /* Optional: Add custom animations or styles if needed */
</style>
