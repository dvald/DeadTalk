<template>
    <div class="seance-bg min-h-[100dvh] flex flex-col relative overflow-hidden">
        <!-- Atmospheric layers -->
        <div class="grain-overlay" />
        <div class="fog-gradient" />
        <div class="ambient-orb ambient-orb--primary" />
        <div class="ambient-orb ambient-orb--secondary" />

        <!-- Resume prompt overlay -->
        <div
            v-if="showResumePrompt"
            class="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
        >
            <div class="max-w-sm w-full rounded-sm glassmorphism p-6 flex flex-col gap-4 items-center text-center">
                <Icon
                    name="mdi:message-reply-text"
                    class="w-10 h-10 text-[#d4a853]"
                />
                <h3 class="heading-font italic text-xl text-[#e4e1e9]">
                    {{ $t("Resume conversation?") }}
                </h3>
                <p class="text-sm text-[#e4e1e9]/50">{{ $t("You have a previous conversation with") }} {{ personaName }}.</p>
                <div class="flex gap-3">
                    <button
                        class="px-4 py-2 rounded-sm text-sm font-medium text-[#e4e1e9]/60 hover:bg-[#39383e] transition-all duration-500"
                        @click="onResumeChoice(false)"
                    >
                        {{ $t("Start fresh") }}
                    </button>
                    <button
                        class="px-4 py-2 rounded-sm text-sm font-medium bg-gradient-to-tr from-[#f2c36b] to-[#d4a853] text-[#131318] shadow-[0_0_15px_rgba(242,195,107,0.3)] transition-all duration-500"
                        @click="onResumeChoice(true)"
                    >
                        {{ $t("Resume") }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Sources button overlay (sits on top of SeanceHeader's book icon) -->
        <button
            class="fixed top-8 right-6 z-[61] text-[#e4e1e9]/40 hover:text-[#d4a853] transition-all duration-500"
            @click="showSourcesDrawer = !showSourcesDrawer"
        >
            <svg
                class="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
            >
                <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" />
            </svg>
        </button>

        <!-- Main content: centered persona portal -->
        <main class="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-36 relative z-10">
            <!-- Persona name -->
            <section class="w-full text-center mb-4">
                <div class="inline-block relative">
                    <div class="absolute -inset-4 bg-[#f2c36b]/5 blur-3xl rounded-full" />
                    <h2 class="heading-font text-4xl md:text-5xl italic tracking-tight text-[#e4e1e9] seance-text-glow">
                        {{ personaName }}
                    </h2>
                    <p class="font-label text-[10px] uppercase tracking-[0.2em] text-[#cec1e2]/60 mt-2">
                        {{ personaSubtitle }}
                    </p>
                </div>
            </section>

            <!-- Per-persona background effect (canvas behind portrait) -->
            <BackgroundEffect
                :personaId="personaIdFromUrl"
                :isActive="isAgentSpeaking"
                :emotionColor="currentEmotionColor"
            />

            <!-- Portrait with ectoplasm waves -->
            <SessionPortrait
                :personaName="personaName"
                :personaImage="personaImage"
                :isActive="isAgentSpeaking"
                :emotionColor="currentEmotionColor"
                :emotionIntensity="currentEmotionIntensity"
                :frequencyDataFn="getFrequencyData"
                class="mb-4"
            />

            <!-- Live transcript / static quote zone -->
            <div class="w-full max-w-sm max-h-[30vh] overflow-y-auto scrollbar-hide">
                <p
                    v-if="agentTranscriptClean"
                    class="heading-font italic text-lg leading-relaxed text-[#e4e1e9]/80 text-center"
                >
                    {{ agentTranscriptClean }}
                </p>
                <p
                    v-else-if="userTranscript"
                    class="font-body text-sm leading-relaxed text-[#e4e1e9]/50 text-center"
                >
                    {{ userTranscript }}
                </p>
                <p
                    v-else-if="personaQuote"
                    class="heading-font italic text-lg leading-relaxed text-[#e4e1e9]/50 text-center"
                >
                    &ldquo;{{ personaQuote }}&rdquo;
                </p>
            </div>
        </main>

        <!-- Sources overlay (from top, notification_open style) -->
        <Transition
            enter-active-class="transition-all duration-500"
            leave-active-class="transition-all duration-500"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
        >
            <div
                v-if="showSourcesDrawer"
                class="fixed inset-0 z-[45] bg-[#131318]/80 backdrop-blur-sm"
                @click.self="showSourcesDrawer = false"
            >
                <div class="relative z-10 pt-20 pb-8 px-6 flex flex-col items-center max-w-2xl mx-auto max-h-full overflow-y-auto">
                    <!-- Persona name echo -->
                    <section class="w-full text-center mb-8">
                        <div class="inline-block relative">
                            <div class="absolute -inset-4 bg-[#f2c36b]/5 blur-3xl rounded-full" />
                            <h2 class="heading-font text-3xl italic tracking-tight text-[#e4e1e9] mb-1">
                                {{ personaName }}
                            </h2>
                            <p class="font-label text-[10px] uppercase tracking-[0.2em] text-[#cec1e2]/60">
                                {{ personaSubtitle }}
                            </p>
                        </div>
                    </section>

                    <!-- Section header -->
                    <section class="w-full mb-6">
                        <div class="flex items-center justify-between px-2">
                            <h3 class="heading-font text-xl italic text-[#f2c36b]">
                                {{ $t("Archival References") }}
                            </h3>
                            <span class="text-[10px] font-label uppercase tracking-widest text-[#d2c5b2]/60">
                                {{ sources.length }} {{ $t("Sources Found") }}
                            </span>
                        </div>
                    </section>

                    <!-- Source cards (glass-artifact + gilded-border style) -->
                    <section class="w-full space-y-6 relative">
                        <div
                            v-for="(source, idx) in sourcesReversed"
                            :key="source.id"
                            class="p-6 shadow-2xl transition-all duration-500 hover:-translate-y-1 rounded-sm"
                            :class="[
                                'bg-[#2a292f]/60 backdrop-blur-2xl border border-[#d4a853]/20',
                                idx === 0 ? 'opacity-100' : idx === 1 ? 'opacity-80 hover:opacity-100' : 'opacity-60 hover:opacity-100',
                            ]"
                        >
                            <div class="flex justify-between items-start mb-4">
                                <h4 class="heading-font text-lg italic text-[#e4e1e9]">
                                    {{ source.title || getSourceDomain(source.url) }}
                                </h4>
                                <Icon
                                    name="mdi:book-open-page-variant"
                                    class="w-4 h-4 text-[#d4a853] shrink-0"
                                />
                            </div>
                            <p
                                v-if="source.snippet"
                                class="text-sm text-[#d2c5b2] leading-relaxed mb-4 italic line-clamp-3"
                            >
                                {{ source.snippet }}
                            </p>
                            <div class="flex justify-between items-center pt-4 border-t border-[#4e4637]/10">
                                <span class="text-[9px] font-label uppercase tracking-widest text-[#d4a853]/60">
                                    {{ $t("Summoned from") }}: {{ getSourceDomain(source.url) }}
                                </span>
                                <span class="text-[9px] font-label uppercase text-[#d2c5b2]/40">
                                    {{ $t("Verified Artifact") }}
                                </span>
                            </div>
                        </div>
                    </section>

                    <!-- Loading indicator -->
                    <section
                        v-if="status === 'active'"
                        class="w-full text-center mt-8"
                    >
                        <p class="text-[#e4e1e9]/40 text-[11px] italic animate-pulse">
                            {{ $t("Ethereal connection stable... distilling further archival fragments...") }}
                        </p>
                    </section>
                </div>
            </div>
        </Transition>

        <!-- End-of-session overlay -->
        <SessionEndedOverlay
            :visible="status === 'ended'"
            :personaName="personaName"
            :personaImage="personaImage"
            :personaEra="persona?.era || ''"
            :conversationHistory="sessionStore.conversationHistory"
            :elapsedTime="sessionStore.elapsedTime"
            :sourcesCount="sources.length"
        />

        <!-- Floating controls bar -->
        <SessionControls
            :status="status"
            :micMode="micMode"
            :isSpeaking="isSpeaking"
            :isAgentSpeaking="isAgentSpeaking"
            :canExport="canExport"
            @toggle-mic-mode="sessionStore.toggleMicMode()"
            @push-start="onPushStart"
            @push-end="onPushEnd"
            @interrupt="onInterrupt"
            @stop="onStop"
            @back="onBack"
            @export="downloadTranscript"
        />
    </div>
</template>

<script setup lang="ts">
import type { PersistedSession } from "~/composables/useSessionPersistence";

definePageMeta({
    layout: "seance",
});

const route = useRoute();
const router = useRouter();
const { t: $t, locale } = useI18n();
const localePath = useLocalePath();

// Store
const sessionStore = useSessionStore();
const { persona, agents, sources, status, currentSpeaker, sourcesReversed, userTranscript, agentTranscript, micMode } =
    storeToRefs(sessionStore);

// Export transcript
const { downloadTranscript, canExport } = useExportTranscript();

// Session persistence
const { saveSession, loadSession, clearSession } = useSessionPersistence();
const showResumePrompt = ref(false);
const savedSessionData = ref<PersistedSession | null>(null);
const isResuming = ref(false);

// Sources overlay
const showSourcesDrawer = ref(false);

function getSourceDomain(url: string): string {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return url;
    }
}

