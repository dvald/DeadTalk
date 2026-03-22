"use strict";

import type { PersonaSummary, ConversationEntry } from "~/api/definitions";
import type { SourceCard } from "~/models/source-card";

export interface PersistedSession {
    personaId: string;
    personaData: PersonaSummary;
    conversationHistory: ConversationEntry[];
    sources: SourceCard[];
    savedAt: number;
}

const STORAGE_KEY = "deadtalk-session";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Composable for saving/loading conversation sessions to/from localStorage.
 * Enables resuming conversations across page navigations and tab closes.
 */
export function useSessionPersistence() {
    function saveSession(session: PersistedSession): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch {
            // storage full or unavailable
        }
    }

    function loadSession(personaId: string): PersistedSession | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed: PersistedSession = JSON.parse(raw);
            if (parsed.personaId !== personaId) return null;
            if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
                clearSession();
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    }

    function clearSession(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
    }

    return { saveSession, loadSession, clearSession };
}
