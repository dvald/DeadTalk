<template>
    <Section class="seance-bg seance-particles min-h-[100dvh] flex flex-col px-4 py-8">
        <!-- Hero -->
        <div class="flex flex-col gap-2 items-center text-center pt-8 pb-6">
            <Heading
                :title="$t('DeadTalk')"
                :size="HeadingSize.MD"
                :align="Align.CENTER"
                class="heading-font seance-text-glow"
            />
            <p class="text-sm text-text-neutral-subtle max-w-sm">
                {{ $t("Have real voice conversations with historical figures, powered by real web sources.") }}
            </p>
        </div>

        <!-- Persona Grid -->
        <SectionBody class="w-full max-w-lg mx-auto flex-1">
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <button
                    v-for="p in personas"
                    :key="p.id"
                    class="group flex flex-col items-center gap-2 rounded-xl border border-[rgba(212,168,83,0.15)] p-4 transition-all duration-300 hover:border-[rgba(212,168,83,0.5)] hover:shadow-[0_0_20px_rgba(212,168,83,0.1)] hover:bg-background-neutral-subtle active:scale-95 cursor-pointer"
                    @click="selectPersona(p)"
                >
                    <!-- Avatar placeholder -->
                    <div
                        class="w-16 h-16 rounded-full bg-background-neutral-subtle flex items-center justify-center text-2xl font-bold text-text-neutral-subtle group-hover:bg-[#d4a853] group-hover:text-[#0a0a0f] transition-colors duration-300 heading-font"
                    >
                        {{ p.name.charAt(0) }}
                    </div>
                    <div class="text-center">
                        <p class="text-sm font-medium text-text-default leading-tight">
                            {{ p.name }}
                        </p>
                        <p class="text-xs text-text-neutral-subtle mt-0.5">
                            {{ p.era }}
                        </p>
                        <p class="text-xs text-text-neutral-subtle">
                            {{ p.profession }}
                        </p>
                    </div>
                </button>
            </div>

            <!-- Loading state -->
            <div
                v-if="isLoading"
                class="flex items-center justify-center py-12"
            >
                <p class="text-sm text-text-neutral-subtle animate-pulse">
                    {{ $t("Loading personas...") }}
                </p>
            </div>
        </SectionBody>

        <!-- Footer tagline -->
        <div class="text-center py-4">
            <p class="text-xs text-text-neutral-subtle">
                {{ $t("Built with ElevenLabs + Firecrawl for #ElevenHacks") }}
            </p>
        </div>
    </Section>
</template>

<script setup lang="ts">
import { Request } from "@asanrom/request-browser";
import { ApiPersonas } from "~/api/api-group-personas";
import type { PersonaSummary } from "~/api/definitions";

definePageMeta({
    layout: "landing",
});

const { t } = useI18n();
const localePath = useLocalePath();
const router = useRouter();
const sessionStore = useSessionStore();

useHead(() => ({
    title: t("DeadTalk - Talk to History"),
}));

// Fetch personas from API
const personas = ref<PersonaSummary[]>([]);
const isLoading = ref(true);

onMounted(async () => {
    try {
        await new Promise<void>((resolve, reject) => {
            Request.Do(ApiPersonas.ListPersonas())
                .onSuccess((data) => {
                    const normalized: PersonaSummary[] = (Array.isArray(data) ? data : []).map((p) => ({
                        id: p.id || "",
                        name: p.name || "",
                        era: p.era || "",
                        nationality: p.nationality || "",
                        profession: p.profession || "",
                        avatar: p.avatar || "",
                        firstMessage: p.firstMessage || "",
                        firstMessageEs: p.firstMessageEs || "",
                    }));
                    personas.value = normalized;
                    resolve();
                })
                .onRequestError((err, handleErr) => {
                    handleErr(err, {
                        temporalError: () => reject(err),
                        serverError: () => reject(err),
                        networkError: () => reject(err),
                    });
                })
                .onCancel(() => reject(new Error("List personas request cancelled")))
                .onUnexpectedError((err) => reject(err));
        });
    } catch {
        // Fallback: hardcoded personas
        personas.value = [
            {
                id: "tesla",
                name: "Nikola Tesla",
                era: "1856-1943",
                nationality: "Serbian-American",
                profession: "Inventor & Engineer",
                avatar: "",
                firstMessage: "",
                firstMessageEs: "",
            },
            {
                id: "einstein",
                name: "Albert Einstein",
                era: "1879-1955",
                nationality: "German-Swiss-American",
                profession: "Theoretical Physicist",
                avatar: "",
                firstMessage: "",
                firstMessageEs: "",
            },
            {
                id: "curie",
                name: "Marie Curie",
                era: "1867-1934",
                nationality: "Polish-French",
                profession: "Physicist & Chemist",
                avatar: "",
                firstMessage: "",
                firstMessageEs: "",
            },
            {
                id: "cleopatra",
                name: "Cleopatra VII",
                era: "69-30 BC",
                nationality: "Egyptian",
                profession: "Pharaoh & Ruler",
                avatar: "",
                firstMessage: "",
                firstMessageEs: "",
            },
            {
                id: "jobs",
                name: "Steve Jobs",
                era: "1955-2011",
                nationality: "American",
                profession: "Entrepreneur & Visionary",
                avatar: "",
                firstMessage: "",
                firstMessageEs: "",
            },
        ];
    } finally {
        isLoading.value = false;
    }
});

function selectPersona(p: PersonaSummary) {
    sessionStore.startConversation(p);
    router.push(localePath("/session?persona=" + encodeURIComponent(p.id)));
}
</script>
