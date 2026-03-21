// WebSocket orchestrator service

"use strict";

import { Monitor } from "../monitor";
import { WebsocketController } from "../controllers/websocket/websocket";
import { SourceCardData, AgentSpeakingEvent, SourceCitedEvent, AgentFinishedEvent, SessionEndEvent } from "../models/ws-events";

/**
 * Active WebSocket session
 */
export interface WsSession {
    id: string;
    type: "debate" | "conversation";
    controller: WebsocketController;
    config: any;
    startedAt: number;
}

/**
 * Manages WebSocket sessions and broadcasts orchestrator events to connected clients.
 * Other services (e.g., debate engine, conversation engine) use this to emit events.
 */
export class WsOrchestratorService {
    /* Singleton */

    public static instance: WsOrchestratorService = null;

    public static getInstance(): WsOrchestratorService {
        if (WsOrchestratorService.instance) {
            return WsOrchestratorService.instance;
        } else {
            WsOrchestratorService.instance = new WsOrchestratorService();
            return WsOrchestratorService.instance;
        }
    }

    private sessions: Map<string, WsSession>;
    private sessionCounter: number;

    constructor() {
        this.sessions = new Map();
        this.sessionCounter = 0;
    }

    /**
     * Registers a new session for a WebSocket connection.
     * @param controller The WebSocket controller managing the connection
     * @param type The session type
     * @param config Session configuration (agents, topic, etc.)
     * @returns The generated session ID
     */
    public registerSession(controller: WebsocketController, type: "debate" | "conversation", config: any): string {
        this.sessionCounter++;
        const sessionId = "session-" + Date.now() + "-" + this.sessionCounter;

        const session: WsSession = {
            id: sessionId,
            type: type,
            controller: controller,
            config: config,
            startedAt: Date.now(),
        };

        this.sessions.set(sessionId, session);
        Monitor.info("WsOrchestratorService: session registered", { sessionId, type });

        return sessionId;
    }

    /**
     * Removes a session.
     * @param sessionId The session ID to remove
     */
    public removeSession(sessionId: string): void {
        if (this.sessions.has(sessionId)) {
            this.sessions.delete(sessionId);
            Monitor.info("WsOrchestratorService: session removed", { sessionId });
        }
    }

    /**
     * Removes all sessions for a given controller (used on disconnect).
     * @param controller The WebSocket controller
     */
    public removeSessionsByController(controller: WebsocketController): void {
        for (const [sessionId, session] of this.sessions) {
            if (session.controller === controller) {
                this.sessions.delete(sessionId);
                Monitor.debug("WsOrchestratorService: session removed on disconnect", { sessionId });
            }
        }
    }

    /**
     * Gets a session by ID.
     * @param sessionId The session ID
     * @returns The session or undefined
     */
    public getSession(sessionId: string): WsSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Sends an event to a specific session's client.
     * @param sessionId The session ID
     * @param event The event payload to send
     */
    public broadcastToSession(sessionId: string, event: any): void {
        const session = this.sessions.get(sessionId);
        if (session && !session.controller.closed) {
            session.controller.send(event);
        }
    }

    /**
     * Emits an agent-speaking event with audio chunk and transcript.
     * @param sessionId The session ID
     * @param agentId The speaking agent's ID
     * @param chunk Base64-encoded audio chunk
     * @param transcript The transcription text
     * @param audioTag Optional emotion/style tag
     */
    public emitAgentSpeaking(sessionId: string, agentId: string, chunk: string, transcript: string, audioTag?: string): void {
        const event: AgentSpeakingEvent = {
            event: "agent-speaking",
            agentId: agentId,
            chunk: chunk,
            transcript: transcript,
        };
        if (audioTag) {
            event.audioTag = audioTag;
        }
        this.broadcastToSession(sessionId, event);
    }

    /**
     * Emits a source-cited event when an agent references a web source.
     * @param sessionId The session ID
     * @param agentId The agent that cited the source
     * @param source The source card data
     */
    public emitSourceCited(sessionId: string, agentId: string, source: SourceCardData): void {
        const event: SourceCitedEvent = {
            event: "source-cited",
            agentId: agentId,
            source: source,
        };
        this.broadcastToSession(sessionId, event);
    }

    /**
     * Emits an agent-finished event when an agent stops speaking.
     * @param sessionId The session ID
     * @param agentId The agent that finished
     */
    public emitAgentFinished(sessionId: string, agentId: string): void {
        const event: AgentFinishedEvent = {
            event: "agent-finished",
            agentId: agentId,
        };
        this.broadcastToSession(sessionId, event);
    }

    /**
     * Emits a session-end event.
     * @param sessionId The session ID
     * @param reason The reason the session ended
     */
    public emitSessionEnd(sessionId: string, reason: "debate-end" | "conversation-end" | "stopped" | "error"): void {
        const event: SessionEndEvent = {
            event: "session-end",
            reason: reason,
        };
        this.broadcastToSession(sessionId, event);
        this.removeSession(sessionId);
    }
}
