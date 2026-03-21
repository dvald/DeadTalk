// Conversation engine service — orchestrates the full voice conversation pipeline

"use strict";

import { Monitor } from "../monitor";
import { PersonasConfig, Persona } from "../config/personas";
import { ElevenLabsService } from "./elevenlabs-service";
import { OpenAIService, ChatMessage, ToolDefinition, ToolCall } from "./openai-service";
import { FirecrawlService, FirecrawlSearchResult } from "./firecrawl-service";
import { WsOrchestratorService } from "./ws-orchestrator-service";
import { SourceCardData } from "../models/ws-events";

/**
 * Active conversation session state
 */
interface ConversationSession {
    sessionId: string;
    persona: Persona;
    history: ChatMessage[];
    audioChunks: Buffer[];
    isProcessing: boolean;
    sourceCounter: number;
}

/**
 * Tool definition for the biographical search tool
 */
const SEARCH_TOOL: ToolDefinition = {
    type: "function",
    function: {
        name: "search_biographical_context",
        description: "Search the web for biographical facts, quotes, historical context, and primary sources about the historical figure. Use this tool whenever the user asks about specific events, quotes, dates, or facts you are not certain about.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query for biographical information",
                },
            },
            required: ["query"],
        },
    },
};

export class ConversationEngineService {
    /* Singleton */

    public static instance: ConversationEngineService = null;

    public static getInstance(): ConversationEngineService {
        if (ConversationEngineService.instance) {
            return ConversationEngineService.instance;
        } else {
            ConversationEngineService.instance = new ConversationEngineService();
            return ConversationEngineService.instance;
        }
    }

    private sessions: Map<string, ConversationSession>;

    constructor() {
        this.sessions = new Map();
    }

    /**
     * Starts a new conversation session with a historical persona.
     * Sends the persona's first message as TTS audio to the client.
     * @param sessionId The WebSocket session ID
     * @param personaId The persona slug (e.g., "tesla")
     */
    public async startConversation(sessionId: string, personaId: string): Promise<void> {
        const persona = PersonasConfig.getInstance().getPersonaById(personaId);
        if (!persona) {
            Monitor.warning("ConversationEngineService.startConversation: persona not found", { personaId });
            WsOrchestratorService.getInstance().emitSessionEnd(sessionId, "error");
            return;
        }

        const session: ConversationSession = {
            sessionId: sessionId,
            persona: persona,
            history: [],
            audioChunks: [],
            isProcessing: false,
            sourceCounter: 0,
        };

        this.sessions.set(sessionId, session);
        Monitor.info("ConversationEngineService: conversation started", { sessionId, personaId });

        // Send first message as TTS
        try {
            await this.generateAndSendResponse(session, persona.firstMessage);
            session.history.push({ role: "assistant", content: persona.firstMessage });
        } catch (err) {
            Monitor.exception(err, "ConversationEngineService: failed to send first message");
        }
    }

    /**
     * Accumulates audio chunks from the user's microphone.
     * @param sessionId The session ID
     * @param chunk Base64-encoded audio chunk
     */
    public handleAudioChunk(sessionId: string, chunk: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }

