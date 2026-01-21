<script lang="ts">
  import { goto } from "$app/navigation";
  import type { LeaderboardEntry } from "$lib/mock/leaderboard";

  export let data: LeaderboardEntry[] = [];

  $: sortedData = [...data].sort((a, b) => {
    // 1. Sort by Disqualified status (Active first)
    if (a.isDisqualified !== b.isDisqualified) return a.isDisqualified ? 1 : -1;

    // 2. Sort by Points
    if (b.points !== a.points) return b.points - a.points;

    // 3. Sort by Profit
    return b.profit - a.profit;
  });

  function formatProfit(profit: number): string {
    const sign = profit > 0 ? "+" : profit < 0 ? "-" : "";
    return `${sign}$${Math.abs(profit).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  function getRankStyle(rank: number): string {
    if (rank === 1) return "from-gold-500/10 to-transparent";
    if (rank === 2) return "from-slate-400/5 to-transparent";
    if (rank === 3) return "from-amber-700/5 to-transparent";
    return "";
  }
</script>

<div class="w-full">
  <!-- Desktop Table -->
  <div class="hidden md:block">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr
          class="bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-[0.3em] text-gray-400 font-black"
        >
          <th class="px-10 py-8">POS</th>
          <th class="px-6 py-8">Trader Profile</th>
          <th class="px-6 py-8 text-right">Battle Score</th>
          <th class="px-6 py-8 text-right">Total Gain</th>
          <th class="px-10 py-8"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        {#each sortedData as entry, index}
          {@const rank = index + 1}
          <tr
            class="group transition-all duration-500 cursor-pointer relative
              {entry.isDisqualified
              ? 'bg-red-900/10 hover:bg-red-900/20'
              : 'hover:bg-white/5 ' + getRankStyle(rank)}"
            on:click={() => goto(`/leaderboard/${entry.id}`)}
          >
            <td class="px-10 py-8 relative">
              <div class="flex items-center gap-4">
                <span
                  class="text-xl font-mono font-black {rank <= 3
                    ? 'text-gold-500'
                    : 'text-gray-500'}"
                >
                  {rank.toString().padStart(2, "0")}
                </span>
                {#if rank <= 3}
                  <div
                    class="w-1.5 h-6 bg-gold-500 rounded-full shadow-[0_0_15px_rgba(243,156,18,0.5)]"
                  ></div>
                {/if}
              </div>
            </td>
            <td class="px-6 py-8">
              <div class="flex items-center gap-6">
                <div
                  class="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500 shadow-2xl relative"
                >
                  <div class="absolute inset-0 rounded-2xl bg-black/40"></div>
                  <span class="relative z-10">
                    {#if rank === 1}👑{:else if rank === 2}🥈{:else if rank === 3}🥉{:else}👤{/if}
                  </span>
                </div>
                <div>
                  <div
                    class="font-black text-white text-lg uppercase tracking-tight group-hover:text-gold-400 transition-all duration-300 flex items-center gap-3"
                  >
                    {entry.nickname}
                    {#if entry.isDisqualified}
                      <span
                        class="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full"
                        >Disqualified</span
                      >
                    {/if}
                  </div>
                  <div
                    class="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1"
                  >
                    {#if rank === 1}The Grand Champion{:else if rank <= 10}Elite
                      Grandmaster{:else}Battle Challenger{/if}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-8 text-right">
              <div class="flex flex-col items-end">
                <span
                  class="text-2xl font-black text-white tabular-nums tracking-tighter"
                >
                  {entry.points.toLocaleString()}
                </span>
                <span
                  class="text-[9px] font-black text-gold-500/50 uppercase tracking-widest mt-1"
                  >Consistency Pts</span
                >
              </div>
            </td>
            <td class="px-6 py-8 text-right tabular-nums">
              <div class="flex flex-col items-end">
                <span
                  class="text-xl font-bold {entry.profit >= 0
                    ? 'text-green-400'
                    : 'text-red-400'} tracking-tight"
                >
                  {formatProfit(entry.profit)}
                </span>
                <span
                  class="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1"
                  >Realized Profit</span
                >
              </div>
            </td>
            <td class="px-10 py-8 text-right">
              <div
                class="opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0"
              >
                <div
                  class="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-black"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Mobile List View -->
  <div class="md:hidden space-y-4 p-4">
    {#each sortedData as entry, index}
      {@const rank = index + 1}
      <button
        class="w-full group relative flex items-center justify-between p-6 rounded-[2rem] border transition-all active:scale-95 duration-500 overflow-hidden
          {entry.isDisqualified
          ? 'bg-red-900/10 border-red-500/20'
          : 'bg-white/5 border-white/10 hover:border-gold-500/50'}"
        on:click={() => goto(`/leaderboard/${entry.id}`)}
      >
        <div
          class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
        ></div>

        <div class="flex items-center gap-5 relative z-10">
          <div
            class="text-2xl font-black {rank <= 3
              ? 'text-gold-500'
              : 'text-gray-600'} w-8 italic"
          >
            #{rank}
          </div>
          <div>
            <div
              class="font-black text-white text-lg uppercase tracking-tighter flex flex-col"
            >
              {entry.nickname}
              {#if entry.isDisqualified}
                <span
                  class="text-[8px] text-red-500 font-bold uppercase tracking-widest mt-1"
                  >Disqualified</span
                >
              {/if}
            </div>
            <div
              class="text-[10px] text-gold-500/60 font-black uppercase tracking-widest mt-1"
            >
              {entry.points.toLocaleString()} PTS
            </div>
          </div>
        </div>
        <div class="text-right relative z-10">
          <div
            class="font-black text-lg {entry.profit >= 0
              ? 'text-green-400'
              : 'text-red-400'}"
          >
            {formatProfit(entry.profit)}
          </div>
          <div
            class="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1"
          >
            GAIN
          </div>
        </div>
      </button>
    {/each}
  </div>
</div>
