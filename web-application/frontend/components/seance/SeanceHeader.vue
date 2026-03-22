<template>
    <header class="fixed top-0 left-0 right-0 z-[60] flex justify-between items-center w-full px-6 py-8 bg-transparent">
        <div class="flex items-center gap-3">
            <svg
                class="w-5 h-5 text-[#d4a853] animate-pulse-slow"
                viewBox="0 0 24 24"
                fill="currentColor"
            >
                <path
                    d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zm7.5 5.5l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"
                />
            </svg>
            <NuxtLink
                :to="localePath('/')"
                class="italic heading-font text-[#d4a853] text-xl tracking-widest uppercase"
            >
                DeadTalk
            </NuxtLink>
        </div>
        <div class="flex items-center gap-6">
            <div
                class="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4a853]/10 bg-[#15151a]/20 backdrop-blur-md"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-green-500/60 animate-pulse" />
                <span class="text-[9px] uppercase tracking-widest text-[#e4e1e9]/60">
                    {{ $t("Archive Verified") }}
                </span>
            </div>
            <slot name="header-action" />
        </div>
    </header>
</template>

<script setup lang="ts">
const localePath = useLocalePath();
</script>
