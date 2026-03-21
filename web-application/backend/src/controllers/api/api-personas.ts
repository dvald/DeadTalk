// Personas API controller

"use strict";

import Express from "express";
import { noCache, NOT_FOUND, sendApiResult } from "../../utils/http-utils";
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
 * @property {string} firstMessage - Greeting message
 */

/**
 * @typedef PersonaDetail
 * @property {string} id - Persona slug identifier
 * @property {string} name - Display name
 * @property {string} era - Birth-death years
 * @property {string} nationality - Nationality
 * @property {string} profession - Profession / title
 * @property {string} avatar - Avatar image path
 * @property {string} firstMessage - Greeting message
 * @property {Array} emotionalProfile - Emotional triggers
 * @property {Array} searchKeywords - Search context keywords
 */

/**
 * Personas API — public endpoints for listing and retrieving historical figure definitions.
 * @group personas - Historical Personas
 */
export class PersonasController extends Controller {
    public registerAPI(prefix: string, application: Express.Express): any {
        /**
         * Lists all available personas
         * Binding: ListPersonas
         * @route GET /personas
         * @group personas
         * @returns {Array.<PersonaSummary>} 200 - List of personas
         */
        application.get(prefix + "/personas", noCache(this.listPersonas.bind(this)));

        /**
         * Gets a specific persona by ID
         * Binding: GetPersona
         * @route GET /personas/:id
         * @group personas
         * @param {string} id.path.required - Persona slug (e.g., "tesla")
         * @returns {PersonaDetail.model} 200 - Persona details
         * @returns {ErrorResponse.model} 404 - Not found
         */
        application.get(prefix + "/personas/:id", noCache(this.getPersona.bind(this)));
    }

    public async listPersonas(request: Express.Request, response: Express.Response) {
        const personas = PersonasConfig.getInstance().listPersonas();
        sendApiResult(request, response, personas);
    }

    public async getPersona(request: Express.Request, response: Express.Response) {
        const id = request.params.id || "";
        const persona = PersonasConfig.getInstance().getPersonaById(id);

        if (!persona) {
            response.status(NOT_FOUND);
            response.json({ result: "error", code: "PERSONA_NOT_FOUND", message: "Persona not found: " + id });
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
            emotionalProfile: persona.emotionalProfile,
            searchKeywords: persona.searchKeywords,
        });
    }
}
