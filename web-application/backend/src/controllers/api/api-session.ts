// Session API controller

"use strict";

import Express from "express";
import { noCache, sendApiError, sendApiResult } from "../../utils/http-utils";
import { Controller } from "../controller";
import { OpenAIService } from "../../services/openai-service";
import { Monitor } from "../../monitor";

/**
 * @typedef GenerateQuoteRequest
 * @property {string} personaName.required - Name of the historical figure
 * @property {Array.<ConversationEntry>} transcript.required - Full conversation transcript
 */

/**
 * @typedef ConversationEntry
 * @property {string} role.required - "user" or "agent"
 * @property {string} text.required - Message text
 * @property {number} timestamp - Unix timestamp in ms
 */

/**
 * @typedef GenerateQuoteResponse
 * @property {string} quote - The generated memorable quote
 */

/**
 * @typedef GenerateQuoteError
 * @property {string} code.required - Error code:
 *  - INVALID_INPUT: Missing or invalid input
 *  - GENERATION_FAILED: LLM failed to generate quote
 */

/**
 * Session API — endpoints for session-related operations.
 * @group session - Session Operations
 */
export class SessionController extends Controller {
    public registerAPI(prefix: string, application: Express.Express): any {
        application.post(prefix + "/session/generate-quote", noCache(this.generateQuote.bind(this)));
    }

    /**
     * Generates a memorable quote from the conversation transcript using LLM.
     * Takes the full conversation and distills it into a single evocative line
     * that captures the essence of the exchange with the historical figure.
     * Binding: GenerateQuote
     * @route POST /session/generate-quote
     * @group session
     * @param {GenerateQuoteRequest.model} request.body.required - Transcript and persona info
     * @returns {GenerateQuoteResponse.model} 200 - Generated quote
     * @returns {GenerateQuoteError.model} 400 - Invalid input
     * @returns {GenerateQuoteError.model} 500 - Generation failed (GENERATION_FAILED)
     */
    public async generateQuote(req: Express.Request, res: Express.Response) {
        const { personaName, transcript } = req.body;

        if (!personaName || typeof personaName !== "string") {
            return sendApiError(req, res, 400, "INVALID_INPUT");
        }
        if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
            return sendApiError(req, res, 400, "INVALID_INPUT");
        }

        // Validate each transcript entry has required shape
        for (const entry of transcript) {
            if (!entry || typeof entry.role !== "string" || typeof entry.text !== "string") {
                return sendApiError(req, res, 400, "INVALID_INPUT");
            }
        }

        try {
            const openai = OpenAIService.getInstance();

            // Build conversation text for context
            const conversationText = transcript
                .map((entry: { role: string; text: string }) => {
                    const speaker = entry.role === "agent" ? personaName : "User";
                    // Clean audio tags
                    const cleanText = entry.text.replace(/\[[^\]]*\]/g, "").replace(/\s{2,}/g, " ").trim();
                    return `${speaker}: ${cleanText}`;
                })
                .join("\n");

            const result = await openai.chat([
                {
                    role: "system",
                    content: `You are a literary curator distilling a séance conversation with ${personaName} into a single memorable quote.

Rules:
- Extract or synthesize ONE evocative sentence (max 25 words) that captures the most profound, surprising, or emotionally resonant moment from the conversation.
- It should sound like something ${personaName} would actually say — match their historical voice, era, and intellectual style.
- Prefer poetic or philosophical phrasing over literal summaries.
- Do NOT use quotation marks in your response.
- Do NOT add attribution or explanation — just the quote itself.
- Write in the same language the conversation was held in.`,
                },
                {
                    role: "user",
                    content: `Here is the full conversation transcript:\n\n${conversationText}\n\nDistill this into a single memorable quote from ${personaName}.`,
                },
            ]);

            const quote = result.response?.trim() || "";

            if (!quote) {
                Monitor.warning("SessionController.generateQuote: empty response from LLM");
                return sendApiError(req, res, 500, "GENERATION_FAILED");
            }

            return sendApiResult(req, res, { quote });
        } catch (err) {
            Monitor.exception(err, "SessionController.generateQuote failed");
            return sendApiError(req, res, 500, "GENERATION_FAILED");
        }
    }
}
