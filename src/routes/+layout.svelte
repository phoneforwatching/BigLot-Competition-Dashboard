<script>
    import "../app.css";
    import ThemeToggle from "$lib/components/ThemeToggle.svelte";
    import AIAgent from "$lib/components/AIAgent.svelte";
    import SplashScreen from "$lib/components/SplashScreen.svelte";
    import { page } from "$app/stores";
    import { browser } from "$app/environment";
    import { onMount } from "svelte";

    let splashComplete = false;
    // Default to true ensures it renders on server/first paint
    let showSplash = true;

    // Synchronously check on client initialization to avoid flash if already seen
    if (browser && sessionStorage.getItem("splashShown")) {
        showSplash = false;
        splashComplete = true;
    }

    onMount(() => {
        // Any other mounting logic if needed
    });

    function handleSplashComplete() {
        splashComplete = true;
        if (browser) {
            sessionStorage.setItem("splashShown", "true");
        }
    }
</script>

<div
    class="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-white transition-colors duration-300 flex flex-col"
>
    <!-- Top accent bar -->
    <div
        class="h-1 bg-gradient-to-r from-gold-700 via-gold-400 to-gold-700"
    ></div>

    <header
        class="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-dark-border sticky top-0 z-50 transition-all duration-300"
    >
        <div
            class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        >
            <div class="flex items-center gap-8">
                <a
                    href="/"
                    class="text-xl font-bold flex items-center gap-2 group"
                >
                    <div class="relative">
                        <img
                            src="/logo-masterpiece.png"
                            alt="BigLot Logo"
                            class="h-10 w-auto transition-transform duration-300 group-hover:scale-110"
                        />
                        <!-- Subtle glow effect behind logo -->
                        <div
                            class="absolute inset-0 bg-gold-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        ></div>
                    </div>
                    <span
                        class="ml-2 bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent drop-shadow-sm"
                        >BigLot</span
                    >
                </a>

                <!-- Desktop Nav -->
                <nav class="hidden md:flex items-center gap-6">
                    <a
                        href="/"
                        class="text-sm font-medium transition-colors {$page.url
                            .pathname === '/'
                            ? 'text-gold-600 dark:text-gold-400'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gold-500 dark:hover:text-gold-400'}"
                        >Dashboard</a
                    >
                    <a
                        href="/calendar"
                        class="text-sm font-medium transition-colors {$page.url
                            .pathname === '/calendar'
                            ? 'text-gold-600 dark:text-gold-400'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gold-500 dark:hover:text-gold-400'}"
                        >Calendar</a
                    >
                </nav>
            </div>

            <div class="flex items-center gap-4">
                <ThemeToggle />
            </div>
        </div>
    </header>

    <main class="flex-grow">
        <slot />
    </main>

    <footer
        class="bg-white dark:bg-black border-t border-gray-200 dark:border-dark-border py-8 transition-colors duration-300"
    >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col items-center gap-4">
                <img
                    src="/logo-masterpiece.png"
                    alt="BigLot Logo"
                    class="h-8 w-auto grayscale dark:grayscale-0 opacity-50 dark:opacity-100"
                />
                <p
                    class="text-center text-sm text-gray-500 dark:text-gold-500/60"
                >
                    &copy; {new Date().getFullYear()} BigLot Competition. Premium
                    Trading Platform.
                </p>
                <div
                    class="h-px w-24 bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"
                ></div>
            </div>
        </div>
    </footer>

    <AIAgent />

    {#if showSplash && !splashComplete}
        <SplashScreen on:complete={handleSplashComplete} />
    {/if}
</div>
