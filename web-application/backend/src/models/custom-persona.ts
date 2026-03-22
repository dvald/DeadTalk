// Custom persona data model — tsbean-orm

"use strict";

import { DataModel, DataSource, DataFinder, DataFilter, OrderBy, SelectOptions, TypedRow, enforceType } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "custom_personas";
const PRIMARY_KEY = "id";

/**
 * Persists custom historical personas created via the character creation pipeline.
 */
export class CustomPersona extends DataModel {

    public static finder = new DataFinder<CustomPersona>(
        DATA_SOURCE,
        TABLE,
        PRIMARY_KEY,
        function (data: any) {
            return new CustomPersona(data);
        },
    );

    /**
     * Find a custom persona by ID.
     */
    public static async findByID(id: string): Promise<CustomPersona> {
        return CustomPersona.finder.findByKey(id);
    }

    /**
     * Find all custom personas.
     */
    public static async findAll(): Promise<CustomPersona[]> {
        return CustomPersona.finder.find(
            DataFilter.any(),
            OrderBy.desc("createdAt"),
        );
    }

    /* db-index-unique: id */
    public id: string;

    public name: string;

    public era: string;

    public nationality: string;

    public profession: string;

    public voiceDescription: string;

    public voiceId: string;

    /* db-type: text */
    public systemPrompt: string;

    public firstMessage: string;

    public firstMessageEs: string;

    /* db-type: text */
    public firstMessages: string[];

    /* db-type: text */
    public firstMessagesEs: string[];

    /* db-type: text */
    public emotionalProfile: Array<{ emotion: string; trigger: string }>;

    public avatar: string;

    /* db-type: mediumtext */
    public image: string;

    public quote: string;

    public quoteEs: string;

    /* db-type: text */
    public searchKeywords: string[];

    public voiceSource: string;

    /* db-type: bigint */
    public createdAt: number;

    constructor(data: TypedRow<CustomPersona>) {
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);

        this.id = data.id || "";
        this.name = enforceType(data.name, "string") || "";
        this.era = enforceType(data.era, "string") || "";
        this.nationality = enforceType(data.nationality, "string") || "";
        this.profession = enforceType(data.profession, "string") || "";
        this.voiceDescription = enforceType(data.voiceDescription, "string") || "";
        this.voiceId = enforceType(data.voiceId, "string") || "";
        this.systemPrompt = enforceType(data.systemPrompt, "string") || "";
        this.firstMessage = enforceType(data.firstMessage, "string") || "";
        this.firstMessageEs = enforceType(data.firstMessageEs, "string") || "";
        this.avatar = enforceType(data.avatar, "string") || "";
        this.image = enforceType(data.image, "string") || "";
        this.quote = enforceType(data.quote, "string") || "";
        this.quoteEs = enforceType(data.quoteEs, "string") || "";
        this.voiceSource = enforceType(data.voiceSource, "string") || "default";
        this.createdAt = enforceType(data.createdAt, "int") || 0;

        // Complex fields: arrays/objects — parse from JSON string if needed
        this.firstMessages = this.parseJsonArray(data.firstMessages, []);
        this.firstMessagesEs = this.parseJsonArray(data.firstMessagesEs, []);
        this.emotionalProfile = this.parseJsonArray(data.emotionalProfile, []);
        this.searchKeywords = this.parseJsonArray(data.searchKeywords, []);

        this.init();
    }

    /**
     * Parses a field that may be a JSON string (from DB) or already an array (from code).
     */
    private parseJsonArray<T>(value: any, fallback: T[]): T[] {
        if (Array.isArray(value)) {
            return value;
        }
        if (typeof value === "string" && value.length > 0) {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch {
                // not valid JSON
            }
        }
        return fallback;
    }
}
