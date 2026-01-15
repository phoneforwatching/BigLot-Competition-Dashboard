<script lang="ts">
  import type { LeaderboardEntry } from "$lib/mock/leaderboard";

  export let data: LeaderboardEntry[] = [];

  // Sort data: Points DESC, then Profit DESC
  $: sortedData = [...data].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return b.profit - a.profit;
  });

  function formatProfit(profit: number): string {
    const sign = profit > 0 ? "+" : "";
    return `${sign}${profit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function getRankStyle(rank: number): string {
    if (rank === 1)
      return "bg-gold-500/10 dark:bg-gold-500/20 border-gold-500 dark:border-gold-500 text-gold-600 dark:text-gold-400 shadow-[0_0_20px_rgba(243,156,18,0.2)] dark:shadow-[0_0_30px_rgba(243,156,18,0.15)] font-bold";
    if (rank === 2)
      return "bg-gold-500/5 dark:bg-gold-500/10 border-gold-600/50 dark:border-gold-600/50 text-gold-700 dark:text-gold-300 font-bold";
    if (rank === 3)
      return "bg-gold-500/5 dark:bg-gold-500/10 border-gold-700/30 dark:border-gold-700/30 text-gold-800 dark:text-gold-200 font-bold";
    return "bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-border/50";
  }

  function getRankIcon(rank: number): string {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  }
</script>

<div
  class="hidden md:block w-full overflow-x-auto shadow-xl rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface/50 backdrop-blur-sm animate-fade-in-up"
>
  <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
    <thead
      class="text-xs text-gray-700 dark:text-white uppercase bg-gray-50 dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border"
    >
      <tr>
        <th scope="col" class="px-6 py-3">Rank</th>
        <th scope="col" class="px-6 py-3">Nickname</th>
        <th scope="col" class="px-6 py-3 text-right">Points</th>
        <th scope="col" class="px-6 py-3 text-right">Profit (USD)</th>
      </tr>
    </thead>
    <tbody>
      {#if sortedData.length === 0}
        <tr>
          <td colspan="4" class="px-6 py-4 text-center dark:text-gray-400"
            >No participants yet.</td
          >
        </tr>
      {:else}
        {#each sortedData as entry, index}
          {@const rank = index + 1}
          <tr
            class="border-b dark:border-dark-border/50 {getRankStyle(
              rank,
            )} transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            style="animation: fadeInUp 0.4s ease-out forwards; animation-delay: {index *
              0.05}s; opacity: 0;"
            on:click={() => (window.location.href = `/leaderboard/${entry.id}`)}
          >
            <td class="px-6 py-4 font-bold whitespace-nowrap">
              <span class="text-lg">{getRankIcon(rank)}</span>
            </td>
            <td class="px-6 py-4 font-medium whitespace-nowrap">
              {entry.nickname}
            </td>
            <td class="px-6 py-4 text-right font-bold">
              {entry.points.toLocaleString()}
            </td>
            <td
              class="px-6 py-4 text-right font-mono {entry.profit >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'}"
            >
              {formatProfit(entry.profit)}
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<!-- Mobile Card View -->
<div class="md:hidden space-y-4 mt-4">
  {#each sortedData as entry, index}
    {@const rank = index + 1}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="p-4 rounded-lg shadow border {getRankStyle(
        rank,
      )} flex justify-between items-center cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style="animation: fadeInUp 0.4s ease-out forwards; animation-delay: {index *
        0.05}s; opacity: 0;"
      on:click={() => (window.location.href = `/leaderboard/${entry.id}`)}
    >
      <div class="flex items-center gap-3">
        <span class="text-2xl">{getRankIcon(rank)}</span>
        <div>
          <div class="font-bold">{entry.nickname}</div>
          <div class="text-xs opacity-75">Rank {rank}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="font-bold">{entry.points.toLocaleString()} pts</div>
        <div
          class="font-mono text-sm {entry.profit >= 0
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'}"
        >
          {formatProfit(entry.profit)}
        </div>
      </div>
    </div>
  {/each}
</div>
