// Characters API controller — custom character creation

"use strict";

import Express from "express";
import { noCache, NOT_FOUND, sendApiError, sendApiResult } from "../../utils/http-utils";
import { Controller } from "../controller";
import { CharacterCreationService } from "../../services/character-creation-service";
import { Monitor } from "../../monitor";

/**
 * @typedef CharacterCreateBody
 * @property {string} name.required - Historical figure name
 * @property {string} hints - Optional hints (era, profession, etc.)
 * @property {string} photoBase64 - Optional base64 portrait image
 */

/**
 * @typedef CharacterSummary
 * @property {string} id - Persona slug identifier
 * @property {string} name - Display name
 * @property {string} era - Birth-death years
 * @property {string} profession - Profession / title
 * @property {string} image - Portrait image (data URL or empty)
 * @property {string} voiceSource - How the voice was created (cloned, designed, default)
 * @property {boolean} isCustom - Always true for custom characters
 */

/**
 * Characters API — endpoints for creating and managing custom historical characters.
 * Binding: CharacterCreateBody
 * @group characters - Custom Characters
 */
export class CharactersController extends Controller {
    public registerAPI(prefix: string, application: Express.Express): any {
        application.post(prefix + "/characters/create", noCache(this.createCharacter.bind(this)));
        application.get(prefix + "/characters", noCache(this.listCharacters.bind(this)));
        application.get(prefix + "/characters/:id", noCache(this.getCharacter.bind(this)));
    }

    /**
     * Creates a new custom historical character.
     * Researches the figure via Firecrawl, generates portrait, creates voice.
     * Binding: CharacterCreateBody
     * @route POST /characters/create
     * @group characters
     * @param {CharacterCreateBody.model} request.body.required - Character creation request
     * @returns {CharacterSummary.model} 200 - Created character
     */
    private async createCharacter(request: Express.Request, response: Express.Response) {
        const { name, hints, photoBase64 } = request.body || {};

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return sendApiError(request, response, 400, "INVALID_NAME", "Name is required");
        }

        try {
            const persona = await CharacterCreationService.getInstance().createCharacter(
                name.trim(),
                hints?.trim(),
                photoBase64,
            );

            sendApiResult(request, response, {
                id: persona.id,
                name: persona.name,
                era: persona.era,
                nationality: persona.nationality,
                profession: persona.profession,
                image: persona.image,
                voiceSource: persona.voiceSource,
                voiceId: persona.voiceId,
                firstMessage: persona.firstMessage,
                firstMessageEs: persona.firstMessageEs,
                quote: persona.quote,
                isCustom: true,
            });
        } catch (err) {
            Monitor.exception(err, "CharactersController.createCharacter failed");
            sendApiError(request, response, 500, "CREATE_FAILED", "Character creation failed: " + (err as Error).message);
        }
    }

    /**
     * Lists all custom characters.
     * @route GET /characters
     * @group characters
     * @returns {Array.<CharacterSummary>} 200 - List of custom characters
     */
    private async listCharacters(request: Express.Request, response: Express.Response) {
        const personas = await CharacterCreationService.getInstance().listCustomPersonas();

        sendApiResult(request, response, personas.map(p => ({
            id: p.id,
            name: p.name,
            era: p.era,
            profession: p.profession,
            image: p.image,
            voiceSource: p.voiceSource,
            isCustom: true,
        })));
    }

    /**
     * Gets a specific custom character by ID.
     * @route GET /characters/:id
     * @group characters
     * @param {string} id.path.required - Character ID
     * @returns {CharacterSummary.model} 200 - Character details
     */
    private async getCharacter(request: Express.Request, response: Express.Response) {
        const id = request.params.id;
        const persona = await CharacterCreationService.getInstance().getCustomPersona(id);

        if (!persona) {
            return sendApiError(request, response, NOT_FOUND, "CHARACTER_NOT_FOUND", "Character not found");
        }

        sendApiResult(request, response, {
            id: persona.id,
            name: persona.name,
            era: persona.era,
            nationality: persona.nationality,
            profession: persona.profession,
            image: persona.image,
            voiceSource: persona.voiceSource,
            voiceId: persona.voiceId,
            firstMessage: persona.firstMessage,
            firstMessageEs: persona.firstMessageEs,
            quote: persona.quote,
            emotionalProfile: persona.emotionalProfile,
            searchKeywords: persona.searchKeywords,
            isCustom: true,
        });
    }
}
