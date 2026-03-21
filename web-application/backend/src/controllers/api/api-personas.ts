// Personas API controller

"use strict";

import Express from "express";
import { noCache, NOT_FOUND, sendApiError, sendApiResult } from "../../utils/http-utils";
import { Controller } from "../controller";
import { PersonasConfig } from "../../config/personas";

/**
 * @typedef PersonaSummary
 * @property {string} id - Persona slug identifier
 * @property {string} name - Display name
 * @property {string} era - Birth-death years
 * @property {string} nationality - Nationality
 * @property {string} profession - Profession / title
 * @property {string} avatar - Avatar image path
 * @property {string} firstMessage - Greeting message (English)
 * @property {string} firstMessageEs - Greeting message (Spanish)
 */

/**
 * @typedef PersonaEmotionalTrigger
 * @property {string} emotion - Emotional mode (e.g. "angry")
 * @property {string} trigger - Trigger context for that emotion
 */

/**
 * @typedef PersonaDetail
 * @property {string} id - Persona slug identifier
 * @property {string} name - Display name
 * @property {string} era - Birth-death years
 * @property {string} nationality - Nationality
 * @property {string} profession - Profession / title
 * @property {string} avatar - Avatar image path
 * @property {string} firstMessage - Greeting message (English)
 * @property {string} firstMessageEs - Greeting message (Spanish)
 * @property {Array.<PersonaEmotionalTrigger>} emotionalProfile - Emotional triggers
 * @property {Array.<string>} searchKeywords - Search context keywords
 */

/**
 * @typedef PersonaNotFoundError
 * @property {string} code.required - Error code:
 *  - PERSONA_NOT_FOUND: Persona was not found
 */

/**
 * Personas API — public endpoints for listing and retrieving historical figure definitions.
 * @group personas - Historical Personas
 */
export class PersonasController extends Controller {
    public registerAPI(prefix: string, application: Express.Express): any {
        application.get(prefix + "/personas", noCache(this.listPersonas.bind(this)));
        application.get(prefix + "/personas/:id", noCache(this.getPersona.bind(this)));
    }

    /**
     * Lists all available personas
     * Binding: ListPersonas
     * @route GET /personas
     * @group personas
     * @returns {Array.<PersonaSummary>} 200 - List of personas
     */
    public async listPersonas(request: Express.Request, response: Express.Response) {
        const personas = PersonasConfig.getInstance().listPersonas();
        sendApiResult(request, response, personas);
    }

    /**
     * Gets a specific persona by ID
     * Binding: GetPersona
     * @route GET /personas/{id}
     * @group personas
     * @param {string} id.path.required - Persona slug (e.g., "tesla")
     * @returns {PersonaDetail.model} 200 - Persona details
     * @returns {PersonaNotFoundError.model} 404 - Not found
     */
    public async getPersona(request: Express.Request, response: Express.Response) {
        const id = request.params.id || "";
        const persona = PersonasConfig.getInstance().getPersonaById(id);

        if (!persona) {
            sendApiError(request, response, NOT_FOUND, "PERSONA_NOT_FOUND", "Persona not found: " + id);
            return;
        }

        // Return public fields only (no system prompt)
        sendApiResult(request, response, {
            id: persona.id,
            name: persona.name,
            era: persona.era,
            nationality: persona.nationality,
            profession: persona.profession,
            avatar: persona.avatar,
            firstMessage: persona.firstMessage,
            firstMessageEs: persona.firstMessageEs,
            emotionalProfile: persona.emotionalProfile,
            searchKeywords: persona.searchKeywords,
        });
    }
}
