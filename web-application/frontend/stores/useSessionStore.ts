import type { Agent, SessionStatus, SessionMode, MicMode } from "~/models/session";
import type { PersonaSummary, ConversationEntry } from "~/api/definitions";
import type { SourceCard } from "~/models/source-card";

export const useSessionStore = defineStore("session", () => {
    // ── State ──────────────────────────────────────────────
    const topic = ref<string>("");
    const mode = ref<SessionMode>("conversation");
    const persona = ref<PersonaSummary | null>(null);
    const agents = ref<Agent[]>([]);
    const sources = ref<SourceCard[]>([]);
    const status = ref<SessionStatus>("idle");
    const currentSpeaker = ref<string | null>(null);
    const elapsedTime = ref<number>(0);
    const endReason = ref<string>("");
    const userTranscript = ref<string>("");
    const agentTranscript = ref<string>("");
    const micMode = ref<MicMode>("auto");
    const conversationHistory = ref<ConversationEntry[]>([]);

    // ── Computed ───────────────────────────────────────────
    const sourcesReversed = computed(() => [...sources.value].reverse());
    const isActive = computed(() => status.value === "active");
    const agentById = computed(() => new Map(agents.value.map((a) => [a.id, a])));
    const isConversation = computed(() => mode.value === "conversation");

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

    /**
     * Starts a debate session (legacy mode).
     */
    function startSession(newTopic: string) {
        mode.value = "debate";
        topic.value = newTopic;
        persona.value = null;
        agents.value = [];
        sources.value = [];
        status.value = "connecting";
        currentSpeaker.value = null;
        elapsedTime.value = 0;
        endReason.value = "";
        userTranscript.value = "";
        agentTranscript.value = "";
        conversationHistory.value = [];
        startTimer();
    }

    /**
     * Starts a conversation session with a historical persona.
     */
    function startConversation(selectedPersona: PersonaSummary) {
        mode.value = "conversation";
        topic.value = selectedPersona.name;
        persona.value = selectedPersona;
        agents.value = [
            {
                id: selectedPersona.id,
                name: selectedPersona.name,
                voiceId: "",
                avatar: selectedPersona.avatar,
                stance: "",
                era: selectedPersona.era,
                profession: selectedPersona.profession,
            },
        ];
        sources.value = [];
        status.value = "connecting";
        currentSpeaker.value = null;
        elapsedTime.value = 0;
        endReason.value = "";
        userTranscript.value = "";
        agentTranscript.value = "";
        conversationHistory.value = [];
        startTimer();
    }

    function setActive() {
        status.value = "active";
    }

    function registerAgent(agentId: string) {
        if (agents.value.some((a) => a.id === agentId)) return;
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

    function setUserTranscript(text: string) {
        userTranscript.value = text;
    }

    function setAgentTranscript(text: string) {
        agentTranscript.value = text;
    }

    function addConversationEntry(entry: ConversationEntry) {
        conversationHistory.value = [...conversationHistory.value, entry];
    }

    function toggleMicMode() {
        micMode.value = micMode.value === "auto" ? "manual" : "auto";
    }

    function setMicMode(newMode: MicMode) {
        micMode.value = newMode;
    }

    function endSession(reason: string) {
        status.value = "ended";
        currentSpeaker.value = null;
        endReason.value = reason;
        stopTimer();
    }

    function resetSession() {
        topic.value = "";
        mode.value = "conversation";
        persona.value = null;
        agents.value = [];
        sources.value = [];
        status.value = "idle";
        currentSpeaker.value = null;
        elapsedTime.value = 0;
        endReason.value = "";
        userTranscript.value = "";
        agentTranscript.value = "";
        micMode.value = "auto";
        conversationHistory.value = [];
        stopTimer();
    }

    return {
        // State
        topic,
        mode,
        persona,
        agents,
        sources,
        status,
        currentSpeaker,
        elapsedTime,
        endReason,
        userTranscript,
        agentTranscript,
        micMode,
        conversationHistory,

        // Computed
        sourcesReversed,
        isActive,
        agentById,
        isConversation,

        // Actions
        startSession,
        startConversation,
        setActive,
        registerAgent,
        setSpeaker,
        addSource,
        setUserTranscript,
        setAgentTranscript,
        endSession,
        resetSession,
        addConversationEntry,
        toggleMicMode,
        setMicMode,
    };
});