// Persona from query string
const personaIdFromUrl = computed(() => {
    const raw = route.query.persona;
    return typeof raw === "string" ? decodeURIComponent(raw) : "";
});

const personaName = computed(() => persona.value?.name || personaIdFromUrl.value || "Unknown");
const personaSubtitle = computed(() => {
    if (!persona.value) return "";
    const parts: string[] = [];
    if (persona.value.profession) parts.push(persona.value.profession);
    if (persona.value.era) parts.push(persona.value.era);
    return parts.join(" \u2022 ");
});
const personaImage = computed(() => persona.value?.image || persona.value?.avatar || "");
const personaQuote = computed(() => {
    if (!persona.value) return "";
    if (locale.value === "es" && persona.value.quoteEs) {
        return persona.value.quoteEs;
    }
    return persona.value.quote || "";
});
const agentTranscriptClean = computed(() => {
    return agentTranscript.value
        .replace(/\[[^\]]*\]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
});

useHead(() => ({
    title: personaName.value + " — DeadTalk",
}));

// WebSocket (transport layer)
const {
    isConnected,
    sessionEnded,
    sessionEndReason,
    agentStates: wsAgentStates,
    lastAudioChunk,
    sourcesHistory,
    userTranscriptText,
    open,
    close,
    send: wsSend,
} = useOrchestratorSocket();

