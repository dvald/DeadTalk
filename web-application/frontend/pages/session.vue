<template>
  <div class="min-h-[100dvh] flex flex-col bg-background-surface">
    <!-- TOP: Topic + Agents -->
    <div class="p-4 flex-none">
      <Heading
        :title="topic"
        :size="HeadingSize.XS"
        :align="Align.CENTER"
        class="line-clamp-2"
      />
    </div>

    <div v-if="agents.length > 0" class="px-4 pb-4 flex gap-4 flex-none">
      <div
        v-for="agent in agents"
        :key="agent.id"
        class="flex-1 min-w-0"
      >
        <AudioWavePlayer
          :agentName="$t(agent.name)"
          :agentAvatar="agent.avatar"
          :isActive="currentSpeaker === agent.id"
          :audioTag="wsAgentStates.get(agent.id)?.audioTag ?? ''"
        />
      </div>
    </div>
    <div v-else class="px-4 pb-4 flex-none flex items-center justify-center">
      <p class="text-sm text-text-neutral-subtle animate-pulse">
        {{ $t("Connecting...") }}
      </p>
    </div>

    <!-- MIDDLE: Sources feed -->
    <div class="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3">
      <p
        v-if="sourcesReversed.length === 0"
        class="text-sm text-text-neutral-subtle text-center py-8"
      >
        {{ $t("No sources yet") }}
      </p>
      <SourceCardItem
        v-for="source in sourcesReversed"
        :key="source.id"
        :source="source"
      />
    </div>

    <!-- BOTTOM: Controls bar -->
    <div
      class="flex-none border-t border-border-default px-4 py-3 flex items-center justify-between"
    >
      <Badge
        v-if="status === 'connecting'"
        :text="$t('Connecting...')"
        :color="ColorAccent.NEUTRAL"
      />
      <Badge
        v-else-if="status === 'active'"
        :text="$t('Live')"
        :color="ColorAccent.SUCCESS"
      />
      <Badge
        v-else
        :text="$t('Session ended')"
        :color="ColorAccent.NEUTRAL"
      />

      <ActionButton
        v-if="status !== 'ended'"
        :text="$t('Stop debate')"
        :styleType="ButtonStyleType.DELETE_FILLED"
        :iconPosition="IconPosition.LEFT"
        icon="mdi:stop"
        :disabled="status === 'connecting'"
        @click="onStop"
      />
      <ActionButton
        v-else
        :text="$t('Back to home')"
        :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
        :iconPosition="IconPosition.LEFT"
        icon="mdi:arrow-left"
        @click="onBack"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "landing",
});

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const localePath = useLocalePath();

// Store
const sessionStore = useSessionStore();
const {
  topic,
  agents,
  sources,
  status,
  currentSpeaker,
  sourcesReversed,
  elapsedTime,
} = storeToRefs(sessionStore);

// Topic from query string
const topicFromUrl = computed(() => {
  const raw = route.query.topic;
  return typeof raw === "string" ? decodeURIComponent(raw) : "";
});

useHead(() => ({
  title: topic.value || t("Live debate"),
}));

// WebSocket (transport layer)
const {
  isConnected,
  sessionEnded,
  sessionEndReason,
  agentStates: wsAgentStates,
  sourcesHistory,
  startSession: wsStartSession,
  stopSession: wsStopSession,
  open,
  close,
} = useOrchestratorSocket();

// Redirect if no topic, otherwise init
onMounted(() => {
  if (!topicFromUrl.value) {
    router.replace(localePath("/"));
    return;
  }
  sessionStore.startSession(topicFromUrl.value);
  open();
});

onBeforeUnmount(() => {
  wsStopSession();
  close();
  sessionStore.resetSession();
});

// Bridge: WS connected → start debate + mark active
watch(isConnected, (connected) => {
  if (connected && status.value === "connecting") {
    wsStartSession("debate", { topic: topicFromUrl.value });
    sessionStore.setActive();
  }
});

// Bridge: agent states → store
watch(() => wsAgentStates.value, (states) => {
  for (const [id, state] of states) {
    sessionStore.registerAgent(id);
    if (state.speaking) {
      sessionStore.setSpeaker(id);
    }
  }
  const anySpeaking = [...states.values()].some(s => s.speaking);
  if (!anySpeaking) sessionStore.setSpeaker(null);
}, { deep: true });

// Bridge: new sources → store
watch(sourcesHistory, (history) => {
  if (history.length > sources.value.length) {
    const newSources = history.slice(sources.value.length);
    newSources.forEach(s => sessionStore.addSource(s));
  }
});

// Bridge: session end → store
watch(sessionEnded, (ended) => {
  if (ended) sessionStore.endSession(sessionEndReason.value);
});

// Actions
function onStop() {
  wsStopSession();
}

function onBack() {
  router.push(localePath("/"));
}
</script>
