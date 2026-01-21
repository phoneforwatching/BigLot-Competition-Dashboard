<script lang="ts">
    import { onMount } from "svelte";
    import type { EconomicEvent } from "$lib/data/calendarData";

    // State
    let events: EconomicEvent[] = [];
    let loading = true;
    let error = "";

    let selectedImpact: "all" | "high" | "medium" | "low" = "all";
    let selectedDate = new Date().toISOString().split("T")[0];

    onMount(async () => {
        try {
            const response = await fetch("/api/calendar");
            const result = await response.json();
            if (result.events) {
                events = result.events;
                // Auto-select today if no date selected? Or leave empty to show all.
                // standard practice for calendar usually shows "today" or "this week".
                // Since we grouped by date, showing all is nice, but user wants selection.
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

    // Filtering
    $: filteredEvents = events.filter((event) => {
        const impactMatch =
            selectedImpact === "all" || event.impact === selectedImpact;
        const dateMatch = !selectedDate || event.date === selectedDate;
        return impactMatch && dateMatch;
    });

    // Formatting helpers
    function formatDate(dateStr: string): string {
        try {
            const options: Intl.DateTimeFormatOptions = {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            };
            return new Date(dateStr).toLocaleDateString("en-US", options);
        } catch (e) {
            return dateStr;
        }
    }

    // Grouping
    $: groupedEvents = filteredEvents.reduce(
        (acc, event) => {
            if (!acc[event.date]) {
                acc[event.date] = [];
            }
            acc[event.date].push(event);
            return acc;
        },
        {} as Record<string, EconomicEvent[]>,
    );

    $: sortedDates = Object.keys(groupedEvents).sort();

    function getImpactColor(impact: string) {
        switch (impact) {
            case "high":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800";
            case "medium":
                return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800";
            case "low":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
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
        CNY: "🇨🇳",
    };
</script>

<div class="space-y-6">
    <!-- Header Controls -->
    <div
        class="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4"
    >
        <div>
            <h2
                class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
            >
                <span class="text-2xl">📅</span> Economic Calendar
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upcoming market events for this week
            </p>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500 dark:text-gray-400"
                    >Impact:</span
                >
                <select
                    bind:value={selectedImpact}
                    class="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none cursor-pointer"
                >
                    <option value="all">All</option>
                    <option value="high">High 🔴</option>
                    <option value="medium">Medium 🟠</option>
                    <option value="low">Low 🟡</option>
                </select>
            </div>

            <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500 dark:text-gray-400"
                    >Date:</span
                >
                <input
                    type="date"
                    bind:value={selectedDate}
                    class="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none cursor-pointer"
                />
                {#if selectedDate}
                    <button
                        on:click={() => (selectedDate = "")}
                        class="text-xs text-red-500 hover:text-red-700 hover:underline"
                    >
                        Clear
                    </button>
                {/if}
            </div>
        </div>
    </div>

    <!-- Calendar List -->
    {#if loading}
        <div class="py-20 text-center">
            <div class="flex flex-col justify-center items-center gap-4">
                <div
                    class="w-10 h-10 border-3 border-gold-500 border-t-transparent rounded-full animate-spin"
                ></div>
                <span class="text-gray-500 dark:text-gray-400 animate-pulse"
                    >Fetching latest market data...</span
                >
            </div>
        </div>
    {:else if error}
        <div
            class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-8 rounded-2xl text-center border border-red-100 dark:border-red-800"
        >
            <p class="font-medium">{error}</p>
            <button
                class="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-white rounded-lg transition-colors text-sm"
                on:click={() => window.location.reload()}
            >
                Retry
            </button>
        </div>
    {:else if sortedDates.length > 0}
        <div class="space-y-8">
            {#each sortedDates as date}
                <div
                    class="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                    <div
                        class="bg-gray-50 dark:bg-dark-bg/50 px-6 py-3 border-b border-gray-100 dark:border-dark-border flex justify-between items-center"
                    >
                        <h3 class="font-bold text-gray-900 dark:text-white">
                            {formatDate(date)}
                        </h3>
                        <span
                            class="text-xs font-mono text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded"
                        >
                            {date}
                        </span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left">
                            <thead
                                class="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-dark-border"
                            >
                                <tr>
                                    <th class="px-6 py-3 font-medium w-24"
                                        >Time</th
                                    >
                                    <th class="px-6 py-3 font-medium w-20"
                                        >Cur</th
                                    >
                                    <th class="px-6 py-3 font-medium">Event</th>
                                    <th
                                        class="px-6 py-3 font-medium text-center w-24"
                                        >Impact</th
                                    >
                                    <th
                                        class="px-6 py-3 font-medium text-right w-24"
                                        >Actual</th
                                    >
                                    <th
                                        class="px-6 py-3 font-medium text-right w-24"
                                        >For.</th
                                    >
                                    <th
                                        class="px-6 py-3 font-medium text-right w-24"
                                        >Prev.</th
                                    >
                                </tr>
                            </thead>
                            <tbody
                                class="divide-y divide-gray-100 dark:divide-dark-border"
                            >
                                {#each groupedEvents[date] as event}
                                    <tr
                                        class="hover:bg-gray-50 dark:hover:bg-dark-bg/30 transition-colors group"
                                    >
                                        <td
                                            class="px-6 py-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap"
                                        >
                                            {event.time}
                                        </td>
                                        <td class="px-6 py-4">
                                            <span
                                                class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300"
                                            >
                                                <span class="text-lg"
                                                    >{flags[event.currency] ||
                                                        "🌍"}</span
                                                >
                                                {event.currency}
                                            </span>
                                        </td>
                                        <td
                                            class="px-6 py-4 font-medium text-gray-900 dark:text-white"
                                        >
                                            {event.event}
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <span
                                                class="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider {getImpactColor(
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
                            </tbody>
                        </table>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div
            class="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border p-12 text-center"
        >
            <div class="text-4xl mb-4">😴</div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                No events found
            </h3>
            <p class="text-gray-500 dark:text-gray-400">
                Try adjusting your filters or check back later.
            </p>
        </div>
    {/if}
</div>
