<template>
    <div class="bg-[#0a0a0c] text-[#e4e1e9] overflow-x-hidden">
        <!-- Hamburger menu -->
        <div class="fixed top-6 right-6 z-[60]">
            <!-- Hamburger button -->
            <button
                class="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-sm bg-[#1b1b20]/80 border border-[#d4a853]/10 text-[#e4e1e9]/60 hover:text-[#d4a853] hover:border-[#d4a853]/30 transition-all duration-500"
                :aria-label="$t('Menu')"
                :aria-expanded="showMenu"
                @click="showMenu = !showMenu"
            >
                <span
                    class="block w-4 h-px bg-current transition-all duration-300"
                    :class="showMenu ? 'rotate-45 translate-y-[3.5px]' : ''"
                />
                <span
                    class="block w-4 h-px bg-current transition-all duration-300"
                    :class="showMenu ? '-rotate-45 -translate-y-[3.5px]' : ''"
                />
            </button>

            <!-- Menu dropdown -->
            <Transition
                enter-active-class="transition-all duration-300"
                leave-active-class="transition-all duration-200"
                enter-from-class="opacity-0 -translate-y-2"
                leave-to-class="opacity-0 -translate-y-2"
            >
                <div
                    v-if="showMenu"
                    class="absolute right-0 mt-2 w-48 rounded-sm bg-[#1b1b20]/95 border border-[#d4a853]/10 backdrop-blur-xl overflow-hidden shadow-xl"
                >
                    <!-- Language section -->
                    <div class="px-4 py-2 border-b border-[#d4a853]/5">
                        <span class="text-[8px] uppercase tracking-[0.2em] text-[#d4a853]/40">{{ $t("Language") }}</span>
                    </div>
                    <button
                        class="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-[#d4a853]/10 transition-all duration-300"
                        :class="locale === 'en' ? 'text-[#d4a853]' : 'text-[#e4e1e9]/60'"
                        @click="switchLang('en')"
                    >
                        English
                        <span
                            v-if="locale === 'en'"
                            class="w-1.5 h-1.5 rounded-full bg-[#d4a853]"
                        />
                    </button>
                    <button
                        class="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-[#d4a853]/10 transition-all duration-300"
                        :class="locale === 'es' ? 'text-[#d4a853]' : 'text-[#e4e1e9]/60'"
                        @click="switchLang('es')"
                    >
                        Español
                        <span
                            v-if="locale === 'es'"
                            class="w-1.5 h-1.5 rounded-full bg-[#d4a853]"
                        />
                    </button>
                </div>
            </Transition>
        </div>

        <!-- Grain overlay -->
        <div class="grain-overlay" />

        <!-- Hero Section -->
        <section class="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
            <!-- Fog layers -->
            <div class="fog-container pointer-events-none">
                <div class="fog-layer opacity-40" />
                <div
                    class="fog-layer opacity-30"
                    style="animation-delay: -15s; animation-direction: reverse"
                />
            </div>

            <!-- Hero glow -->
            <div class="absolute inset-0 hero-glow pointer-events-none" />

            <!-- Hero content -->
            <div class="relative z-10 space-y-10 max-w-3xl">
                <!-- Badge -->
                <div class="inline-flex items-center gap-4 px-5 py-1.5 rounded-full border border-[#d4a853]/10 bg-white/5 backdrop-blur-xl">
                    <span class="text-[#d4a853] text-[9px] uppercase tracking-[0.3em]">
                        {{ $t("The Digital Séance is Now Open") }}
                    </span>
                </div>

                <!-- Headline -->
                <h1 class="heading-font italic text-4xl md:text-6xl lg:text-7xl leading-[1.1] text-incantation px-4">
                    {{ $t("Have real voice conversations with history's greatest minds.") }}
                </h1>

                <!-- Subtitle -->
                <p class="text-[#e4e1e9]/70 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
                    {{ $t("Resurrect the voices of the past through high-fidelity neural emulation. A portal to the Ethereal Archive.") }}
                </p>

                <!-- CTA -->
                <div class="pt-10 flex flex-col items-center gap-8">
                    <button
                        class="group relative px-12 py-5 bg-[#d4a853] text-[#271900] uppercase tracking-[0.3em] text-[10px] rounded-sm shadow-[0_0_30px_rgba(242,195,107,0.2)] transition-all duration-700 hover:scale-105 hover:shadow-[0_0_50px_rgba(242,195,107,0.4)] overflow-hidden"
                        @click="router.push(localePath('/create-character'))"
                    >
                        <span class="relative z-10">{{ $t("Begin the Séance") }}</span>
                        <div
                            class="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        />
                        <div class="absolute inset-0 bg-[#d4a853]/20 animate-pulse-slow" />
                    </button>

                    <!-- Counter -->
                    <div class="flex items-center gap-3 opacity-40">
                        <div class="h-px w-8 bg-[#d4a853]/30" />
                        <span class="text-[8px] uppercase tracking-widest">
                            {{ $t("{count} Spirits Summoned Today", { count: spiritCount }) }}
                        </span>
                        <div class="h-px w-8 bg-[#d4a853]/30" />
                    </div>
                </div>
            </div>

            <!-- Bottom gradient fade -->
            <div class="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[#0a0a0c] to-transparent z-10 pointer-events-none" />
        </section>

        <!-- Persona Grid Section -->
        <section
            ref="personaGridRef"
            class="relative z-10 px-6 py-24 bg-[#0a0a0c]"
        >
            <div class="max-w-7xl mx-auto space-y-20">
                <!-- Section header -->
                <div class="space-y-6 text-center">
                    <h2 class="heading-font italic text-4xl md:text-5xl text-[#d4a853]/90">
                        {{ $t("Select Your Guide") }}
                    </h2>
                    <p class="text-[10px] uppercase tracking-[0.4em] text-[#e4e1e9]/40">
                        {{ $t("Choose a consciousness to tether") }}
                    </p>
                    <div class="h-px w-32 bg-gradient-to-r from-transparent via-[#d4a853]/20 to-transparent mx-auto" />
                </div>

                <!-- Loading state -->
                <div
                    v-if="isLoading"
                    class="flex items-center justify-center py-24"
                >
                    <p class="text-sm text-[#e4e1e9]/50 animate-pulse">
                        {{ $t("Summoning spirits...") }}
                    </p>
                </div>

                <!-- Persona grid -->
                <div
                    v-else
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                >
                    <button
                        v-for="(p, index) in personas"
                        :key="p.id"
                        class="group relative spirit-card rounded-sm overflow-hidden p-2 transition-all duration-1000 hover:-translate-y-2 text-left cursor-pointer"
                        :class="getCardOffsetClass(index)"
                        @click="selectPersona(p)"
                    >
                        <!-- Hover aura -->
                        <div class="card-aura absolute inset-0 pointer-events-none" />

                        <!-- Card image container -->
                        <div class="aspect-[3/4] relative overflow-hidden bg-black/40">
                            <!-- Portrait image -->
                            <img
                                v-if="p.image"
                                :alt="p.name"
                                :src="p.image"
                                class="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                            />
                            <!-- Fallback letter avatar -->
                            <div
                                v-else
                                class="w-full h-full flex items-center justify-center"
                            >
                                <span
                                    class="heading-font italic text-8xl text-[#d4a853]/30 group-hover:text-[#d4a853]/60 transition-all duration-1000"
                                >
                                    {{ p.name.charAt(0) }}
                                </span>
                            </div>

                            <!-- Gradient overlay -->
                            <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />

                            <!-- Card text -->
                            <div class="absolute bottom-0 left-0 p-8 space-y-3">
                                <span class="text-[9px] uppercase tracking-[0.2em] text-[#d4a853]/60">
                                    {{ getEpithet(p.id) }}
                                </span>
                                <h3 class="heading-font italic text-3xl text-[#e4e1e9]">
                                    {{ p.name }}
                                </h3>
                            </div>
                        </div>
                    </button>

                    <!-- Create Your Own card -->
                    <button
                        class="group relative spirit-card rounded-sm overflow-hidden p-2 transition-all duration-1000 hover:-translate-y-2 text-left cursor-pointer border border-dashed border-[#d4a853]/20 hover:border-[#d4a853]/40"
                        @click="router.push(localePath('/create-character'))"
                    >
                        <div class="card-aura absolute inset-0 pointer-events-none" />
                        <div class="aspect-[3/4] relative overflow-hidden bg-black/20 flex flex-col items-center justify-center gap-6">
                            <div
                                class="w-20 h-20 rounded-full border border-[#d4a853]/30 flex items-center justify-center group-hover:border-[#d4a853]/60 transition-all duration-700"
                            >
                                <span
                                    class="heading-font italic text-4xl text-[#d4a853]/40 group-hover:text-[#d4a853]/80 transition-all duration-700"
                                    >+</span
                                >
                            </div>
                            <div class="text-center space-y-2 px-8">
                                <h3
                                    class="heading-font italic text-2xl text-[#e4e1e9]/70 group-hover:text-[#e4e1e9] transition-all duration-700"
                                >
                                    {{ $t("Create Your Own") }}
                                </h3>
                                <p class="text-[10px] uppercase tracking-[0.2em] text-[#d4a853]/40">
                                    {{ $t("Summon any historical figure") }}
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </section>

        <!-- Footer tagline -->
        <div class="text-center py-12 bg-[#0a0a0c]">
            <p class="text-xs text-[#e4e1e9]/30">
                {{ $t("Built with ElevenLabs + Firecrawl for #ElevenHacks") }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Request } from "@asanrom/request-browser";
