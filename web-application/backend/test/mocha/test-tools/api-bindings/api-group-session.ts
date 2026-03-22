// API bindings: session (Auto generated)

"use strict";

import { RequestErrorHandler } from "@asanrom/request-axios";
import type { RequestParams, CommonErrorHandler } from "@asanrom/request-axios";
import { getApiUrl } from "./utils";
import type { GenerateQuoteResponse, GenerateQuoteRequest } from "./definitions";

export class ApiSession {
    /**
     * Method: POST
     * Path: /session/generate-quote
     * Generates a memorable quote from the conversation transcript using LLM.
     * Takes the full conversation and distills it into a single evocative line
     * that captures the essence of the exchange with the historical figure.
     * @param body Body parameters
     * @returns The request parameters
     */
    public static GenerateQuote(body: GenerateQuoteRequest): RequestParams<GenerateQuoteResponse, GenerateQuoteErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/session/generate-quote`),
            json: body,
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(500, "GENERATION_FAILED", handler.serverErrorGenerationFailed)
                    .add(500, "INVALID_INPUT", handler.serverErrorInvalidInput)
                    .add(400, "GENERATION_FAILED", handler.badRequestGenerationFailed)
                    .add(400, "INVALID_INPUT", handler.badRequestInvalidInput)
                    .add(400, "*", handler.badRequest)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }
}

/**
 * Error handler for GenerateQuote
 */
export type GenerateQuoteErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;

    /**
     * Missing or invalid input
     */
    badRequestInvalidInput: () => void;

    /**
     * LLM failed to generate quote
     */
    badRequestGenerationFailed: () => void;

    /**
     * Missing or invalid input
     */
    serverErrorInvalidInput: () => void;

    /**
     * LLM failed to generate quote
     */
    serverErrorGenerationFailed: () => void;
};

