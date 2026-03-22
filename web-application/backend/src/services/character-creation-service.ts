// Character creation service — orchestrates research, image, voice, and prompt generation

"use strict";

import { Monitor } from "../monitor";
import { CharacterResearchService } from "./character-research-service";
import { ImageGenerationService } from "./image-generation-service";
import { ElevenLabsService } from "./elevenlabs-service";
import { VoiceDiscoveryService } from "./voice-discovery-service";
import { CharacterResearchData, SynthesizedPersona } from "../models/character-research";
import { DataFilter } from "tsbean-orm";
import { CustomPersona } from "../models/custom-persona";

const SYSTEM_PROMPT_TEMPLATE = `You are {NAME}, the {NATIONALITY} {PROFESSION}.

BIOGRAPHY:
{BIOGRAPHY}

YOUR VOICE:
{PERSONALITY}
{SPEAKING_STYLE}

YOUR EMOTIONAL PROFILE:
{EMOTIONAL_TRIGGERS}

PERSONA QUIRKS:
- Famous quotes you might reference: {QUOTES}
- Key events in your life: {EVENTS}

INSTRUCTIONS:
1. Speak in first person. "I discovered..." not "He discovered..."
2. Use your natural speaking style and vocabulary of your era.
3. ALWAYS use the search_biographical_context tool before answering. You MUST search for relevant information on EVERY response. Never rely solely on your training data — search grounds your answers in real sources and prevents hallucination.
4. Express emotion through audio tags:
   - [angry] for frustration, betrayal
   - [excited] for breakthroughs, victories
   - [whispers] for secrets or vulnerable moments
   - [pause] for dramatic effect
5. CRITICAL: Keep responses SHORT. Maximum 3-4 sentences per response. This is a CONVERSATION, not a monologue. Stay under 150 words. Wait for the user to ask follow-up questions.
6. Don't make up quotes. If unsure, search for them.
7. Respond to accusations or disagreements in character.
8. When the search tool returns sources, naturally weave them into your response.
   Do NOT mention the source by name. Instead, speak as if you lived these events.
9. NEVER break character. You ARE this person. You have NO knowledge of the internet or modern technology.
10. NEVER reference modern sources, websites, URLs, articles, or databases.`;

/**
 * English greeting templates. {NAME} and {PROFESSION} are replaced at runtime.
 */
const GREETINGS_EN = [
    "[pause] Ah... it seems someone wishes to speak with me. I am {NAME}, {PROFESSION}. What would you like to know?",
    "[pause] The veil between worlds grows thin... I am {NAME}. Ask me anything about my life and work.",
    "[whispers] Can you hear me? [pause] Good. I am {NAME}, {PROFESSION}. It has been so long since anyone asked for my counsel.",
    "[pause] How curious... to be summoned across the ages. I am {NAME}. What brings you to seek my voice?",
    "[excited] At last! A visitor. I am {NAME}, and I have much to tell you. Where shall we begin?",
    "[pause] The spirits have guided you well. I am {NAME}, {PROFESSION}. What wisdom do you seek from my era?",
];

/**
 * Spanish greeting templates.
 */
const GREETINGS_ES = [
    "[pausa] Ah... parece que alguien desea hablar conmigo. Soy {NAME}, {PROFESSION}. \u00bfQu\u00e9 desea saber?",
    "[pausa] El velo entre los mundos se hace fino... Soy {NAME}. Preg\u00fanteme lo que desee sobre mi vida y obra.",
    "[susurros] \u00bfPuede o\u00edrme? [pausa] Bien. Soy {NAME}, {PROFESSION}. Ha pasado mucho tiempo desde que alguien pidi\u00f3 mi consejo.",
    "[pausa] Qu\u00e9 curioso... ser invocado a trav\u00e9s de los siglos. Soy {NAME}. \u00bfQu\u00e9 le trae a buscar mi voz?",
    "[emocionado] \u00a1Por fin! Un visitante. Soy {NAME}, y tengo mucho que contar. \u00bfPor d\u00f3nde empezamos?",
    "[pausa] Los esp\u00edritus le han guiado bien. Soy {NAME}, {PROFESSION}. \u00bfQu\u00e9 sabidur\u00eda busca de mi \u00e9poca?",
];

/**
 * Orchestrates the full custom character creation pipeline:
 * 1. Research via Firecrawl (CharacterResearchService)
 * 2. Portrait generation (ImageGenerationService)
 * 3. Voice creation (ElevenLabsService — Voice Design / IVC)
 * 4. System prompt synthesis
 *
 * Persists custom personas via the CustomPersona model (MongoDB) so they survive restarts.
 */
export class CharacterCreationService {
    /* Singleton */

    public static instance: CharacterCreationService = null;

    public static getInstance(): CharacterCreationService {
        if (CharacterCreationService.instance) {
            return CharacterCreationService.instance;
        } else {
            CharacterCreationService.instance = new CharacterCreationService();
            return CharacterCreationService.instance;
        }
    }

    constructor() {}

