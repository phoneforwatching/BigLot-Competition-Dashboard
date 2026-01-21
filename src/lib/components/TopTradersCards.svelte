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

    const rankStyles = {
        1: {
            container:
                "md:h-[28rem] bg-gradient-to-b from-gold-500/20 via-gold-600/5 to-transparent border-gold-400/50 shadow-[0_0_80px_rgba(243,156,18,0.15)]",
            badge: "bg-gradient-to-br from-[#FFEDB3] via-[#F39C12] to-[#9C6D16] text-black shadow-[0_10px_20px_rgba(243,156,18,0.4)]",
            avatarBorder:
                "border-gold-400 shadow-[0_0_30px_rgba(243,156,18,0.4)]",
            accent: "text-gold-400",
            label: "Supreme Leader",
            crown: "👑",
        },
        2: {
            container:
                "md:h-[25rem] bg-gradient-to-b from-slate-400/10 via-slate-500/5 to-transparent border-slate-400/30 shadow-[0_0_60px_rgba(148,163,184,0.1)]",
            badge: "bg-gradient-to-br from-[#F8FAFC] via-[#94A3B8] to-[#475569] text-black shadow-[0_10px_20px_rgba(148,163,184,0.3)]",
            avatarBorder:
                "border-slate-300 shadow-[0_0_20px_rgba(148,163,184,0.3)]",
            accent: "text-slate-300",
            label: "Elite Challenger",
            crown: "",
        },
        3: {
            container:
                "md:h-[23rem] bg-gradient-to-b from-amber-700/10 via-amber-800/5 to-transparent border-amber-600/30 shadow-[0_0_50px_rgba(180,83,9,0.1)]",
            badge: "bg-gradient-to-br from-[#FCD34D] via-[#B45309] to-[#78350F] text-white shadow-[0_10px_20px_rgba(180,83,9,0.3)]",
            avatarBorder:
                "border-amber-600 shadow-[0_0_15px_rgba(180,83,9,0.3)]",
            accent: "text-amber-500",
            label: "Pro Contender",
            crown: "",
        },
    };
</script>

<div
    class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-end perspective-2000"
>
    {#each podiumTraders as trader, i}
        {#if trader}
            {@const rank = getRank(trader.id)}
            {@const style = rankStyles[rank as 1 | 2 | 3]}
            <a
                href="/leaderboard/{trader.id}"
                use:tilt={{ max: 8, perspective: 2000 }}
                class="group relative flex flex-col items-center p-8 rounded-[2.5rem] transition-all duration-500 transform-gpu border backdrop-blur-2xl justify-center
                {style.container}
                {rank === 1
                    ? 'order-1 md:order-2 scale-110 md:scale-105 z-20'
                    : rank === 2
                      ? 'order-2 md:order-1 z-10'
                      : 'order-3 md:order-3 z-10'}"
            >
                <!-- Shine Effect -->
                <div
                    class="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none"
                >
                    <div
                        class="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                    ></div>
                </div>

                <!-- Glow Background -->
                <div
                    class="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none"
                ></div>

                <!-- Rank Badge -->
                <div
                    class="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black z-30 transform -rotate-12 group-hover:rotate-0 group-hover:-translate-y-2 transition-all duration-500
                    {style.badge}"
                >
                    {rank}
                </div>

                <!-- Avatar Area -->
                <div class="relative mb-6 mt-4">
                    <!-- Glow Ring -->
                    <div
                        class="absolute -inset-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl {rank ===
                        1
                            ? 'bg-gold-500/30'
                            : 'bg-white/10'}"
                    ></div>

                    <div
                        class="relative w-32 h-32 rounded-full bg-dark-bg border-[4px] {style.avatarBorder} flex items-center justify-center text-5xl overflow-hidden transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl"
                    >
                        {#if rank === 1}
                            <span
                                class="drop-shadow-[0_0_10px_rgba(243,156,18,0.5)]"
                                >👑</span
                            >
                        {:else}
                            <span class="opacity-80">👤</span>
                        {/if}

                        {#if rank === 1}
                            <div
                                class="absolute inset-0 bg-gradient-to-t from-gold-500/20 to-transparent"
                            ></div>
                        {/if}
                    </div>

                    <!-- Floating Icons for Rank 1 -->
                    {#if rank === 1}
                        <div
                            class="absolute -right-2 -top-2 animate-bounce-slow text-3xl"
                        >
                            ✨
                        </div>
                        <div
                            class="absolute -left-4 bottom-4 animate-float text-xl"
                        >
                            💎
                        </div>
                    {/if}
                </div>

                <div class="text-center w-full z-10">
                    <div class="flex items-center justify-center gap-2 mb-1">
                        <h3
                            class="text-2xl md:text-3xl font-black text-white group-hover:text-gold-400 transition-colors truncate px-2 tracking-tighter uppercase"
                        >
                            {trader.nickname}
                        </h3>
                    </div>

                    <p
                        class="text-[10px] md:text-[11px] font-black text-white/40 mb-6 uppercase tracking-[0.4em] flex items-center justify-center gap-2"
                    >
                        <span
                            class="w-1.5 h-1.5 rounded-full {rank === 1
                                ? 'bg-gold-500 animate-pulse'
                                : 'bg-white/20'}"
                        ></span>
                        {style.label}
                    </p>

                    <div
                        class="grid grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5 backdrop-blur-sm"
                    >
                        <div
                            class="p-4 bg-white/[0.02] flex flex-col justify-center items-center"
                        >
                            <div
                                class="text-[9px] uppercase tracking-[0.2em] text-gray-500 mb-1 font-bold whitespace-nowrap"
                            >
                                Points
                            </div>
                            <div
                                class="text-xl {style.accent} font-black tabular-nums truncate w-full text-center"
                            >
                                {trader.points.toLocaleString()}
                            </div>
                        </div>
                        <div
                            class="p-4 bg-white/[0.02] flex flex-col justify-center items-center"
                        >
                            <div
                                class="text-[9px] uppercase tracking-[0.2em] text-gray-500 mb-1 font-bold whitespace-nowrap"
                            >
                                Total P/L
                            </div>
                            <div
                                class="text-xl {trader.profit >= 0
                                    ? 'text-green-400'
                                    : 'text-red-400'} font-black tabular-nums truncate w-full text-center"
                            >
                                {formatProfit(trader.profit)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ambient Glow for Rank 1 -->
                {#if rank === 1}
                    <div
                        class="absolute -inset-4 bg-gold-500/10 blur-[80px] rounded-full -z-20 animate-pulse-slow"
                    ></div>
                {/if}
            </a>
        {/if}
    {/each}
</div>

<style>
    .perspective-2000 {
        perspective: 2000px;
    }

    @keyframes -global-bounce-slow {
        0%,
        100% {
            transform: translateY(0) rotate(0);
        }
        50% {
            transform: translateY(-10px) rotate(10deg);
        }
    }

    @keyframes -global-float {
        0%,
        100% {
            transform: translate(0, 0);
        }
        33% {
            transform: translate(5px, -5px);
        }
        66% {
            transform: translate(-5px, 5px);
        }
    }

    @keyframes -global-pulse-slow {
        0%,
        100% {
            opacity: 0.5;
            transform: scale(1);
        }
        50% {
            opacity: 0.8;
            transform: scale(1.1);
        }
    }

    .animate-bounce-slow {
        animation: bounce-slow 3s infinite ease-in-out;
    }

    .animate-float {
        animation: float 5s infinite ease-in-out;
    }

    .animate-pulse-slow {
        animation: pulse-slow 4s infinite ease-in-out;
    }
</style>