        try {
            const buffer = Buffer.from(chunk, "base64");
            session.audioChunks.push(buffer);
        } catch (err) {
            Monitor.warning("ConversationEngineService: invalid audio chunk", { sessionId });
        }
    }

    /**
     * Called when the frontend VAD detects the user stopped speaking.
     * Triggers the full pipeline: STT → LLM → Firecrawl → TTS.
     * @param sessionId The session ID
     */
    public async handleSpeechEnd(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }

        if (session.isProcessing) {
            Monitor.debug("ConversationEngineService: already processing, ignoring speech-end", { sessionId });
            return;
        }

        if (session.audioChunks.length === 0) {
            Monitor.debug("ConversationEngineService: no audio chunks, ignoring speech-end", { sessionId });
            return;
        }

        session.isProcessing = true;

        // Collect and clear audio chunks
        const audioBuffer = Buffer.concat(session.audioChunks);
        session.audioChunks = [];

        try {
            // 1. Speech-to-Text
            Monitor.debug("ConversationEngineService: STT", { sessionId, audioBytes: audioBuffer.length });
            const transcript = await ElevenLabsService.getInstance().speechToText(audioBuffer, "en");

            if (!transcript || transcript.trim().length === 0) {
                Monitor.debug("ConversationEngineService: empty transcript, skipping", { sessionId });
                session.isProcessing = false;
                return;
            }

            Monitor.info("ConversationEngineService: user said", { sessionId, transcript });

            // Emit user transcript to frontend
            WsOrchestratorService.getInstance().broadcastToSession(sessionId, {
                event: "user-transcript",
                text: transcript,
            });

            // Add user message to history
            session.history.push({ role: "user", content: transcript });

            // 2. LLM with tools (search_biographical_context)
            const systemMessage: ChatMessage = {
                role: "system",
                content: session.persona.systemPrompt,
            };

            const messages: ChatMessage[] = [
                systemMessage,
                ...this.trimHistory(session.history, 10),
            ];

            Monitor.debug("ConversationEngineService: LLM call", { sessionId, historyLength: session.history.length });

            const llmResult = await OpenAIService.getInstance().chatWithToolResolution(
                messages,
                [SEARCH_TOOL],
                async (toolCall: ToolCall) => {
                    return await this.resolveToolCall(session, toolCall);
                },
                2,
            );

            const response = llmResult.response;

            if (!response || response.trim().length === 0) {
                Monitor.warning("ConversationEngineService: empty LLM response", { sessionId });
                session.isProcessing = false;
                return;
            }

            Monitor.info("ConversationEngineService: agent response", { sessionId, responseLength: response.length });

            // Add assistant response to history
            session.history.push({ role: "assistant", content: response });

            // 3. Text-to-Speech and send to client
            await this.generateAndSendResponse(session, response);

        } catch (err) {
            Monitor.exception(err, "ConversationEngineService: pipeline failed");
            WsOrchestratorService.getInstance().broadcastToSession(sessionId, {
                event: "agent-error",
                message: "Something went wrong. Please try again.",
            });
        } finally {
            session.isProcessing = false;
        }
    }

    /**
     * Ends a conversation session and cleans up.
     * @param sessionId The session ID
     */
    public endConversation(sessionId: string): void {
        if (this.sessions.has(sessionId)) {
            this.sessions.delete(sessionId);
            Monitor.info("ConversationEngineService: conversation ended", { sessionId });
        }
    }

    /**
     * Resolves a tool call from the LLM (Firecrawl search).
     * Also emits source-cited events to the frontend.
     */
    private async resolveToolCall(session: ConversationSession, toolCall: ToolCall): Promise<string> {
        if (toolCall.name !== "search_biographical_context") {
            return JSON.stringify({ error: "Unknown tool: " + toolCall.name });
        }

        const query = (toolCall.arguments.query as string) || "";
        const searchQuery = session.persona.name + " " + query;

        Monitor.info("ConversationEngineService: Firecrawl search", {
            sessionId: session.sessionId,
            query: searchQuery,
        });

        try {
            const results = await FirecrawlService.getInstance().search(searchQuery, 3);

            // Emit source cards to frontend
            for (const result of results) {
                session.sourceCounter++;
                const sourceCard: SourceCardData = {
                    id: "src-" + session.sessionId + "-" + session.sourceCounter,
                    title: result.title,
                    url: result.url,
                    snippet: result.description || result.markdown.substring(0, 200),
                    agentId: session.persona.id,
                    timestamp: Date.now(),
                };
                WsOrchestratorService.getInstance().emitSourceCited(session.sessionId, session.persona.id, sourceCard);
            }

            // Format results for LLM context
            return this.formatSearchResultsForLLM(results);
        } catch (err) {
            Monitor.exception(err, "ConversationEngineService: Firecrawl search failed");
            return JSON.stringify({ error: "Search failed. Answer from your existing knowledge." });
        }
    }

    /**
     * Formats Firecrawl search results into a string the LLM can use.
     */
    private formatSearchResultsForLLM(results: FirecrawlSearchResult[]): string {
        if (results.length === 0) {
            return JSON.stringify({ sources: [], note: "No results found. Answer from your existing knowledge." });
        }

        const sources = results.map((r, i) => {
            return {
                index: i + 1,
                title: r.title,
                url: r.url,
                content: r.markdown.substring(0, 800),
            };
        });

        return JSON.stringify({
            sources: sources,
            instruction: "Use these sources to inform your response. Reference them naturally, e.g., 'As documented in...' or 'According to historical records...'",
        });
    }

    /**
     * Generates TTS audio from text and sends it to the client via WebSocket.
     */
    private async generateAndSendResponse(session: ConversationSession, text: string): Promise<void> {
        const voiceId = session.persona.voiceId;

        if (!voiceId) {
            Monitor.warning("ConversationEngineService: no voiceId for persona, sending text only", {
                personaId: session.persona.id,
            });
            // Send text-only response if no voice configured
            WsOrchestratorService.getInstance().emitAgentSpeaking(
                session.sessionId,
                session.persona.id,
                "", // empty audio chunk
                text,
            );
            WsOrchestratorService.getInstance().emitAgentFinished(session.sessionId, session.persona.id);
            return;
        }

        // Detect audio tag from response text
        const audioTag = this.detectAudioTag(text);

        // Generate TTS
        const audioBuffer = await ElevenLabsService.getInstance().textToSpeech(text, voiceId, {
            modelId: "eleven_multilingual_v2",
        });

        // Send as a single base64 payload (not incremental TTS streaming yet)
        const audioBase64 = audioBuffer.toString("base64");

        WsOrchestratorService.getInstance().emitAgentSpeaking(
            session.sessionId,
            session.persona.id,
            audioBase64,
            text,
            audioTag || undefined,
        );

        WsOrchestratorService.getInstance().emitAgentFinished(session.sessionId, session.persona.id);
    }

    /**
     * Detects the first audio tag in the response text.
     * @param text The LLM response text
     * @returns The detected audio tag (e.g., "angry", "excited") or null
     */
    private detectAudioTag(text: string): string | null {
        const match = text.match(/\[(angry|excited|whispers|pause|melancholy)\]/i);
        return match ? match[1].toLowerCase() : null;
    }

    /**
     * Trims conversation history to the last N messages.
     * Always keeps the most recent messages for context.
     * @param history Full conversation history
     * @param maxMessages Maximum number of messages to keep
     */
    private trimHistory(history: ChatMessage[], maxMessages: number): ChatMessage[] {
        if (history.length <= maxMessages) {
            return history;
        }
        return history.slice(-maxMessages);
    }
}
