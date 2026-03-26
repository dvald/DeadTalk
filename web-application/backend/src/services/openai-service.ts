// OpenAI service — LLM orchestrator with tool calling

"use strict";

import OpenAI from "openai";
import { OpenAIConfig } from "../config/config-openai";
import { Monitor } from "../monitor";

/**
 * Chat message in conversation history
 */
export interface ChatMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    toolCallId?: string;
    name?: string;
    toolCalls?: Array<{
        id: string;
        type: "function";
        function: {
            name: string;
            arguments: string;
        };
    }>;
}

/**
 * Tool definition for function calling
 */
export interface ToolDefinition {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: Record<string, any>;
    };
}

/**
 * Parsed tool call from the LLM
 */
export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, any>;
}

/**
 * Result from a chat completion (before tool resolution)
 */
export interface ChatResult {
    response: string | null;
    toolCalls: ToolCall[];
    finishReason: string;
}

export class OpenAIService {
    /* Singleton */

    public static instance: OpenAIService = null;

    public static getInstance(): OpenAIService {
        if (OpenAIService.instance) {
            return OpenAIService.instance;
        } else {
            OpenAIService.instance = new OpenAIService();
            return OpenAIService.instance;
        }
    }

    private client: OpenAI;
    private model: string;
    private maxTokens: number;

    constructor() {
        const config = OpenAIConfig.getInstance();
        this.client = new OpenAI({ apiKey: config.apiKey });
        this.model = config.model;
        this.maxTokens = config.maxTokens;
    }

    /**
     * Sends a chat completion request to OpenAI with optional tool definitions.
     * Does NOT auto-resolve tool calls — the caller must handle them and call again.
     * @param messages Full message array (system + history + user)
     * @param tools Optional tool definitions for function calling
     * @returns The LLM's response text and/or tool calls
     */
    public async chat(messages: ChatMessage[], tools?: ToolDefinition[], toolChoice?: string): Promise<ChatResult> {
        Monitor.debug("OpenAIService.chat", { messageCount: messages.length, hasTools: !!tools });

        try {
            const params: any = {
                model: this.model,
                max_tokens: this.maxTokens,
                messages: messages.map((m) => {
                    const msg: any = { role: m.role, content: m.content };
                    if (m.toolCallId) {
                        msg.tool_call_id = m.toolCallId;
                    }
                    if (m.toolCalls && m.toolCalls.length > 0) {
                        msg.tool_calls = m.toolCalls;
                    }
                    if (m.name && m.role !== "tool") {
                        msg.name = m.name;
                    }
                    return msg;
                }),
            };

            if (tools && tools.length > 0) {
                params.tools = tools;
                params.tool_choice = toolChoice || "auto";
            }

            const completion = await this.client.chat.completions.create(params);
            const choice = completion.choices[0];

            if (!choice) {
                Monitor.warning("OpenAIService.chat: no choices returned");
                return { response: null, toolCalls: [], finishReason: "unknown" };
            }

            const result: ChatResult = {
                response: choice.message.content || null,
                toolCalls: [],
                finishReason: choice.finish_reason || "stop",
            };

            // Parse tool calls if present
            if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
                for (const tc of choice.message.tool_calls) {
                    if (tc.type === "function") {
                        let args: Record<string, any> = {};
                        try {
                            args = JSON.parse(tc.function.arguments);
                        } catch (ex) {
                            Monitor.warning("OpenAIService.chat: failed to parse tool call arguments", {
                                name: tc.function.name,
                                raw: tc.function.arguments,
                            });
                        }
                        result.toolCalls.push({
                            id: tc.id,
                            name: tc.function.name,
                            arguments: args,
                        });
                    }
                }
            }

            Monitor.debug("OpenAIService.chat completed", {
                finishReason: result.finishReason,
                hasResponse: !!result.response,
                toolCallCount: result.toolCalls.length,
            });

            return result;
        } catch (err) {
            Monitor.exception(err, "OpenAIService.chat failed");
            throw Object.assign(new Error("OpenAI request failed: " + (err as Error).message), { code: "OPENAI_ERROR" });
        }
    }

    /**
     * High-level method: chat with automatic tool call resolution.
     * Calls the LLM, if it returns tool calls, executes the provided resolver,
     * feeds results back, and returns the final text response.
     *
     * @param messages Full message array
     * @param tools Tool definitions
     * @param toolResolver Function that resolves a tool call and returns a string result
     * @param maxRounds Maximum number of tool-call resolution rounds (default 3)
     * @returns The final text response from the LLM
     */
    public async chatWithToolResolution(
        messages: ChatMessage[],
        tools: ToolDefinition[],
        toolResolver: (toolCall: ToolCall) => Promise<string>,
        maxRounds?: number,
        toolChoice?: string,
    ): Promise<{ response: string; resolvedToolCalls: ToolCall[] }> {
        const rounds = maxRounds || 3;
        const allMessages = [...messages];
        const resolvedToolCalls: ToolCall[] = [];

        for (let round = 0; round < rounds; round++) {
            // Only force tool_choice on the first round; subsequent rounds use "auto"
            const choice = round === 0 ? toolChoice : undefined;
            const result = await this.chat(allMessages, tools, choice);

            // If no tool calls, return the response
            if (result.toolCalls.length === 0) {
                return {
                    response: result.response || "",
                    resolvedToolCalls: resolvedToolCalls,
                };
            }

            // Add the assistant message with tool calls to history
            const assistantMsg: ChatMessage = {
                role: "assistant",
                content: result.response || null,
                toolCalls: result.toolCalls.map((tc) => ({
                    id: tc.id,
                    type: "function",
                    function: {
                        name: tc.name,
                        arguments: JSON.stringify(tc.arguments),
                    },
                })),
            };
            allMessages.push(assistantMsg);

            // Resolve each tool call
            for (const tc of result.toolCalls) {
                Monitor.debug("OpenAIService.chatWithToolResolution: resolving tool", { name: tc.name, round });
                try {
                    const toolResult = await toolResolver(tc);
                    allMessages.push({
                        role: "tool",
                        content: toolResult,
                        toolCallId: tc.id,
                    });
                    resolvedToolCalls.push(tc);
                } catch (err) {
                    Monitor.exception(err, "OpenAIService: tool resolution failed for " + tc.name);
                    allMessages.push({
                        role: "tool",
                        content: JSON.stringify({ error: "Tool execution failed: " + (err as Error).message }),
                        toolCallId: tc.id,
                    });
                }
            }
        }

        // If we exhausted rounds, do one final call without tools
        const finalResult = await this.chat(allMessages);
        return {
            response: finalResult.response || "",
            resolvedToolCalls: resolvedToolCalls,
        };
    }
}