import { ApiPersonas } from "~/api/api-group-personas";
import type { PersonaSummary } from "~/api/definitions";

definePageMeta({
    layout: "seance",
});

const { t, locale, setLocale } = useI18n();
const localePath = useLocalePath();
const router = useRouter();
const sessionStore = useSessionStore();

// Hamburger menu
const showMenu = ref(false);
async function switchLang(lang: "en" | "es") {
    await setLocale(lang as any);
    showMenu.value = false;
}

useHead(() => ({
    title: t("DeadTalk - Talk to History"),
}));

// Persona grid scroll ref
const personaGridRef = ref<HTMLElement | null>(null);

// Spirit counter (decorative)
const spiritCount = ref("3,402");

// Epithets map (frontend-only, avoids backend changes)
const EPITHETS: Record<string, string> = {
    tesla: "The Architect of Light",
    einstein: "The Navigator of Time",
    curie: "The Radiant Pioneer",
    cleopatra: "The Nile's Whisper",
    jobs: "The Digital Visionary",
};

function getEpithet(id: string): string {
    return EPITHETS[id] || "";
}

// Card stagger offsets for visual interest
function getCardOffsetClass(index: number): string {
    if (index === 1) return "md:mt-16";
    if (index === 3) return "md:-mt-16";
    return "";
}