// Audio playback (must be before voice input for isAgentPlaying ref)
const { isPlaying: isAgentPlaying, playChunk, stopPlayback, getFrequencyData } = useAudioPlayback();

// Voice input (VAD + push-to-talk)
const {
    isListening: _isListening,
    isSpeaking,
    startListening,
    stopListening,
    startManualRecording,
    stopManualRecording,
} = useVoiceInput(
    (msg: any) => {
        wsSend(msg);
    },
    isAgentPlaying,
    micMode,
);

// Computed: is the agent currently speaking (audio playing or speaker set)
const isAgentSpeaking = computed(() => {
    return currentSpeaker.value !== null || isAgentPlaying.value;
});

// Emotion color for aura glow on the container
// Emotion colors: warm gold base with STRONG tints for intense emotions
// Angry/serious push toward red, sad/melancholy toward cool amber, excited toward bright yellow
const EMOTION_COLORS: Record<string, string> = {
    angry: "#d94a2b", // fiery red-orange — unmistakable anger
    excited: "#f5c842", // vivid yellow-gold — high energy
    whispers: "#9a8a6a", // dim warm grey — hushed, intimate
    melancholy: "#7a6a4a", // deep muted brown — heavy, somber
    pause: "#6b6040", // dark olive-bronze — dormant, still
    sad: "#6a7a8a", // steel blue-grey — cold sadness
    surprised: "#f0e060", // bright lemon flash — startled
    thoughtful: "#8aaa9a", // sage green-grey — calm contemplation
    laughing: "#f2c36b", // warm gold — joyful (primary brand color)
    serious: "#c05a3a", // deep red-amber — stern, intense
};
const currentEmotionColor = computed(() => {
    const tag = agents.value[0]?.id ? wsAgentStates.value.get(agents.value[0].id)?.audioTag : "";
    if (!tag) return "#d4a853";
    return EMOTION_COLORS[tag.toLowerCase()] || "#d4a853";
});

