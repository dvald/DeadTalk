<template>
    <Transition
        enter-active-class="transition-opacity duration-700"
        leave-active-class="transition-opacity duration-700"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
    >
        <div
            v-if="visible"
            class="fixed inset-0 z-40 bg-[#131318] overflow-y-auto"
        >
            <!-- Grain overlay -->
            <div class="grain-overlay" />

            <main class="pt-24 pb-48 px-6 max-w-4xl mx-auto space-y-12 relative z-10">
                <!-- Séance Summary Section -->
                <section class="space-y-6">
                    <div class="flex flex-col gap-2">
                        <span class="text-[#cec1e2] text-[10px] tracking-[0.2em] uppercase">
                            {{ $t("The Final Transcription") }}
                        </span>
                        <h2 class="italic heading-font text-4xl md:text-5xl text-[#e4e1e9]">
                            {{ personaName }}
                        </h2>
                    </div>

                    <!-- Hero with quote overlay -->
                    <div
                        v-if="personaImage"
                        class="relative aspect-[16/9] w-full overflow-hidden rounded-sm group"
                    >
                        <img
                            :src="personaImage"
                            :alt="personaName"
                            class="w-full h-full object-cover opacity-60 grayscale transition-transform duration-[2000ms] group-hover:scale-110"
                        />
                        <div class="absolute inset-0 bg-gradient-to-t from-[#131318] via-transparent to-transparent" />
                        <div class="absolute bottom-6 left-6 right-6">
                            <p
                                v-if="heroQuote"
                                class="italic heading-font text-2xl text-[#f2c36b] leading-relaxed"
                                :class="{ 'animate-pulse opacity-50': isGeneratingQuote }"
                            >
                                &ldquo;{{ truncate(heroQuote, 120) }}&rdquo;
                            </p>
                            <p class="text-[#d2c5b2] text-sm mt-2 opacity-80">&mdash; {{ $t("Manifestation of") }} {{ personaName }}</p>
                        </div>
                    </div>
                </section>

                <!-- Transcript Preview Bento -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Transcript (2 cols) -->
                    <div class="md:col-span-2 p-8 bg-[#1b1b20] rounded-sm relative overflow-hidden">
                        <div class="absolute top-0 right-0 p-4 opacity-10">
                            <Icon
                                name="mdi:format-quote-close"
                                class="w-16 h-16"
                            />
                        </div>
                        <h3 class="heading-font italic text-xl text-[#f2c36b] mb-4">
                            {{ $t("The Final Exchange") }}
                        </h3>
                        <div class="space-y-4 text-sm text-[#e4e1e9]/80 leading-loose max-h-[300px] overflow-y-auto scrollbar-hide">
                            <p
                                v-for="(entry, idx) in lastEntries"
                                :key="idx"
                            >
                                <span
                                    class="font-bold"
                                    :class="entry.role === 'agent' ? 'text-[#eec068]' : 'text-[#cec1e2]'"
                                >
                                    {{ entry.role === "agent" ? personaName : $t("You") }}:
                                </span>
                                {{ cleanTags(entry.text) }}
                            </p>
                        </div>
                    </div>

                    <!-- Metadata (1 col) -->
                    <div class="p-8 bg-[#1b1b20] rounded-sm flex flex-col justify-between md:border-l md:border-[#4e4637]/15">
                        <div>
                            <h3 class="heading-font italic text-xl text-[#f2c36b] mb-4">
                                {{ $t("Metadata") }}
                            </h3>
                            <ul class="space-y-3 text-xs text-[#d2c5b2]">
                                <li class="flex justify-between">
                                    <span>{{ $t("Duration") }}</span>
                                    <span class="text-[#e4e1e9]">{{ formattedDuration }}</span>
                                </li>
                                <li class="flex justify-between">
                                    <span>{{ $t("Exchanges") }}</span>
                                    <span class="text-[#e4e1e9]">{{ conversationHistory.length }}</span>
                                </li>
                                <li class="flex justify-between">
                                    <span>{{ $t("Sources") }}</span>
                                    <span class="text-[#e4e1e9]">{{ sourcesCount }}</span>
                                </li>
                            </ul>
                        </div>
                        <div class="mt-8 pt-4 border-t border-[#4e4637]/10">
                            <span class="text-[10px] uppercase tracking-widest text-[#cec1e2] block mb-1">
                                {{ $t("State") }}
                            </span>
                            <div class="flex items-center gap-2">
                                <div class="w-1.5 h-1.5 rounded-full bg-red-400/60 shadow-[0_0_8px_rgba(255,180,171,0.5)]" />
                                <span class="text-[#e4e1e9] font-medium text-xs tracking-wider uppercase">
                                    {{ $t("Session Ended") }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Share Buttons Grid -->
                <section class="max-w-2xl mx-auto">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <!-- Post to X -->
                        <a
                            :href="twitterUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="share-card group"
                        >
                            <Icon
                                name="mdi:twitter"
                                class="w-5 h-5 text-[#f2c36b] group-hover:scale-110 transition-transform duration-500"
                            />
                            <span class="share-label">{{ $t("Post to X") }}</span>
                        </a>

                        <!-- LinkedIn -->
                        <a
                            :href="linkedInUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="share-card group"
                        >
                            <Icon
                                name="mdi:linkedin"
                                class="w-5 h-5 text-[#f2c36b] group-hover:scale-110 transition-transform duration-500"
                            />
                            <span class="share-label">{{ $t("LinkedIn") }}</span>
                        </a>

                        <!-- Copy Quote -->
                        <button
                            class="share-card group"
                            @click="copyCaption"
                        >
                            <Icon
                                :name="copied ? 'mdi:check' : 'mdi:content-copy'"
                                class="w-5 h-5 text-[#f2c36b] group-hover:scale-110 transition-transform duration-500"
                            />
                            <span class="share-label">{{ copied ? $t("Copied!") : $t("Copy Quote") }}</span>
                        </button>

                        <!-- Share -->
                        <button
                            v-if="canNativeShare"
                            class="share-card group"
                            @click="nativeShare"
                        >
                            <Icon
                                name="mdi:share-variant"
                                class="w-5 h-5 text-[#f2c36b] group-hover:scale-110 transition-transform duration-500"
                            />
                            <span class="share-label">{{ $t("Share") }}</span>
                        </button>
                    </div>
                </section>
            </main>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import type { ConversationEntry } from "~/models/session";

const props = defineProps<{
    visible: boolean;
    personaName: string;
    personaImage: string;
    personaEra: string;
    conversationHistory: ConversationEntry[];
    elapsedTime: number;
    sourcesCount: number;
}>();

const { t: $t } = useI18n();
const copied = ref(false);

// Generated quote from LLM
const generatedQuote = ref("");
const isGeneratingQuote = ref(false);

// Last 6 entries for transcript preview
const lastEntries = computed(() => {
    return props.conversationHistory.slice(-6);
});

// Fallback: last agent message (used while LLM generates)
const lastAgentMessage = computed(() => {
    const agentEntries = props.conversationHistory.filter((e) => e.role === "agent");
    return agentEntries.length > 0 ? agentEntries[agentEntries.length - 1].text : "";
});

// Display quote: LLM-generated if ready, else fallback to last agent message
const heroQuote = computed(() => {
    return generatedQuote.value || cleanTags(lastAgentMessage.value);
});

// Generate quote via LLM when overlay becomes visible
watch(
    () => props.visible,
    async (visible) => {
        if (!visible || generatedQuote.value || props.conversationHistory.length === 0) return;

        isGeneratingQuote.value = true;
        try {
            const apiBase = import.meta.env.DEV ? import.meta.env.VITE__DEV_TEST_HOST || "http://localhost" : "";
            const res = await $fetch<{ quote: string }>(apiBase + "/api/v1/session/generate-quote", {
                method: "POST",
                body: {
                    personaName: props.personaName,
                    transcript: props.conversationHistory.map((e) => ({
                        role: e.role,
                        text: e.text,
                    })),
                },
            });
            if (res?.quote) {
                generatedQuote.value = res.quote;
            }
        } catch {
            // Silently fallback to last agent message
        } finally {
            isGeneratingQuote.value = false;
        }
    },
    { immediate: true },
);

// Duration formatted
const formattedDuration = computed(() => {
    const t = props.elapsedTime;
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}m ${String(s).padStart(2, "0")}s`;
});

// Share URLs
const shareText = computed(() => {
    const era = props.personaEra ? ` (${props.personaEra})` : "";
    return `I just talked to ${props.personaName}${era} on DeadTalk! #ElevenHacks @elevenlabsio @firecrawl_dev`;
});

