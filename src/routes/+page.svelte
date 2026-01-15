<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import LeaderboardTable from "$lib/components/LeaderboardTable.svelte";
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
        class="min-h-screen bg-white dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8"
    >
        <div class="max-w-4xl mx-auto">
            <div
                class="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6"
            >
                <div class="space-y-2">
                    <h1
                        class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white"
                    >
                        Trading <span
                            class="bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent"
                            >Leaderboard</span
                        >
                    </h1>
                    <p
                        class="text-base text-gray-600 dark:text-gold-500/80 max-w-2xl"
                    >
                        Real-time ranking of the most elite traders in the
                        BigLot ecosystem.
                    </p>
                </div>
            </div>

            <div class="bg-white dark:bg-dark-surface rounded-lg shadow">
                <LeaderboardTable data={data.leaderboard} />
            </div>
        </div>
    </div>
</PullToRefresh>
