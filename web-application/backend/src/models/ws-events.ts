// WebSocket event types for orchestrator

"use strict";

/**
 * Source card data sent over WebSocket
 */
export interface SourceCardData {
    id: string;
    title: string;
    url: string;
    snippet: string;
    agentId: string;
    timestamp: number;
    favicon?: string;
}

/* Server → Client events */

export interface HelloEvent {
    event: "hello";
}

export interface SessionStartedEvent {
    event: "session-started";
    sessionId: string;
}

export interface AgentSpeakingEvent {
    event: "agent-speaking";
    agentId: string;
    chunk: string;
    transcript: string;
    audioTag?: string;
}

export interface SourceCitedEvent {
    event: "source-cited";
    agentId: string;
    source: SourceCardData;
}

export interface AgentFinishedEvent {
    event: "agent-finished";
    agentId: string;
}

export interface SessionEndEvent {
    event: "session-end";
    reason: "debate-end" | "conversation-end" | "stopped" | "error";
}

export interface UserTranscriptEvent {
    event: "user-transcript";
    text: string;
}

export interface AgentErrorEvent {
    event: "agent-error";
    message: string;
}

export type WsServerEvent =
    | HelloEvent
    | SessionStartedEvent
    | AgentSpeakingEvent
    | SourceCitedEvent
    | AgentFinishedEvent
    | SessionEndEvent
    | UserTranscriptEvent
    | AgentErrorEvent;

/* Client → Server messages */

export interface StartSessionMessage {
    type: "start-session";
    sessionType: "debate" | "conversation";
    config: any;
}

export interface StopSessionMessage {
    type: "stop-session";
}

export interface StartConversationMessage {
    type: "start-conversation";
    personaId: string;
}

export interface AudioChunkMessage {
    type: "audio-chunk";
    chunk: string;
}

export interface SpeechEndMessage {
    type: "speech-end";
}

export interface KeepAliveMessage {
    type: "a";
}

export type WsClientMessage =
    | StartSessionMessage
    | StopSessionMessage
    | StartConversationMessage
    | AudioChunkMessage
    | SpeechEndMessage
    | KeepAliveMessage;
