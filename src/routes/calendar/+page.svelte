<script>
    import EconomicCalendar from "$lib/components/EconomicCalendar.svelte";
</script>

<div class="min-h-screen bg-gray-50 dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-8">
        <!-- Breadcrumb / Header -->
        <div
            class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
        >
            <a href="/" class="hover:text-gold-500 transition-colors">Home</a>
            <span>/</span>
            <span class="text-gold-500 font-medium">Economic Calendar</span>
        </div>

        <div>
            <h1
                class="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2"
            >
                Market Intelligence
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400">
                Stay updated with the latest economic events to plan your
                trades.
            </p>
        </div>

        <EconomicCalendar />
    </div>
</div>
