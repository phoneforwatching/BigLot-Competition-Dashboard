<script>
    import "../app.css";
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
            <a href="/" class="text-xl font-bold flex items-center gap-2 group">
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
            <div class="flex items-center gap-4">
                <!-- Theme toggle removed to lock Premium Black & Gold style -->
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
</div>
