// API bindings: personas (Auto generated)

"use strict";

import { RequestErrorHandler } from "@asanrom/request-browser";
import type { RequestParams, CommonErrorHandler } from "@asanrom/request-browser";
import { getApiUrl, generateURIQuery } from "./utils";
import type { PersonaSummary, PersonaDetail } from "./definitions";

export class ApiPersonas {
    /**
     * Method: GET
     * Path: /personas
     * Lists all available personas
     * @returns The request parameters
     */
    public static ListPersonas(): RequestParams<PersonaSummary[], CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/personas` + generateURIQuery({ _time: Date.now() })),
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
     * Path: /personas/{id}
     * Gets a specific persona by ID
     * @param id Persona slug (e.g., "tesla")
     * @returns The request parameters
     */
    public static GetPersona(id: string): RequestParams<PersonaDetail, GetPersonaErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/personas/${encodeURIComponent(id)}` + generateURIQuery({ _time: Date.now() })),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(404, "PERSONA_NOT_FOUND", handler.notFoundPersonaNotFound)
                    .add(404, "*", handler.notFound)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }
}

/**
 * Error handler for GetPersona
 */
export type GetPersonaErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;

    /**
     * Persona was not found
     */
    notFoundPersonaNotFound: () => void;
};

