// API tests

"use strict";

import assert from "assert";
import type { RequestParams } from "@asanrom/request-axios";
import { APITester } from "../test-tools/api-tester";
import { APIAuthentication } from "../test-tools/authentication";
import { getApiUrl } from "../test-tools/api-bindings/utils";

interface PersonaSummary {
    id: string;
    name: string;
    era: string;
    nationality: string;
    profession: string;
    avatar: string;
    firstMessage: string;
}

interface PersonaEmotionalTrigger {
    emotion: string;
    trigger: string;
}

interface PersonaDetail extends PersonaSummary {
    emotionalProfile: PersonaEmotionalTrigger[];
    searchKeywords: string[];
}

function listPersonasRequest(): RequestParams<PersonaSummary[]> {
    return {
        method: "GET",
        url: getApiUrl("/personas"),
    };
}

function getPersonaRequest(id: string): RequestParams<PersonaDetail> {
    return {
        method: "GET",
        url: getApiUrl("/personas/" + encodeURIComponent(id)),
    };
}

describe("API / Personas", () => {
    before(async () => {
        await APITester.Initialize();
    });

    it("Should list available personas", async () => {
        const personas = await APITester.Test(listPersonasRequest(), APIAuthentication.Unauthenticated());

        assert.ok(Array.isArray(personas));
        assert.ok(personas.length > 0);

        const first = personas[0];
        assert.ok(first.id);
        assert.ok(first.name);
        assert.ok(first.era);
        assert.ok(first.profession);
    });

    it("Should get a persona by id", async () => {
        const personas = await APITester.Test(listPersonasRequest(), APIAuthentication.Unauthenticated());
        const id = personas[0].id;

        const persona = await APITester.Test(getPersonaRequest(id), APIAuthentication.Unauthenticated());

        assert.equal(persona.id, id);
        assert.ok(Array.isArray(persona.emotionalProfile));
        assert.ok(Array.isArray(persona.searchKeywords));
    });

    it("Should return PERSONA_NOT_FOUND for unknown persona id", async () => {
        const unknownId = "persona-does-not-exist-" + Date.now();
        await APITester.TestError(
            getPersonaRequest(unknownId),
            APIAuthentication.Unauthenticated(),
            404,
            "PERSONA_NOT_FOUND",
        );
    });
});