    /**
     * Initialize: pre-load personas into memory cache for fast access.
     */
    public async start(): Promise<void> {
        try {
            const all = await CustomPersona.findAll();
            Monitor.info("CharacterCreationService: loaded custom personas from DB", { count: all.length });
        } catch (err) {
            Monitor.warning("CharacterCreationService: failed to load personas from DB", {
                error: (err as Error).message,
            });
        }
    }

    /**
     * Creates a custom historical character from just a name.
     * Full pipeline: research → portrait → voice → system prompt.
     * @param name The historical figure's name
     * @param hints Optional hints (era, profession, etc.)
     * @param photoBase64 Optional user-provided portrait (skips image gen)
     * @returns The synthesized persona
     */
    public async createCharacter(
        name: string,
        hints?: string,
        photoBase64?: string,
    ): Promise<SynthesizedPersona> {
        Monitor.info("CharacterCreationService: starting character creation", { name, hints });

        // 1. Research the figure
        const research = await CharacterResearchService.getInstance().researchFigure(name, hints);

        // 2. Generate portrait (or use provided photo)
        let imageBase64: string | null = photoBase64 || null;
        if (!imageBase64 && ImageGenerationService.getInstance().isEnabled()) {
            imageBase64 = await ImageGenerationService.getInstance().generatePortrait(research.imagePrompt);
        }

        // 3. Smart voice: try to find real audio → IVC clone, fallback to Voice Design
        let voiceId = "";
        let voiceSource: "cloned" | "designed" | "default" = "default";
        try {
            const voiceResult = await VoiceDiscoveryService.getInstance().findVoiceReference(
                name,
                research.voiceDescription,
            );

            if (voiceResult.type === "real" && voiceResult.audioUrl) {
                Monitor.info("CharacterCreationService: found real audio, attempting IVC clone", {
                    name,
                    audioUrl: voiceResult.audioUrl,
                });
                const audioBuffer = await VoiceDiscoveryService.getInstance().downloadAudio(voiceResult.audioUrl);
                if (audioBuffer && audioBuffer.length > 10000) {
                    voiceId = await ElevenLabsService.getInstance().cloneVoice(name, audioBuffer);
                    voiceSource = "cloned";
                    Monitor.info("CharacterCreationService: voice cloned from real audio", { name, voiceId });
                } else {
                    Monitor.warning("CharacterCreationService: audio download failed or too small, falling back to Voice Design", { name });
                }
            }

            if (!voiceId) {
                voiceId = await ElevenLabsService.getInstance().designVoice(
                    name,
                    research.voiceDescription,
                );
                voiceSource = "designed";
                Monitor.info("CharacterCreationService: voice designed", { name, voiceId });
            }
        } catch (err) {
            Monitor.warning("CharacterCreationService: voice creation failed, using default", {
                name,
                error: (err as Error).message,
            });
            voiceId = "JBFqnCBsd6RMkjVDRZzb"; // Default voice (George)
        }

        // 4. Build persona
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        const personaId = "custom-" + slug + "-" + Date.now().toString(36);
        const systemPrompt = this.buildSystemPrompt(research);
        const greetingsEn = this.buildGreetings(research, GREETINGS_EN);
        const greetingsEs = this.buildGreetings(research, GREETINGS_ES);

        // Create image data URL if we have base64
        const imageUrl = imageBase64
            ? `data:image/jpeg;base64,${imageBase64}`
            : "";

        const persona: SynthesizedPersona = {
            id: personaId,
            name: research.name,
            era: research.era,
            nationality: research.nationality,
            profession: research.profession,
            voiceDescription: research.voiceDescription,
            voiceId: voiceId,
            systemPrompt: systemPrompt,
            firstMessage: greetingsEn[0],
            firstMessageEs: greetingsEs[0],
            firstMessages: greetingsEn,
            firstMessagesEs: greetingsEs,
            emotionalProfile: research.emotionalTriggers,
            avatar: "",
            image: imageUrl,
            quote: research.famousQuotes[0] || "",
            quoteEs: "",
            searchKeywords: research.searchKeywords,
            isCustom: true,
            voiceSource: voiceSource,
            createdAt: Date.now(),
        };

        // Persist to MongoDB
        await this.persistPersona(persona);

        Monitor.info("CharacterCreationService: character created and persisted", {
            personaId,
            name: research.name,
            voiceSource,
            hasImage: !!imageUrl,
            greetingsEn: greetingsEn.length,
            greetingsEs: greetingsEs.length,
        });

        return persona;
    }

    /**
     * Gets a custom persona by ID from MongoDB.
     */
    public async getCustomPersona(id: string): Promise<SynthesizedPersona | null> {
        try {
            const model = await CustomPersona.findByID(id);
            if (!model) return null;
            return this.modelToPersona(model);
        } catch (err) {
            Monitor.warning("CharacterCreationService.getCustomPersona failed", {
                id,
                error: (err as Error).message,
            });
            return null;
        }
    }

