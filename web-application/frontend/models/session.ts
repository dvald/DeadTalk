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

// ConversationEntry is defined in auto-generated api/definitions.ts — import from there
