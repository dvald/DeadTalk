/**
 * WebSocket event types for the orchestrator protocol.
 * Mirrors backend types in src/models/ws-events.ts.
 */

/* Server → Client events */

export interface WsHelloEvent {
  event: "hello";
}

export interface WsSessionStartedEvent {
  event: "session-started";
  sessionId: string;
}

export interface WsAgentSpeakingEvent {
  event: "agent-speaking";
  agentId: string;
  chunk: string;
  transcript: string;
  audioTag?: string;
}

export interface WsSourceCitedEvent {
  event: "source-cited";
  agentId: string;
  source: {
    id: string;
    title: string;
    url: string;
    snippet: string;
    agentId: string;
    timestamp: number;
    favicon?: string;
  };
}

export interface WsAgentFinishedEvent {
  event: "agent-finished";
  agentId: string;
}

export interface WsSessionEndEvent {
  event: "session-end";
  reason: "debate-end" | "conversation-end" | "stopped" | "error";
}

export type WsServerEvent =
  | WsHelloEvent
  | WsSessionStartedEvent
  | WsAgentSpeakingEvent
  | WsSourceCitedEvent
  | WsAgentFinishedEvent
  | WsSessionEndEvent;

/* Client → Server messages */

export interface WsStartSessionMessage {
  type: "start-session";
  sessionType: "debate" | "conversation";
  config: any;
}

export interface WsStopSessionMessage {
  type: "stop-session";
}

export type WsClientMessage =
  | WsStartSessionMessage
  | WsStopSessionMessage;

/* Agent state tracked by the composable */

export interface AgentState {
  speaking: boolean;
  transcript: string;
  audioTag: string;
}
