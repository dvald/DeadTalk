// API bindings: characters (Auto generated)

"use strict";

import { RequestErrorHandler } from "@asanrom/request-browser";
import type { RequestParams, CommonErrorHandler } from "@asanrom/request-browser";
import { getApiUrl, generateURIQuery } from "./utils";
import type { CharacterCreateResponse, CharacterCreateBody, CharacterSummary } from "./definitions";

export class ApiCharacters {
    /**
     * Method: POST
     * Path: /characters/create
     * Creates a new custom historical character.
     * Researches the figure via Firecrawl, generates portrait, creates voice.
     * @param body Body parameters
     * @returns The request parameters
     */
    public static CreateCharacter(body: CharacterCreateBody): RequestParams<CharacterCreateResponse, CommonErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/characters/create` + generateURIQuery({ _time: Date.now() })),
            json: body,
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /characters
     * Lists all custom characters.
     * @returns The request parameters
     */
    public static ListCharacters(): RequestParams<CharacterSummary[], CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/characters` + generateURIQuery({ _time: Date.now() })),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /characters/{id}
     * Gets a specific custom character by ID.
     * @param id Character ID
     * @returns The request parameters
     */
    public static GetCharacter(id: string): RequestParams<CharacterCreateResponse, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/characters/${encodeURIComponent(id)}` + generateURIQuery({ _time: Date.now() })),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }
}

