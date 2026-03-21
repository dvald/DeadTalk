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

export type SessionStatus = "idle" | "connecting" | "active" | "ended";
export type SessionMode = "debate" | "conversation";
export type MicMode = "auto" | "manual";

export interface ConversationEntry {
    role: "user" | "agent";
    text: string;
    timestamp: number;
}
