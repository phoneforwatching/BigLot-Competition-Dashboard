<script lang="ts">
    import { onMount } from "svelte";
    import type { EconomicEvent } from "$lib/data/calendarData";

    // State
    let events: EconomicEvent[] = [];
    let loading = true;
    let error = "";

    let selectedDate = new Date().toISOString().split("T")[0];
    let selectedImpact: "all" | "high" | "medium" | "low" = "all";

    onMount(async () => {
        try {
            const response = await fetch("/api/calendar");
            const result = await response.json();
            if (result.events) {
                events = result.events;
                // Default is already set to today, so we don't overwrite it
            } else {
                error = "Failed to load events";
            }
        } catch (e) {
            error = "Error loading calendar";
            console.error(e);
        } finally {
            loading = false;
        }
    });

    // Formatting helpers
    function formatDate(dateStr: string): string {
        const options: Intl.DateTimeFormatOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        return new Date(dateStr).toLocaleDateString("en-US", options);
    }

    // Filtering
    $: filteredEvents = events.filter((event) => {
        // Simple date matching - in real app might need better timezone handling
        const dateMatch = event.date === selectedDate;
        const impactMatch =
            selectedImpact === "all" || event.impact === selectedImpact;
        return dateMatch && impactMatch;
    });

    function getImpactColor(impact: string) {
        switch (impact) {
            case "high":
                return "bg-red-500 text-white";
            case "medium":
                return "bg-orange-400 text-white";
            case "low":
                return "bg-yellow-300 text-yellow-900";
            default:
                return "bg-gray-200 text-gray-800";
        }
    }

    // Flag mapping (simplified)
    const flags: Record<string, string> = {
        USD: "🇺🇸",
        EUR: "🇪🇺",
        GBP: "🇬🇧",
        JPY: "🇯🇵",
        AUD: "🇦🇺",
        CAD: "🇨🇦",
        CHF: "🇨🇭",
        NZD: "🇳🇿",
    };
</script>

<div
    class="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden shadow-lg transition-all duration-300"
>
    <!-- Header Controls -->
    <div
        class="p-6 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50"
    >
        <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
            <div>
                <h2
                    class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
                >
                    <span class="text-2xl">📅</span> Economic Calendar
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Key market events that could impact your trades.
                </p>
            </div>

            <!-- Filters -->
            <div class="flex items-center gap-3">
                <select
                    bind:value={selectedImpact}
                    class="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none"
                >
                    <option value="all">All Impact</option>
                    <option value="high">High Impact 🔴</option>
                    <option value="medium">Medium Impact 🟠</option>
                    <option value="low">Low Impact 🟡</option>
                </select>

                <input
                    type="date"
                    bind:value={selectedDate}
                    class="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none"
                />
            </div>
        </div>
    </div>

    <!-- Calendar List -->
    <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
            <thead
                class="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-dark-bg/50 border-b border-gray-100 dark:border-dark-border"
            >
                <tr>
                    <th class="px-6 py-3 font-semibold">Time</th>
                    <th class="px-6 py-3 font-semibold">Cur</th>
                    <th class="px-6 py-3 font-semibold">Event</th>
                    <th class="px-6 py-3 font-semibold text-center">Impact</th>
                    <th class="px-6 py-3 font-semibold text-right">Actual</th>
                    <th class="px-6 py-3 font-semibold text-right">Forecast</th>
                    <th class="px-6 py-3 font-semibold text-right">Previous</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-dark-border">
                {#if loading}
                    <tr>
                        <td
                            colspan="7"
                            class="px-6 py-12 text-center text-gray-500"
                        >
                            <div class="flex justify-center items-center gap-2">
                                <div
                                    class="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"
                                ></div>
                                Loading latest market data...
                            </div>
                        </td>
                    </tr>
                {:else if error}
                    <tr>
                        <td
                            colspan="7"
                            class="px-6 py-12 text-center text-red-500"
                        >
                            {error}
                        </td>
                    </tr>
                {:else if filteredEvents.length > 0}
                    {#each filteredEvents as event}
                        <tr
                            class="hover:bg-gray-50 dark:hover:bg-dark-bg/30 transition-colors group"
                        >
                            <td
                                class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap"
                            >
                                {event.time}
                            </td>
                            <td class="px-6 py-4">
                                <span
                                    class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300"
                                >
                                    <span class="text-xl"
                                        >{flags[event.currency] || "🌍"}</span
                                    >
                                    {event.currency}
                                </span>
                            </td>
                            <td
                                class="px-6 py-4 font-medium text-gray-800 dark:text-gray-200"
                            >
                                {event.event}
                            </td>
                            <td class="px-6 py-4 text-center">
                                <span
                                    class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide {getImpactColor(
                                        event.impact,
                                    )}"
                                >
                                    {event.impact}
                                </span>
                            </td>
                            <td
                                class="px-6 py-4 text-right font-bold {event.actual
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-400'}"
                            >
                                {event.actual || "-"}
                            </td>
                            <td
                                class="px-6 py-4 text-right text-gray-600 dark:text-gray-400"
                            >
                                {event.forecast || "-"}
                            </td>
                            <td
                                class="px-6 py-4 text-right text-gray-600 dark:text-gray-400"
                            >
                                {event.previous || "-"}
                            </td>
                        </tr>
                    {/each}
                {:else}
                    <tr>
                        <td
                            colspan="7"
                            class="px-6 py-12 text-center text-gray-500"
                        >
                            No events found for this date.
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>
</div>
