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
    if (rank === 1) return "from-gold-600/10 to-transparent";
    if (rank === 2) return "from-gray-400/5 to-transparent";
    if (rank === 3) return "from-orange-400/5 to-transparent";
    return "";
  }
</script>

<div class="w-full">
  <!-- Desktop Table -->
  <div class="hidden md:block">
    <table class="w-full text-left">
      <thead>
        <tr
          class="border-b border-dark-border/50 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold"
        >
          <th class="px-8 py-6">Rank</th>
          <th class="px-6 py-6 font-black">Participant</th>
          <th class="px-6 py-6 text-right">Points</th>
          <th class="px-6 py-6 text-right">Profit</th>
          <th class="px-8 py-6"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-dark-border/30">
        {#each sortedData as entry, index}
          {@const rank = index + 1}
          <tr
            class="group transition-all duration-300 cursor-pointer border-b border-dark-border/30
              {entry.isDisqualified
              ? 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20 w-full'
              : 'hover:bg-gradient-to-r hover:bg-gold-500/5 ' +
                getRankStyle(rank)}"
            on:click={() => goto(`/leaderboard/${entry.id}`)}
          >
            <td class="px-8 py-6">
              <div class="flex items-center gap-3">
                <span
                  class="text-sm font-mono font-black {rank <= 3
                    ? 'text-gold-500'
                    : 'text-gray-600'}"
                >
                  {rank.toString().padStart(2, "0")}
                </span>
                {#if rank === 1}
                  <span
                    class="w-1 h-4 bg-gold-500 rounded-full shadow-[0_0_8px_rgba(243,156,18,0.5)]"
                  ></span>
                {/if}
              </div>
            </td>
            <td class="px-6 py-6">
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center text-lg group-hover:border-gold-500/50 transition-colors"
                >
                  {#if rank === 1}🤴{:else if rank === 2}🥈{:else if rank === 3}🥉{:else}👤{/if}
                </div>
                <div>
                  <div
                    class="font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-gold-400 transition-colors"
                  >
                    {entry.nickname}
                    {#if entry.isDisqualified}
                      <span
                        class="ml-2 text-[10px] text-red-500 font-bold uppercase tracking-wider border border-red-500/30 px-1 py-0.5 rounded"
                        >Disqualified</span
                      >
                    {/if}
                  </div>
                  <div
                    class="text-[10px] text-gray-500 font-bold uppercase tracking-widest"
                  >
                    {rank <= 10 ? "Market Master" : "Challenger"}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-6 text-right">
              <span
                class="text-lg font-black text-gray-900 dark:text-white tabular-nums"
              >
                {entry.points.toLocaleString()}
              </span>
            </td>
            <td class="px-6 py-6 text-right tabular-nums">
              <span
                class="font-mono font-bold {entry.profit >= 0
                  ? 'text-green-500'
                  : 'text-red-500'}"
              >
                {formatProfit(entry.profit)}
              </span>
            </td>
            <td class="px-8 py-6 text-right">
              <div
                class="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform"
              >
                <span
                  class="inline-flex items-center gap-1 text-xs font-black text-gold-500 uppercase tracking-tighter"
                >
                  View Profile
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Mobile List View -->
  <div class="md:hidden space-y-3 p-4">
    {#each sortedData as entry, index}
      {@const rank = index + 1}
      <button
        class="w-full flex items-center justify-between p-5 rounded-2xl border active:scale-95 transition-all text-left
          {entry.isDisqualified
          ? 'bg-red-50/50 dark:bg-red-900/10 border-red-500/30'
          : 'bg-dark-surface/50 border-dark-border'}"
        on:click={() => goto(`/leaderboard/${entry.id}`)}
      >
        <div class="flex items-center gap-4">
          <div
            class="text-lg font-black {rank <= 3
              ? 'text-gold-500'
              : 'text-gray-600'} w-6"
          >
            {rank}
          </div>
          <div>
            <div class="font-black text-white uppercase tracking-tighter">
              {entry.nickname}
              {#if entry.isDisqualified}
                <span
                  class="ml-2 text-[10px] text-red-500 font-bold uppercase tracking-wider"
                  >Disqualified</span
                >
              {/if}
            </div>
            <div class="text-[10px] text-gray-500 uppercase tracking-widest">
              {entry.points.toLocaleString()} pts
            </div>
          </div>
        </div>
        <div class="text-right">
          <div
            class="font-mono font-bold {entry.profit >= 0
              ? 'text-green-500'
              : 'text-red-500'}"
          >
            {formatProfit(entry.profit)}
          </div>
          <div
            class="text-[10px] text-gray-500 uppercase tracking-widest italic"
          >
            Profit
          </div>
        </div>
      </button>
    {/each}
  </div>
</div>
