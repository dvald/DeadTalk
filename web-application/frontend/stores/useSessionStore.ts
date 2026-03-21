import type { Agent, SessionStatus } from "~/models/session";
import type { SourceCard } from "~/models/source-card";

export const useSessionStore = defineStore("session", () => {
  // ── State ──────────────────────────────────────────────
  const topic = ref<string>("");
  const agents = ref<Agent[]>([]);
  const sources = ref<SourceCard[]>([]);
  const status = ref<SessionStatus>("idle");
  const currentSpeaker = ref<string | null>(null);
  const elapsedTime = ref<number>(0);
  const endReason = ref<string>("");

  // ── Computed ───────────────────────────────────────────
  const sourcesReversed = computed(() => [...sources.value].reverse());
  const isActive = computed(() => status.value === "active");
  const agentById = computed(() => new Map(agents.value.map(a => [a.id, a])));

  // ── Timer (private) ───────────────────────────────────
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      elapsedTime.value++;
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // ── Actions ────────────────────────────────────────────
  function startSession(newTopic: string) {
    topic.value = newTopic;
    agents.value = [];
    sources.value = [];
    status.value = "connecting";
    currentSpeaker.value = null;
    elapsedTime.value = 0;
    endReason.value = "";
    startTimer();
  }

  function setActive() {
    status.value = "active";
  }

  function registerAgent(agentId: string) {
    if (agents.value.some(a => a.id === agentId)) return;
    const index = agents.value.length;
    agents.value.push({
      id: agentId,
      name: index === 0 ? "For" : "Against",
      voiceId: "",
      avatar: "",
      stance: index === 0 ? "for" : "against",
    });
  }

  function setSpeaker(agentId: string | null) {
    currentSpeaker.value = agentId;
    if (agentId) registerAgent(agentId);
  }

  function addSource(card: SourceCard) {
    sources.value = [...sources.value, card];
  }

  function endSession(reason: string) {
    status.value = "ended";
    currentSpeaker.value = null;
    endReason.value = reason;
    stopTimer();
  }

  function resetSession() {
    topic.value = "";
    agents.value = [];
    sources.value = [];
    status.value = "idle";
    currentSpeaker.value = null;
    elapsedTime.value = 0;
    endReason.value = "";
    stopTimer();
  }

  return {
    // State
    topic,
    agents,
    sources,
    status,
    currentSpeaker,
    elapsedTime,
    endReason,

    // Computed
    sourcesReversed,
    isActive,
    agentById,

    // Actions
    startSession,
    setActive,
    registerAgent,
    setSpeaker,
    addSource,
    endSession,
    resetSession,
  };
});