// Scroll to persona grid
function scrollToGrid() {
    personaGridRef.value?.scrollIntoView({ behavior: "smooth" });
}

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
                        image: p.image || "",
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
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfjbm1DU2EGnuA0SmkJrrBlgGcuTLGNepJliHb4i8T6zPjZT7xS7aUWI5gonnlXLhS8did-Wm6OkRgYlnwNjk_LdEQvbr9CYsxysx27a7OnFmm0UaHen00QLtf14Po9Xrh63ipHxx6nKyCrPNK25lKkB40EpknGi9YlDJA1e1HY4YwLSy0ltPTfq1fYJDV-A52qzp9fAHXCrK7T9i3f9x4Vgfp5br863N7G6LCZVtdtG1qPejUP9jS13a4iZZwCiZwqSd-9V-Pu8pG",
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
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6Sg0caTpkA1Yz_yGd-bh2ri6EzC9_VMA4eA7qornPlfT1fcIngg96pVfc90Xxh4gNZNm3TFcwyueUvzCH5M1J_j7dxg80-mHR4gy0RRQtd1T6Sj6uzpR1GqHLlf639zJuXZNkgwNZAfZ5DCKwV_L4jpFkjQNXDTUnviaZcqTrdPWPHiXqQl23hGMxisj-_H1a9Pi42wTfI8w1AYH5O5YeSTFrflfTtMa-_W-bJEPmghjn7Fhq10VSdejjyxuqPkF3g9vJwSSt81_2",
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
                image: "",
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
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlKFbzesyN3MQW8yCX8b20xZZmWSlxVkyhxnARrmeFjFgmhqWUJfM_tKcaz5gDLCG96vNyhQ4n0jpN4Cd4VTEWtHXxMW7Y_Le-LtqdUcj232S5ISwZnTndgTYIxhfYw5HDMTXyuNtWuQ1njuhs1GYoNEzqFXUP4TeDxM0Hyvs2B__ORHl1AtS3LkAeBKa3xtlAUEcJeZZYfrlQOk5HZL6PwvjjN8NdarGMmIWedJ_UQBLJMZMh3H8ljGeqa_EP1ybHAB0I0Guf2-4r",
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
                image: "",
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
