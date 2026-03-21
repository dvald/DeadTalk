/**
 * Session domain types for the debate/conversation feature.
 */

export interface Agent {
  id: string;
  name: string;
  voiceId: string;
  avatar: string;
  stance: "for" | "against" | "";
}

export type SessionStatus = "idle" | "connecting" | "active" | "ended";