// Intensity multiplier: intense emotions get bigger, brighter blobs
const EMOTION_INTENSITY: Record<string, number> = {
    angry: 1.8, // fire up the glow
    excited: 1.5,
    surprised: 1.4,
    serious: 1.5,
    laughing: 1.3,
    whispers: 0.6, // dim down
    pause: 0.4,
    melancholy: 0.7,
    sad: 0.7,
    thoughtful: 0.8,
};
const currentEmotionIntensity = computed(() => {
    const tag = agents.value[0]?.id ? wsAgentStates.value.get(agents.value[0].id)?.audioTag : "";
    if (!tag) return 1.0;
    return EMOTION_INTENSITY[tag.toLowerCase()] || 1.0;
});

// Initialize session (optionally with resumed data)
function initializeSession(resumeData?: PersistedSession) {
    if (resumeData?.personaData?.era) {
        sessionStore.startConversation(resumeData.personaData);
    } else if (!persona.value || persona.value.id !== personaIdFromUrl.value) {
        sessionStore.startConversation({
            id: personaIdFromUrl.value,
            name: personaIdFromUrl.value,
            era: "",
            nationality: "",
            profession: "",
            avatar: "",
            firstMessage: "",
            firstMessageEs: "",
        });
    }

    if (resumeData) {
        isResuming.value = true;
        for (const entry of resumeData.conversationHistory) {
            sessionStore.addConversationEntry(entry);
        }
        for (const src of resumeData.sources) {
            sessionStore.addSource(src);
        }
    }

    open();
}

function onResumeChoice(resume: boolean) {
    showResumePrompt.value = false;
    if (resume && savedSessionData.value) {
        initializeSession(savedSessionData.value);
    } else {
        clearSession();
        initializeSession();
    }
}

// Auto-save session state after each conversation entry
function persistCurrentSession() {
    if (!persona.value) return;
    saveSession({
        personaId: persona.value.id,
        personaData: persona.value,
        conversationHistory: sessionStore.conversationHistory,
        sources: sources.value,
        savedAt: Date.now(),
    });
}

// Redirect if no persona, otherwise check for resume
onMounted(() => {
    if (!personaIdFromUrl.value) {
        router.replace(localePath("/"));
        return;
    }

    const saved = loadSession(personaIdFromUrl.value);
    if (saved && saved.conversationHistory.length > 0) {
        savedSessionData.value = saved;
        showResumePrompt.value = true;
        // Wait for user choice before connecting
        return;
    }

    initializeSession();
});

onBeforeUnmount(() => {
    stopListening();
    stopPlayback();
    wsSend({ type: "stop-session" });
    close();
    sessionStore.resetSession();
});

