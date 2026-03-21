// Composable for WebSocket connection to the orchestrator

"use strict";

import type { SourceCard } from "~/models/source-card";
import type { AgentState, WsServerEvent } from "~/models/ws-events";

/**
 * Connects to the backend WebSocket orchestrator and exposes reactive state
 * for agent speaking, source citations, and session lifecycle.
 *
 * Uses VueUse's useWebSocket (auto-imported) with auto-reconnect and heartbeat.
 */
export function useOrchestratorSocket() {
    // Build WebSocket URL from the same env vars the API uses
    const wsUrl = computed(() => {
        if (import.meta.env.DEV) {
            const base = import.meta.env.VITE__DEV_TEST_HOST || "http://localhost";
            return base.replace(/^http/, "ws") + "/websocket";
        } else {
            const protocol = location.protocol === "https:" ? "wss:" : "ws:";
            const host = import.meta.env.VITE__API_SERVER_HOST
                ? new URL(import.meta.env.VITE__API_SERVER_HOST, location.href).host
                : location.host;
            return protocol + "//" + host + "/websocket";
        }
    });

    // VueUse WebSocket (auto-imported by @vueuse/nuxt)
    const { status, data, send: wsSend, open, close } = useWebSocket(wsUrl, {
        autoReconnect: {
            retries: 5,
            delay: 2000,
        },
        heartbeat: {
            message: "a",
            interval: 30000,
            pongTimeout: 10000,
        },
        immediate: false,
    });

    // Reactive state
    const isConnected = computed(() => status.value === "OPEN");
    const currentSessionId = ref<string | null>(null);
    const agentStates = ref<Map<string, AgentState>>(new Map());
    const sourcesHistory = ref<SourceCard[]>([]);
    const lastAudioChunk = ref<{ agentId: string; chunk: string } | null>(null);
    const sessionEnded = ref(false);
    const sessionEndReason = ref<string>("");
    const userTranscriptText = ref<string>("");
    const agentErrorMessage = ref<string>("");

    // Parse incoming messages
    watch(data, (raw) => {
        if (!raw) return;

        let msg: WsServerEvent;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }

        switch (msg.event) {
            case "hello":
                // Connection established
                break;

            case "session-started":
                currentSessionId.value = msg.sessionId;
                sessionEnded.value = false;
                sessionEndReason.value = "";
                agentStates.value = new Map();
                sourcesHistory.value = [];
                lastAudioChunk.value = null;
                break;

            case "agent-speaking":
                {
                    const state = agentStates.value.get(msg.agentId) || { speaking: false, transcript: "", audioTag: "" };
                    state.speaking = true;
                    state.transcript = msg.transcript;
                    state.audioTag = msg.audioTag || "";
                    agentStates.value.set(msg.agentId, state);
                    // Trigger reactivity
                    agentStates.value = new Map(agentStates.value);

                    lastAudioChunk.value = { agentId: msg.agentId, chunk: msg.chunk };
                }
                break;

            case "source-cited":
                {
                    const source: SourceCard = {
                        id: msg.source.id,
                        title: msg.source.title,
                        url: msg.source.url,
                        snippet: msg.source.snippet,
                        agentId: msg.agentId,
                        timestamp: msg.source.timestamp,
                        favicon: msg.source.favicon,
                    };
                    sourcesHistory.value = [...sourcesHistory.value, source];
                }
                break;

            case "agent-finished":
                {
                    const state = agentStates.value.get(msg.agentId);
                    if (state) {
                        state.speaking = false;
                        state.audioTag = "";
                        agentStates.value.set(msg.agentId, state);
                        agentStates.value = new Map(agentStates.value);
                    }
                }
                break;

            case "session-end":
                sessionEnded.value = true;
                sessionEndReason.value = msg.reason;
                currentSessionId.value = null;
                break;

            case "user-transcript":
                userTranscriptText.value = (msg as any).text || "";
                break;

            case "agent-error":
                agentErrorMessage.value = (msg as any).message || "Unknown error";
                break;
        }
    });

    // Methods

    /**
     * Starts a new orchestrator session.
     * @param type "debate" or "conversation"
     * @param config Session configuration (agents, topic, etc.)
     */
    function startSession(type: "debate" | "conversation", config: any = {}) {
        sessionEnded.value = false;
        wsSend(JSON.stringify({ type: "start-session", sessionType: type, config: config }));
    }

    /**
     * Stops the current session.
     */
    function stopSession() {
        wsSend(JSON.stringify({ type: "stop-session" }));
    }

    /**
     * Sends a raw message through the WebSocket.
     * @param message The message object to send
     */
    function send(message: any) {
        wsSend(JSON.stringify(message));
    }

    return {
        // Connection state
        isConnected,
        status,

        // Session state
        currentSessionId,
        sessionEnded,
        sessionEndReason,

        // Agent state
        agentStates,
        lastAudioChunk,

        // Sources
        sourcesHistory,

        // Conversation state
        userTranscriptText,
        agentErrorMessage,

        // Methods
        startSession,
        stopSession,
        send,
        open,
        close,
    };
}
