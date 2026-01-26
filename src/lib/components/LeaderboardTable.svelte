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

  function getRankStyle(rank: number, isProfitRank: boolean = false): string {
    // We could differentiate styles for Profit Rank vs Points Rank if needed
    // For now, if they are top rank in either, give them gold
    if (rank === 1)
      return "bg-gradient-to-r from-gold-500/15 via-gold-500/5 to-transparent border-l-4 border-l-gold-500 shadow-[inset_0_0_20px_rgba(243,156,18,0.05)]";
    if (rank === 2)
      return "bg-gradient-to-r from-slate-400/10 via-slate-400/2 to-transparent border-l-4 border-l-slate-400 shadow-[inset_0_0_20px_rgba(148,163,184,0.03)]";
    if (rank === 3)
      return "bg-gradient-to-r from-amber-700/10 via-amber-700/2 to-transparent border-l-4 border-l-amber-700 shadow-[inset_0_0_20px_rgba(180,83,9,0.03)]";
    return "border-l-4 border-l-transparent";
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
          <th class="px-6 py-8 text-right">Points</th>
          <th class="px-6 py-8 text-right">Total Gain</th>
          <th class="px-10 py-8"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        {#each sortedData as entry, index}
          {@const rank = index + 1}
          {@const isDoubleWinner =
            entry.rankPoints === 1 && entry.rankProfit === 1}
          <tr
            class="group transition-all duration-500 cursor-pointer relative
              {entry.isDisqualified
              ? 'bg-red-900/10 hover:bg-red-900/20 border-l-4 border-l-red-500'
              : 'hover:bg-white/5 ' + getRankStyle(entry.rankPoints || 999)}"
            on:click={() => goto(`/leaderboard/${entry.id}`)}
          >
            <td class="px-10 py-8 relative">
              <div class="flex items-center gap-4">
                <span
                  class="text-xl font-mono font-black {entry.rankPoints === 1
                    ? 'text-gold-400'
                    : entry.rankPoints === 2
                      ? 'text-slate-300'
                      : entry.rankPoints === 3
                        ? 'text-amber-500'
                        : 'text-gray-500'}"
                >
                  {entry.rankPoints ? `#${entry.rankPoints}` : "-"}
                </span>
                {#if entry.rankPoints && entry.rankPoints <= 3}
                  <div
                    class="w-1.5 h-6 rounded-full animate-pulse
                    {entry.rankPoints === 1
                      ? 'bg-gold-500 shadow-[0_0_15px_rgba(243,156,18,0.6)]'
                      : entry.rankPoints === 2
                        ? 'bg-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.4)]'
                        : 'bg-amber-700 shadow-[0_0_15px_rgba(180,83,9,0.4)]'}"
                  ></div>
                {/if}
              </div>
            </td>
            <td class="px-6 py-8">
              <div class="flex items-center gap-6">
                <div
                  class="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500 shadow-2xl relative overflow-hidden"
                >
                  <div class="absolute inset-0 bg-black/40"></div>
                  {#if isDoubleWinner}
                    <div
                      class="absolute inset-0 bg-gradient-to-t from-gold-500/40 to-transparent animate-pulse"
                    ></div>
                  {:else if entry.rankPoints === 1 || entry.rankProfit === 1}
                    <div
                      class="absolute inset-0 bg-gradient-to-t from-gold-500/20 to-transparent"
                    ></div>
                  {/if}
                  <span
                    class="relative z-10 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  >
                    {#if isDoubleWinner}👑
                    {:else if entry.rankPoints === 1}🎯
                    {:else if entry.rankProfit === 1}💰
                    {:else if (entry.rankPoints || 99) <= 3}🏆
                    {:else}👤{/if}
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
                    {#if isDoubleWinner}
                      <span
                        class="text-[9px] bg-gold-500 text-black px-2 py-0.5 rounded font-black tracking-tighter uppercase animate-pulse"
                        >Double Winner</span
                      >
                    {:else}
                      {#if entry.rankPoints === 1}
                        <span
                          class="text-[9px] bg-slate-700 text-gold-400 border border-gold-400/50 px-2 py-0.5 rounded font-black tracking-tighter uppercase"
                          >Points Leader</span
                        >
                      {/if}
                      {#if entry.rankProfit === 1}
                        <span
                          class="text-[9px] bg-green-900/40 text-green-400 border border-green-500/50 px-2 py-0.5 rounded font-black tracking-tighter uppercase"
                          >Profit Leader</span
                        >
                      {/if}
                    {/if}
                  </div>
                  <div
                    class="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1"
                  >
                    {#if rank === 1}The Grand Champion{:else if rank <= 3}Elite
                      Grandmaster{:else if rank <= 10}Battle Vanguard{:else}Battle
                      Challenger{/if}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-8 text-right">
              <div class="flex flex-col items-end">
                <span
                  class="text-2xl font-black text-white tabular-nums tracking-tighter transition-all group-hover:scale-110 group-hover:text-gold-400"
                >
                  {entry.points.toLocaleString()}
                </span>
                <span
                  class="text-[9px] font-black text-gold-500/50 uppercase tracking-widest mt-1"
                  >Points</span
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
                  class="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(243,156,18,0.4)]"
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
      {@const isDoubleWinner = entry.rankPoints === 1 && entry.rankProfit === 1}
      <button
        class="w-full group relative flex items-center justify-between p-6 rounded-[2rem] border transition-all active:scale-95 duration-500 overflow-hidden
          {entry.isDisqualified
          ? 'bg-red-900/10 border-red-500/20'
          : rank === 1
            ? 'bg-gold-500/10 border-gold-500/30'
            : rank === 2
              ? 'bg-slate-400/10 border-slate-400/30'
              : rank === 3
                ? 'bg-amber-700/10 border-amber-600/30'
                : 'bg-white/5 border-white/10 hover:border-gold-500/50'}"
        on:click={() => goto(`/leaderboard/${entry.id}`)}
      >
        <div
          class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
        ></div>

        <div class="flex items-center gap-5 relative z-10">
          <div
            class="text-2xl font-black {rank === 1
              ? 'text-gold-500'
              : rank === 2
                ? 'text-slate-300'
                : rank === 3
                  ? 'text-amber-500'
                  : 'text-gray-600'} w-8 italic"
          >
            #{entry.rankPoints || "-"}
          </div>
          <div class="text-left">
            <div
              class="font-black text-white text-lg uppercase tracking-tighter flex flex-col"
            >
              <span class="flex items-center gap-2">
                {entry.nickname}
                {#if isDoubleWinner}👑
                {:else if entry.rankPoints === 1}🎯
                {:else if entry.rankProfit === 1}💰{/if}
              </span>
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
