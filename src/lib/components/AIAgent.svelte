<script lang="ts">
    import { fade, fly, slide } from "svelte/transition";
    import { onMount } from "svelte";

    let isOpen = false;
    let messageInput = "";
    let isLoading = false;
    let chatContainer: HTMLElement;

    type Message = {
        id: string;
        text: string;
        sender: "user" | "ai";
        timestamp: Date;
    };

    let messages: Message[] = [
        {
            id: "1",
            text: "สวัสดีครับ! ผมเป็นผู้ช่วยเทรด AI ของคุณ วันนี้ให้ผมช่วยวิเคราะห์ตลาดด้านไหนดีครับ?",
            sender: "ai",
            timestamp: new Date(),
        },
    ];

    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            setTimeout(scrollToBottom, 100);
        }
    }

    function scrollToBottom() {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    async function sendMessage() {
        if (!messageInput.trim() || isLoading) return;

        const userMsg: Message = {
            id: crypto.randomUUID(),
            text: messageInput,
            sender: "user",
            timestamp: new Date(),
        };

        messages = [...messages, userMsg];
        const currentInput = messageInput; // Store input for API call

        // Prepare history (last 10 messages + current user message)
        const history = messages.slice(-10); // userMsg is already in messages

        messageInput = "";
        isLoading = true;
        setTimeout(scrollToBottom, 50);

        try {
            const response = await fetch("/api/ai-analysis", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customPrompt: currentInput,
                    messages: history,
                    // trader: null // We don't have trader data in this context yet
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const aiMsg: Message = {
                    id: crypto.randomUUID(),
                    text: data.analysis,
                    sender: "ai",
                    timestamp: new Date(),
                };
                messages = [...messages, aiMsg];
            } else {
                throw new Error(data.error || "Failed to get response");
            }
        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg: Message = {
                id: crypto.randomUUID(),
                text: "ขออภัยครับ ระบบขัดข้องชั่วคราว โปรดลองใหม่ในภายหลัง",
                sender: "ai",
                timestamp: new Date(),
            };
            messages = [...messages, errorMsg];
        } finally {
            isLoading = false;
            setTimeout(scrollToBottom, 50);
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
</script>

<div
    class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none"
>
    <!-- Chat Window -->
    {#if isOpen}
        <div
            class="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border w-[90vw] sm:w-[400px] h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
            transition:fly={{ y: 20, duration: 300 }}
        >
            <!-- Header -->
            <div
                class="p-4 bg-gradient-to-r from-gold-600 to-gold-500 text-white flex justify-between items-center shrink-0"
            >
                <div class="flex items-center gap-2">
                    <div
                        class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><path
                                d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
                            /><path d="m4.93 10.93 1.41 1.41" /><path
                                d="M2 18h2"
                            /><path d="M20 18h2" /><path
                                d="m19.07 10.93-1.41 1.41"
                            /><path d="M22 22H2" /><path
                                d="m8 22 4-10 4 10"
                            /><path d="M9 18h6" /></svg
                        >
                    </div>
                    <div>
                        <h3 class="font-bold text-sm">ผู้ช่วยอัจฉริยะ (AI)</h3>
                        <p class="text-xs text-white/80">
                            ระบบวิเคราะห์การเทรด
                        </p>
                    </div>
                </div>
                <button
                    on:click={toggleChat}
                    class="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
                    >
                </button>
            </div>

            <!-- Messages Area -->
            <div
                bind:this={chatContainer}
                class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black/20"
            >
                {#each messages as msg (msg.id)}
                    <div
                        class="flex {msg.sender === 'user'
                            ? 'justify-end'
                            : 'justify-start'}"
                    >
                        <div
                            class="max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm {msg.sender ===
                            'user'
                                ? 'bg-gold-500 text-white rounded-br-none'
                                : 'bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-dark-border rounded-bl-none'}"
                        >
                            {msg.text}
                            <div class="text-[10px] opacity-70 mt-1 text-right">
                                {msg.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    </div>
                {/each}

                {#if isLoading}
                    <div class="flex justify-start">
                        <div
                            class="bg-white dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1 shadow-sm"
                        >
                            <span
                                class="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce"
                            ></span>
                            <span
                                class="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce delay-100"
                            ></span>
                            <span
                                class="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce delay-200"
                            ></span>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Input Area -->
            <div
                class="p-3 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border shrink-0"
            >
                <div class="relative flex items-center">
                    <input
                        bind:value={messageInput}
                        on:keydown={handleKeydown}
                        type="text"
                        placeholder="สอบถามข้อมูลตลาดได้เลยครับ..."
                        class="w-full bg-gray-100 dark:bg-dark-bg text-gray-900 dark:text-white rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 border-none placeholder-gray-500 dark:placeholder-gray-500"
                    />
                    <button
                        on:click={sendMessage}
                        disabled={!messageInput.trim() || isLoading}
                        class="absolute right-1.5 p-1.5 bg-gold-500 text-white rounded-full shadow-sm hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><path d="m22 2-7 20-4-9-9-4Z" /><path
                                d="M22 2 11 13"
                            /></svg
                        >
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Toggle Button -->
    <button
        on:click={toggleChat}
        class="pointer-events-auto h-14 w-14 rounded-full bg-gradient-to-r from-gold-600 to-gold-400 text-white shadow-lg hover:shadow-gold-500/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center group overflow-hidden relative"
    >
        <div
            class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full"
        ></div>

        {#if isOpen}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="animate-in fade-in zoom-in duration-200"
                ><path d="m18 15-6-6-6 6" /></svg
            >
        {:else}
            <div class="relative">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="transition-transform duration-300 group-hover:scale-110"
                    ><path
                        d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
                    /><path d="m4.93 10.93 1.41 1.41" /><path
                        d="M2 18h2"
                    /><path d="M20 18h2" /><path
                        d="m19.07 10.93-1.41 1.41"
                    /><path d="M22 22H2" /><path d="m8 22 4-10 4 10" /><path
                        d="M9 18h6"
                    /></svg
                >
                <span
                    class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-gold-500 rounded-full"
                ></span>
            </div>
        {/if}
    </button>
</div>