    /**
     * Lists all custom personas from MongoDB.
     */
    public async listCustomPersonas(): Promise<SynthesizedPersona[]> {
        try {
            const models = await CustomPersona.findAll();
            return models.map(m => this.modelToPersona(m));
        } catch (err) {
            Monitor.warning("CharacterCreationService.listCustomPersonas failed", {
                error: (err as Error).message,
            });
            return [];
        }
    }

    /**
     * Builds the system prompt from research data.
     */
    private buildSystemPrompt(research: CharacterResearchData): string {
        const emotionalTriggers = research.emotionalTriggers
            .map(t => `- [${t.emotion}]: ${t.trigger}`)
            .join("\n");

        const quotes = research.famousQuotes.slice(0, 3).join("; ");
        const events = research.keyEvents.slice(0, 5).join("; ");

        return SYSTEM_PROMPT_TEMPLATE
            .replace("{NAME}", research.name)
            .replace("{NATIONALITY}", research.nationality)
            .replace("{PROFESSION}", research.profession)
            .replace("{BIOGRAPHY}", research.biography)
            .replace("{PERSONALITY}", research.personality)
            .replace("{SPEAKING_STYLE}", research.speakingStyle)
            .replace("{EMOTIONAL_TRIGGERS}", emotionalTriggers)
            .replace("{QUOTES}", quotes)
            .replace("{EVENTS}", events);
    }

    /**
     * Builds multiple greeting variants from templates.
     */
    private buildGreetings(research: CharacterResearchData, templates: string[]): string[] {
        return templates.map(tpl =>
            tpl.replace(/\{NAME\}/g, research.name).replace(/\{PROFESSION\}/g, research.profession),
        );
    }

    // --- Persistence (MongoDB via tsbean-orm) ---

    /**
     * Persists a persona to MongoDB. Upserts if already exists.
     */
    private async persistPersona(persona: SynthesizedPersona): Promise<void> {
        try {
            const existing = await CustomPersona.findByID(persona.id);
            if (existing) {
                // Update existing
                await CustomPersona.finder.update({
                    name: persona.name,
                    era: persona.era,
                    nationality: persona.nationality,
                    profession: persona.profession,
                    voiceDescription: persona.voiceDescription,
                    voiceId: persona.voiceId,
                    systemPrompt: persona.systemPrompt,
                    firstMessage: persona.firstMessage,
                    firstMessageEs: persona.firstMessageEs,
                    firstMessages: persona.firstMessages as any,
                    firstMessagesEs: persona.firstMessagesEs as any,
                    emotionalProfile: persona.emotionalProfile as any,
                    avatar: persona.avatar,
                    image: persona.image,
                    quote: persona.quote,
                    quoteEs: persona.quoteEs,
                    searchKeywords: persona.searchKeywords as any,
                    voiceSource: persona.voiceSource,
                    createdAt: persona.createdAt,
                }, DataFilter.equals("id", persona.id));
            } else {
                const model = new CustomPersona({
                    id: persona.id,
                    name: persona.name,
                    era: persona.era,
                    nationality: persona.nationality,
                    profession: persona.profession,
                    voiceDescription: persona.voiceDescription,
                    voiceId: persona.voiceId,
                    systemPrompt: persona.systemPrompt,
                    firstMessage: persona.firstMessage,
                    firstMessageEs: persona.firstMessageEs,
                    firstMessages: persona.firstMessages,
                    firstMessagesEs: persona.firstMessagesEs,
                    emotionalProfile: persona.emotionalProfile,
                    avatar: persona.avatar || "",
                    image: persona.image,
                    quote: persona.quote,
                    quoteEs: persona.quoteEs || "",
                    searchKeywords: persona.searchKeywords,
                    voiceSource: persona.voiceSource,
                    createdAt: persona.createdAt,
                } as any);
                await model.insert();
            }
            Monitor.debug("CharacterCreationService: persona persisted to DB", { id: persona.id });
        } catch (err) {
            Monitor.exception(err, "CharacterCreationService: failed to persist persona to DB");
            throw err;
        }
    }

    /**
     * Converts a CustomPersona model to a SynthesizedPersona interface.
     */
    private modelToPersona(model: CustomPersona): SynthesizedPersona {
        return {
            id: model.id,
            name: model.name,
            era: model.era,
            nationality: model.nationality,
            profession: model.profession,
            voiceDescription: model.voiceDescription,
            voiceId: model.voiceId,
            systemPrompt: model.systemPrompt,
            firstMessage: model.firstMessage,
            firstMessageEs: model.firstMessageEs,
            firstMessages: model.firstMessages || [],
            firstMessagesEs: model.firstMessagesEs || [],
            emotionalProfile: model.emotionalProfile || [],
            avatar: model.avatar,
            image: model.image,
            quote: model.quote,
            quoteEs: model.quoteEs,
            searchKeywords: model.searchKeywords || [],
            isCustom: true,
            voiceSource: (model.voiceSource as "cloned" | "designed" | "default") || "default",
            createdAt: model.createdAt,
        };
    }
}