// Bridge: WS connected → start conversation
watch(isConnected, (connected) => {
    if (connected && status.value === "connecting") {
        const msg: Record<string, unknown> = {
            type: "start-conversation",
            personaId: personaIdFromUrl.value,
            language: locale.value,
        };
        if (isResuming.value && sessionStore.conversationHistory.length > 0) {
            msg.history = sessionStore.conversationHistory.map((e) => ({
                role: e.role,
                text: e.text,
            }));
            isResuming.value = false;
        }
        wsSend(msg);
        sessionStore.setActive();

        // Start listening for voice input
        startListening();
    }
});

// Bridge: agent states → store
const wasSpeaking = ref(false);
watch(
    () => wsAgentStates.value,
    (states) => {
        for (const [id, state] of states) {
            if (state.speaking) {
                sessionStore.setSpeaker(id);
                sessionStore.setAgentTranscript(state.transcript);
            }
        }
        const anySpeaking = [...states.values()].some((s) => s.speaking);
        if (!anySpeaking) {
            // Agent just finished speaking — capture transcript in history
            if (wasSpeaking.value && agentTranscript.value) {
                sessionStore.addConversationEntry({
                    role: "agent",
                    text: agentTranscript.value,
                    timestamp: Date.now(),
                });
                persistCurrentSession();
            }
            sessionStore.setSpeaker(null);
        }
        wasSpeaking.value = anySpeaking;
    },
    { deep: true },
);

// Bridge: audio chunks → playback
watch(lastAudioChunk, (chunk) => {
    if (chunk && chunk.chunk) {
        playChunk(chunk.chunk);
    }
});

// Clear audioTag when audio playback actually finishes
watch(isAgentPlaying, (playing) => {
    if (!playing) {
        // Audio finished — clear emotion aura
        for (const [id, state] of wsAgentStates.value) {
            if (state.audioTag) {
                state.audioTag = "";
                wsAgentStates.value.set(id, state);
            }
        }
        wsAgentStates.value = new Map(wsAgentStates.value);
    }
});

// Bridge: new sources → store
watch(sourcesHistory, (history) => {
    if (!history || history.length === 0) return;
    const existingIds = new Set(sources.value.map((s) => s.id));
    for (const source of history) {
        if (!existingIds.has(source.id)) {
            sessionStore.addSource(source);
            existingIds.add(source.id);
        }
    }
});

// Bridge: user transcript from backend
watch(userTranscriptText, (text) => {
    if (text) {
        sessionStore.setUserTranscript(text);
        sessionStore.addConversationEntry({ role: "user", text, timestamp: Date.now() });
        persistCurrentSession();
    }
});

// Bridge: session end → store
watch(sessionEnded, (ended) => {
    if (ended) {
        stopListening();
        stopPlayback();
        close();
        sessionStore.endSession(sessionEndReason.value);
        clearSession();
    }
});

// Actions
function onInterrupt() {
    stopPlayback();
    wsSend({ type: "interrupt-agent" });
    sessionStore.setSpeaker(null);
}

function onStop() {
    stopListening();
    stopPlayback();
    wsSend({ type: "stop-session" });
}

function onBack() {
    router.push(localePath("/"));
}

// Push-to-talk handlers
function onPushStart() {
    console.log("[SESSION] onPushStart called, micMode:", micMode.value, "isListening:", _isListening.value);
    console.log("[SESSION] startManualRecording is:", typeof startManualRecording);
    try {
        startManualRecording();
        console.log("[SESSION] startManualRecording returned OK");
    } catch (err) {
        console.error("[SESSION] startManualRecording THREW:", err);
    }
}

function onPushEnd() {
    console.log("[SESSION] onPushEnd called");
    try {
        stopManualRecording();
        console.log("[SESSION] stopManualRecording returned OK");
    } catch (err) {
        console.error("[SESSION] stopManualRecording THREW:", err);
    }
}
</script>
