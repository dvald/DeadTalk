<template>
    <div class="min-h-[100dvh] flex flex-col bg-background-surface">
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

        <!-- Audio wave player -->
        <div
            v-if="agents.length > 0"
            class="px-4 pb-2 flex-none"
        >
            <AudioWavePlayer
                :agentName="agents[0]?.name || ''"
                :agentAvatar="agents[0]?.avatar || ''"
                :isActive="currentSpeaker === agents[0]?.id"
                :audioTag="wsAgentStates.get(agents[0]?.id)?.audioTag ?? ''"
            />
        </div>

        <!-- Transcripts -->
        <div class="px-4 py-2 flex-none flex flex-col gap-1">
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
                {{ personaName }}: {{ agentTranscriptTruncated }}
            </p>
        </div>

        <!-- MIDDLE: Sources feed -->
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

        <!-- BOTTOM: Controls bar -->
        <div class="flex-none border-t border-border-default px-4 py-3 flex items-center justify-between gap-3">
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
                    v-else-if="status === 'active' && currentSpeaker"
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

            <!-- Microphone + End button -->
            <div class="flex items-center gap-2">
                <!-- Mic indicator -->
                <div
                    v-if="status === 'active' && isListening"
                    class="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
                    :class="isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-background-neutral-subtle'"
                >
                    <Icon
                        name="mdi:microphone"
                        class="w-4 h-4"
                        :class="isSpeaking ? 'text-white' : 'text-text-neutral-subtle'"
                    />
                </div>

                <ActionButton
                    v-if="status !== 'ended'"
                    :text="$t('End')"
                    :styleType="ButtonStyleType.DELETE_FILLED"
                    :iconPosition="IconPosition.LEFT"
                    icon="mdi:stop"
                    :disabled="status === 'connecting'"
                    @click="onStop"
                />
                <ActionButton
                    v-else
                    :text="$t('Back')"
                    :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                    :iconPosition="IconPosition.LEFT"
                    icon="mdi:arrow-left"
                    @click="onBack"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: "landing",
});

const route = useRoute();
const router = useRouter();
const { t: _t } = useI18n();
const localePath = useLocalePath();

// Store
const sessionStore = useSessionStore();
const { persona, agents, sources, status, currentSpeaker, sourcesReversed, userTranscript, agentTranscript } = storeToRefs(sessionStore);

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
const agentTranscriptTruncated = computed(() => {
    const text = agentTranscript.value;
    return text.length > 200 ? text.substring(text.length - 200) + "..." : text;
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

// Audio playback
const { isPlaying: _isAgentPlaying, playChunk, stopPlayback } = useAudioPlayback();

// Voice input (VAD)
const { isListening, isSpeaking, startListening, stopListening } = useVoiceInput((msg: any) => {
    wsSend(msg);
});

// Redirect if no persona, otherwise init
onMounted(() => {
    if (!personaIdFromUrl.value) {
        router.replace(localePath("/"));
        return;
    }

    // If store wasn't initialized from index.vue (e.g., direct URL access)
    if (!persona.value || persona.value.id !== personaIdFromUrl.value) {
        sessionStore.startConversation({
            id: personaIdFromUrl.value,
            name: personaIdFromUrl.value,
            era: "",
            nationality: "",
            profession: "",
            avatar: "",
            firstMessage: "",
        });
    }

    open();
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
        wsSend({
            type: "start-conversation",
            personaId: personaIdFromUrl.value,
        });
        sessionStore.setActive();

        // Start listening for voice input
        startListening();
    }
});

// Bridge: agent states → store
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
        if (!anySpeaking) sessionStore.setSpeaker(null);
    },
    { deep: true },
);

// Bridge: audio chunks → playback
watch(lastAudioChunk, (chunk) => {
    if (chunk && chunk.chunk) {
        playChunk(chunk.chunk);
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
    if (text) sessionStore.setUserTranscript(text);
});

// Bridge: session end → store
watch(sessionEnded, (ended) => {
    if (ended) {
        stopListening();
        sessionStore.endSession(sessionEndReason.value);
    }
});

// Actions
function onStop() {
    stopListening();
    stopPlayback();
    wsSend({ type: "stop-session" });
}

function onBack() {
    router.push(localePath("/"));
}
</script>
