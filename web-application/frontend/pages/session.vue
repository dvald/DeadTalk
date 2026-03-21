<template>
    <div class="seance-bg min-h-[100dvh] flex flex-col relative">
        <!-- Resume prompt overlay -->
        <div
            v-if="showResumePrompt"
            class="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
        >
            <div
                class="max-w-sm w-full rounded-xl border border-[#d4a853]/30 bg-[#1a1520] p-6 flex flex-col gap-4 items-center text-center"
            >
                <Icon
                    name="mdi:message-reply-text"
                    class="w-10 h-10 text-[#d4a853]"
                />
                <Heading
                    :title="$t('Resume conversation?')"
                    :size="HeadingSize.SM"
                />
                <p class="text-sm text-text-neutral-subtle">{{ $t("You have a previous conversation with") }} {{ personaName }}.</p>
                <div class="flex gap-3">
                    <Button
                        :text="$t('Start fresh')"
                        :color="ColorAccent.NEUTRAL"
                        @click="onResumeChoice(false)"
                    />
                    <Button
                        :text="$t('Resume')"
                        :color="ColorAccent.PRIMARY_BRAND"
                        @click="onResumeChoice(true)"
                    />
                </div>
            </div>
        </div>

        <!-- TOP: Persona info -->
        <div class="p-4 flex-none flex items-center gap-3">
            <div
                class="w-12 h-12 rounded-full bg-background-neutral-subtle flex items-center justify-center text-lg font-bold text-text-neutral-subtle shrink-0"
            >
                {{ personaInitial }}
            </div>
            <div class="min-w-0">
                <Heading
                    :title="personaName"
                    :size="HeadingSize.XS"
                    class="line-clamp-1"
                />
                <p class="text-xs text-text-neutral-subtle">
                    {{ personaSubtitle }}
                </p>
            </div>
        </div>

        <!-- Audio wave player (with emotion-colored aura glow) -->
        <div
            v-if="agents.length > 0"
            class="px-4 pb-2 flex-none rounded-lg transition-all duration-500"
            :style="
                isAgentSpeaking
                    ? {
                          backgroundColor: currentEmotionColor + '0d',
                          boxShadow: `0 0 20px ${currentEmotionColor}15, 0 0 40px ${currentEmotionColor}05`,
                          outline: `1px solid ${currentEmotionColor}4d`,
                      }
                    : {}
            "
        >
            <AudioWavePlayer
                :agentName="agents[0]?.name || ''"
                :agentAvatar="agents[0]?.avatar || ''"
                :isActive="isAgentSpeaking"
                :audioTag="wsAgentStates.get(agents[0]?.id)?.audioTag ?? ''"
                :frequencyDataFn="getFrequencyData"
            />
        </div>

        <!-- Transcripts -->
        <div class="px-4 py-2 flex-none flex flex-col gap-1 max-h-32 overflow-y-auto">
            <p
                v-if="userTranscript"
                class="text-xs text-text-neutral-subtle italic"
            >
                {{ $t("You:") }} {{ userTranscript }}
            </p>
            <p
                v-if="agentTranscript"
                class="text-xs text-text-default"
            >
                {{ personaName }}: {{ agentTranscriptClean }}
            </p>
        </div>

        <!-- Controls bar (above sources so buttons stay accessible) -->
        <div class="flex-none border-y seance-divider px-4 py-3 flex items-center justify-between gap-3">
            <!-- Status -->
            <div class="flex items-center gap-2 min-w-0">
                <Badge
                    v-if="status === 'connecting'"
                    :text="$t('Connecting...')"
                    :color="ColorAccent.NEUTRAL"
                />
                <Badge
                    v-else-if="status === 'active' && isSpeaking"
                    :text="$t('Listening...')"
                    :color="ColorAccent.WARNING"
                />
                <Badge
                    v-else-if="status === 'active' && isAgentSpeaking"
                    :text="$t('Speaking...')"
                    :color="ColorAccent.SUCCESS"
                />
                <Badge
                    v-else-if="status === 'active'"
                    :text="$t('Ready')"
                    :color="ColorAccent.SUCCESS"
                />
                <Badge
                    v-else
                    :text="$t('Session ended')"
                    :color="ColorAccent.NEUTRAL"
                />
            </div>

            <!-- Export transcript -->
            <button
                v-if="canExport"
                class="w-10 h-10 rounded-full flex items-center justify-center bg-background-neutral-subtle hover:bg-background-neutral-hover transition-colors"
                :title="$t('Export transcript')"
                @click="downloadTranscript"
            >
                <Icon
                    name="mdi:download"
                    class="w-5 h-5 text-text-neutral-subtle"
                />
            </button>

            <!-- Controls: Mode toggle + Mic + End button -->
            <div class="flex items-center gap-2">
                <!-- Mode toggle (auto / push-to-talk) -->
                <button
                    v-if="status === 'active' || status === 'connecting'"
                    class="h-8 px-2 rounded-md text-xs font-medium border transition-colors duration-150 flex items-center gap-1"
                    :class="
                        micMode === 'auto'
                            ? 'border-border-default bg-background-neutral-subtle text-text-neutral-subtle'
                            : 'border-background-primary-brand-default bg-background-primary-brand-default/10 text-text-primary-brand'
                    "
                    :disabled="status === 'connecting'"
                    @click="sessionStore.toggleMicMode()"
                >
                    <Icon
                        :name="micMode === 'auto' ? 'mdi:microphone' : 'mdi:gesture-tap-hold'"
                        class="w-3.5 h-3.5"
                    />
                    {{ micMode === "auto" ? $t("Auto") : $t("Push") }}
                </button>

                <!-- Auto mode: Mic indicator (VAD-driven) -->
                <div
                    v-if="(status === 'active' || status === 'connecting') && micMode === 'auto'"
                    class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                    :class="isSpeaking ? 'bg-red-500 animate-pulse ring-4 ring-red-500/30 scale-110' : 'bg-background-neutral-subtle'"
                >
                    <Icon
                        name="mdi:microphone"
                        class="w-5 h-5"
                        :class="isSpeaking ? 'text-white' : 'text-text-neutral-subtle'"
                    />
                </div>

                <!-- Manual mode: Push-to-talk button -->
                <div
                    v-if="(status === 'active' || status === 'connecting') && micMode === 'manual'"
                    class="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer select-none transition-all duration-150"
                    :class="
                        isSpeaking
                            ? 'bg-red-500 scale-110 ring-4 ring-red-500/40 animate-pulse'
                            : 'bg-background-primary-brand-default hover:bg-background-primary-brand-hover active:scale-95'
                    "
                    @pointerdown.prevent="onPushStart"
                    @pointerup.prevent="onPushEnd"
                    @pointerleave="onPushEnd"
                >
                    <Icon
                        name="mdi:microphone"
                        class="w-6 h-6 text-white"
                    />
                </div>

                <!-- Interrupt agent (stop speaking) -->
                <button
                    v-if="isAgentSpeaking"
                    class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 bg-background-neutral-subtle hover:bg-[#d4a853]/20 active:scale-95"
                    :title="$t('Interrupt')"
                    @click="onInterrupt"
                >
                    <Icon
                        name="mdi:hand-back-left"
                        class="w-5 h-5 text-[#d4a853]"
                    />
                </button>
            </div>
        </div>

        <!-- Share buttons (end-of-session) -->
        <div
            v-if="status === 'ended'"
            class="flex-none px-4 py-3 flex flex-col items-center gap-2"
        >
            <p class="text-xs text-text-neutral-subtle">
                {{ $t("Share your conversation") }}
            </p>
            <SessionShareButtons
                :personaName="personaName"
                :personaEra="persona?.era || ''"
            />
        </div>

        <!-- Sources feed (scrollable, below controls) -->
        <div class="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3">
            <p
                v-if="sourcesReversed.length === 0 && status === 'active'"
                class="text-sm text-text-neutral-subtle text-center py-8"
            >
                {{ $t("Sources will appear here when the agent cites them...") }}
            </p>
            <SourceCardItem
                v-for="source in sourcesReversed"
                :key="source.id"
                :source="source"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { PersistedSession } from "~/composables/useSessionPersistence";

definePageMeta({
    layout: "landing",
});

const route = useRoute();
const router = useRouter();
const { t: _t, locale } = useI18n();
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

// Persona from query string
const personaIdFromUrl = computed(() => {
    const raw = route.query.persona;
    return typeof raw === "string" ? decodeURIComponent(raw) : "";
});

const personaName = computed(() => persona.value?.name || personaIdFromUrl.value || "Unknown");
const personaInitial = computed(() => personaName.value.charAt(0));
const personaSubtitle = computed(() => {
    if (persona.value) return persona.value.era + " · " + persona.value.profession;
    return "";
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
const EMOTION_COLORS: Record<string, string> = {
    angry: "#ef4444",
    excited: "#f5d78e",
    whispers: "#9689a3",
    melancholy: "#79d2ff",
    pause: "#332f38",
    sad: "#79d2ff",
    surprised: "#f5d78e",
    thoughtful: "#9689a3",
    laughing: "#f5d78e",
    serious: "#9e9490",
};
const currentEmotionColor = computed(() => {
    const tag = agents.value[0]?.id ? wsAgentStates.value.get(agents.value[0].id)?.audioTag : "";
    if (!tag) return "#d4a853";
    return EMOTION_COLORS[tag.toLowerCase()] || "#d4a853";
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
    if (history.length > sources.value.length) {
        const newSources = history.slice(sources.value.length);
        newSources.forEach((s) => sessionStore.addSource(s));
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

// Push-to-talk handlers
function onPushStart() {
    startManualRecording();
}

function onPushEnd() {
    stopManualRecording();
}
</script>