const shareUrl = computed(() => {
    return typeof window !== "undefined" ? window.location.origin : "";
});

const twitterUrl = computed(() => {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.value)}&url=${encodeURIComponent(shareUrl.value)}`;
});

const linkedInUrl = computed(() => {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl.value)}`;
});

const canNativeShare = computed(() => {
    return typeof navigator !== "undefined" && !!navigator.share;
});

function cleanTags(text: string): string {
    return text
        .replace(/\[[^\]]*\]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}

function truncate(text: string, max: number): string {
    const clean = cleanTags(text);
    return clean.length > max ? clean.slice(0, max) + "..." : clean;
}

async function copyCaption() {
    try {
        const quote = heroQuote.value ? `"${truncate(heroQuote.value, 200)}" — ${props.personaName}` : shareText.value;
        await navigator.clipboard.writeText(quote);
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 2000);
    } catch {
        // clipboard unavailable
    }
}

async function nativeShare() {
    try {
        await navigator.share({
            title: "DeadTalk",
            text: shareText.value,
            url: shareUrl.value,
        });
    } catch {
        // user cancelled
    }
}
</script>

<style scoped>
@reference "~/assets/css/main.css";

.share-card {
    @apply bg-[#2a292f]/70 backdrop-blur-xl p-4 flex flex-col items-center justify-center gap-2
           rounded-sm border border-[#4e4637]/15
           hover:bg-[#39383e] transition-all duration-700 cursor-pointer;
}

.share-label {
    @apply text-[10px] uppercase tracking-widest text-[#d2c5b2];
}
</style>
