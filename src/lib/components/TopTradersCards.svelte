<script lang="ts">
    import type { LeaderboardEntry } from "$lib/mock/leaderboard";
    import { tilt } from "$lib/actions/tilt";

    export let traders: LeaderboardEntry[] = [];

    // Correct sorting by points and filter out disqualified
    $: top3 = [...traders]
        .filter((t) => !t.isDisqualified)
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

<div
    class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-end perspective-1000"
>
    {#each podiumTraders as trader, i}
        {#if trader}
            {@const rank = getRank(trader.id)}
            <a
                href="/leaderboard/{trader.id}"
                use:tilt={{ max: 10, perspective: 1000 }}
                class="group relative flex flex-col items-center p-8 rounded-[2rem] transition-all duration-300 transform-gpu
               {rank === 1
                    ? 'md:h-[22rem] justify-center order-1 md:order-2 bg-gradient-to-br from-gold-500/30 via-gold-500/10 to-transparent border-2 border-gold-400/50 shadow-[0_20px_50px_rgba(243,156,18,0.2)] backdrop-blur-xl'
                    : 'md:h-[18rem] justify-end order-2 bg-white/5 dark:bg-dark-surface/30 border border-white/10 dark:border-dark-border/50 hover:border-gold-500/30 backdrop-blur-md shadow-xl'}
               {rank === 2 ? 'md:order-1' : 'md:order-3'}"
            >
                <!-- 3D Glass Layer Effect (Subtle) -->
                <div
                    class="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent pointer-events-none"
                ></div>

                <!-- Rank Badge with 3D Float -->
                <div
                    class="absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-2xl border-2 z-10 transform rotate-12 group-hover:rotate-0 transition-transform
                    {rank === 1 ? 'bg-gold-500 border-gold-200 text-black' : ''}
                    {rank === 2 ? 'bg-slate-200 border-white text-black' : ''}
                    {rank === 3
                        ? 'bg-amber-700 border-amber-500 text-white'
                        : ''}"
                >
                    {#if rank === 1}🥇{:else if rank === 2}🥈{:else}🥉{/if}
                </div>

                <!-- Avatar with Glowing Ring -->
                <div
                    class="relative w-28 h-28 rounded-full bg-gradient-to-br from-dark-surface-light to-dark-bg border-[6px] {rank ===
                    1
                        ? 'border-gold-500'
                        : 'border-dark-border'} mb-6 flex items-center justify-center text-5xl overflow-hidden group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                >
                    {#if rank === 1}👑{:else if rank === 2}👤{:else}👤{/if}

                    {#if rank === 1}
                        <div
                            class="absolute inset-x-0 bottom-0 bg-gold-500 py-1 text-center font-black text-[10px] text-black uppercase tracking-tighter"
                        >
                            Legend
                        </div>
                    {/if}
                </div>

                <div class="text-center w-full z-10">
                    <h3
                        class="text-2xl font-black text-white mb-1 group-hover:text-gold-400 transition-colors truncate px-2 uppercase tracking-tight"
                    >
                        {trader.nickname}
                    </h3>
                    <p
                        class="text-[10px] font-bold text-gold-500/60 mb-6 uppercase tracking-[0.3em]"
                    >
                        {rank === 1 ? "Supreme Leader" : "Elite Player"}
                    </p>

                    <div
                        class="grid grid-cols-2 gap-4 pt-6 border-t border-white/10 dark:border-dark-border/30"
                    >
                        <div class="text-center">
                            <div
                                class="text-[10px] uppercase tracking-widest text-gray-500 mb-1"
                            >
                                Score
                            </div>
                            <div
                                class="text-lg {rank === 1
                                    ? 'text-gold-400'
                                    : 'text-white'} font-black tabular-nums"
                            >
                                {trader.points.toLocaleString()}
                            </div>
                        </div>
                        <div class="text-center">
                            <div
                                class="text-[10px] uppercase tracking-widest text-gray-500 mb-1"
                            >
                                Gain
                            </div>
                            <div
                                class="text-lg {trader.profit >= 0
                                    ? 'text-green-400'
                                    : 'text-red-400'} font-black tabular-nums"
                            >
                                {formatProfit(trader.profit)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ambient Glow for Rank 1 -->
                {#if rank === 1}
                    <div
                        class="absolute -inset-2 bg-gold-500/10 blur-[60px] rounded-full -z-20 animate-pulse"
                    ></div>
                {/if}
            </a>
        {/if}
    {/each}
</div>

<style>
    .perspective-1000 {
        perspective: 1000px;
    }
</style>
