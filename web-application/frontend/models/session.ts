/**
 * Session domain types for the debate/conversation feature.
 */

export interface Agent {
  id: string;
  name: string;
  voiceId: string;
  avatar: string;
  stance: "for" | "against" | "";
  era?: string;
  profession?: string;
}

export interface PersonaSummary {
  id: string;
  name: string;
  era: string;
  nationality: string;
  profession: string;
  avatar: string;
  firstMessage: string;
}

export type SessionStatus = "idle" | "connecting" | "active" | "ended";
export type SessionMode = "debate" | "conversation";
