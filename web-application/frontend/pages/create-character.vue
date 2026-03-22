<template>
    <div class="seance-bg min-h-[100dvh] flex flex-col relative overflow-hidden">
        <div class="grain-overlay" />
        <div class="fog-gradient" />
        <div class="ambient-orb ambient-orb--primary" />

        <!-- Back button -->
        <button
            class="fixed top-8 left-6 z-50 text-[#e4e1e9]/40 hover:text-[#d4a853] transition-all duration-500"
            @click="router.push(localePath('/'))"
        >
            <svg
                class="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
            >
                <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
        </button>

        <main class="flex-1 flex flex-col items-center justify-center px-6 py-20 relative z-10">
            <!-- Title -->
            <div class="text-center mb-10">
                <h1 class="heading-font text-3xl md:text-4xl italic text-[#e4e1e9] seance-text-glow">
                    {{ $t("Summon a New Spirit") }}
                </h1>
                <p class="text-[10px] uppercase tracking-[0.2em] text-[#cec1e2]/60 mt-3">
                    {{ $t("Enter a name and we'll research, paint, and give voice to any figure from history") }}
                </p>
            </div>

            <!-- Creation form (hidden during creation) -->
            <div
                v-if="!isCreating && !createdPersona"
                class="w-full max-w-md space-y-6"
            >
                <!-- Name input -->
                <div class="space-y-2">
                    <label class="text-[9px] uppercase tracking-[0.2em] text-[#d4a853]/60">
                        {{ $t("Historical Figure") }}
                    </label>
                    <input
                        v-model="characterName"
                        type="text"
                        :placeholder="$t('e.g., Leonardo da Vinci')"
                        class="w-full px-5 py-4 bg-[#1b1b20]/80 border border-[#d4a853]/10 rounded-sm text-[#e4e1e9] placeholder-[#e4e1e9]/20 focus:border-[#d4a853]/40 focus:outline-none transition-all duration-500 heading-font italic text-lg"
                        @keydown.enter="startCreation"
                    />
                </div>

                <!-- Hints input (optional) -->
                <div class="space-y-2">
                    <label class="text-[9px] uppercase tracking-[0.2em] text-[#d4a853]/60">
                        {{ $t("Hints (optional)") }}
                    </label>
                    <input
                        v-model="hints"
                        type="text"
                        :placeholder="$t('e.g., Italian Renaissance artist, inventor')"
                        class="w-full px-5 py-3 bg-[#1b1b20]/80 border border-[#d4a853]/10 rounded-sm text-[#e4e1e9]/80 placeholder-[#e4e1e9]/20 focus:border-[#d4a853]/40 focus:outline-none transition-all duration-500 text-sm"
                    />
                </div>

                <!-- Create button -->
                <button
                    :disabled="!characterName.trim()"
                    class="w-full px-8 py-4 bg-gradient-to-tr from-[#f2c36b] to-[#d4a853] text-[#131318] uppercase tracking-[0.3em] text-[10px] rounded-sm shadow-[0_0_20px_rgba(242,195,107,0.2)] transition-all duration-500 hover:shadow-[0_0_40px_rgba(242,195,107,0.4)] disabled:opacity-30 disabled:cursor-not-allowed"
                    @click="startCreation"
                >
                    {{ $t("Begin the Summoning") }}
                </button>
            </div>

            <!-- Progress display -->
            <div
                v-if="isCreating"
                class="w-full max-w-md space-y-8 text-center"
            >
                <div class="w-24 h-24 mx-auto rounded-full border border-[#d4a853]/30 flex items-center justify-center animate-pulse">
                    <span class="heading-font italic text-5xl text-[#d4a853]/60">{{ characterName.charAt(0) }}</span>
                </div>

                <h2 class="heading-font italic text-2xl text-[#e4e1e9]">{{ $t("Summoning") }} {{ characterName }}...</h2>

                <div class="space-y-4">
                    <div
                        v-for="step in progressSteps"
                        :key="step.id"
                        class="flex items-center gap-3 justify-center"
                    >
                        <div
                            class="w-2 h-2 rounded-full transition-all duration-500"
                            :class="step.done ? 'bg-[#d4a853]' : step.active ? 'bg-[#d4a853]/50 animate-pulse' : 'bg-[#e4e1e9]/10'"
                        />
                        <span
                            class="text-sm transition-all duration-500"
                            :class="step.done ? 'text-[#d4a853]/80' : step.active ? 'text-[#e4e1e9]/80' : 'text-[#e4e1e9]/30'"
                        >
                            {{ step.label }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Created persona preview -->
            <div
                v-if="createdPersona"
                class="w-full max-w-md space-y-8 text-center"
            >
                <!-- Portrait -->
                <div class="w-40 h-40 mx-auto rounded-sm overflow-hidden seance-glow">
                    <img
                        v-if="createdPersona.image"
                        :src="createdPersona.image"
                        :alt="createdPersona.name"
                        class="w-full h-full object-cover"
                    />
                    <div
                        v-else
                        class="w-full h-full flex items-center justify-center bg-[#1b1b20]"
                    >
                        <span class="heading-font italic text-6xl text-[#f2c36b]/60">{{ createdPersona.name.charAt(0) }}</span>
                    </div>
                </div>

                <!-- Info -->
                <div class="space-y-2">
                    <h2 class="heading-font italic text-3xl text-[#e4e1e9]">{{ createdPersona.name }}</h2>
                    <p class="text-sm text-[#cec1e2]/60">{{ createdPersona.profession }} &bull; {{ createdPersona.era }}</p>
                    <span
                        class="inline-block px-3 py-1 text-[8px] uppercase tracking-[0.2em] rounded-full"
                        :class="
                            createdPersona.voiceSource === 'cloned' ? 'bg-[#4ade80]/10 text-[#4ade80]' : 'bg-[#d4a853]/10 text-[#d4a853]'
                        "
                    >
                        {{ createdPersona.voiceSource === "cloned" ? $t("Voice cloned from real recording") : $t("AI-generated voice") }}
                    </span>
                </div>

                <!-- Start conversation button -->
                <button
                    class="w-full px-8 py-4 bg-gradient-to-tr from-[#f2c36b] to-[#d4a853] text-[#131318] uppercase tracking-[0.3em] text-[10px] rounded-sm shadow-[0_0_30px_rgba(242,195,107,0.3)] transition-all duration-500 hover:shadow-[0_0_50px_rgba(242,195,107,0.5)]"
                    @click="startConversation"
                >
                    {{ $t("Begin the Seance") }}
                </button>

                <!-- Create another -->
                <button
                    class="text-sm text-[#e4e1e9]/40 hover:text-[#d4a853] transition-all duration-500"
                    @click="resetForm"
                >
                    {{ $t("Summon another spirit") }}
                </button>
            </div>

            <!-- Error display -->
            <div
                v-if="errorMessage"
                class="mt-6 text-center"
            >
                <p class="text-sm text-red-400/80">{{ errorMessage }}</p>
                <button
                    class="mt-3 text-sm text-[#d4a853] hover:underline"
                    @click="
                        errorMessage = '';
                        isCreating = false;
                    "
                >
                    {{ $t("Try again") }}
                </button>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { Request } from "@asanrom/request-browser";
import { ApiCharacters } from "~/api/api-group-characters";

definePageMeta({
    layout: "seance",
});

const { t: $t } = useI18n();
const localePath = useLocalePath();
const router = useRouter();
const sessionStore = useSessionStore();

useHead(() => ({
    title: $t("Create Character — DeadTalk"),
}));

const characterName = ref("");
const hints = ref("");
const isCreating = ref(false);
const errorMessage = ref("");
const createdPersona = ref<any>(null);

interface ProgressStep {
    id: string;
    label: string;
    active: boolean;
    done: boolean;
}

const progressSteps = ref<ProgressStep[]>([
    { id: "research", label: "Searching historical archives...", active: false, done: false },
    { id: "portrait", label: "Painting the portrait...", active: false, done: false },
    { id: "voice", label: "Channeling the voice...", active: false, done: false },
    { id: "synthesis", label: "Weaving the persona...", active: false, done: false },
]);

function setStepActive(id: string) {
    for (const step of progressSteps.value) {
        if (step.id === id) {
            step.active = true;
        }
    }
}

function setStepDone(id: string) {
    for (const step of progressSteps.value) {
        if (step.id === id) {
            step.done = true;
            step.active = false;
        }
    }
}

function startCreation() {
    if (!characterName.value.trim()) return;

    isCreating.value = true;
    errorMessage.value = "";
    createdPersona.value = null;

    // Reset progress
    for (const step of progressSteps.value) {
        step.active = false;
        step.done = false;
    }

    // Simulate step progress (the backend does it all in one call but takes time)
    setStepActive("research");

    // Start a timer to advance steps visually
    const stepTimers = [
        setTimeout(() => {
            setStepDone("research");
            setStepActive("portrait");
        }, 20000),
        setTimeout(() => {
            setStepDone("portrait");
            setStepActive("voice");
        }, 35000),
        setTimeout(() => {
            setStepDone("voice");
            setStepActive("synthesis");
        }, 45000),
    ];

    Request.Do(
        ApiCharacters.CreateCharacter({
            name: characterName.value.trim(),
            hints: hints.value.trim() || undefined,
        }),
    )
        .onSuccess((data) => {
            for (const t of stepTimers) clearTimeout(t);
            for (const step of progressSteps.value) {
                step.done = true;
                step.active = false;
            }
            isCreating.value = false;
            createdPersona.value = data;
        })
        .onRequestError(() => {
            for (const t of stepTimers) clearTimeout(t);
            isCreating.value = false;
            errorMessage.value = "Something went wrong";
        })
        .onCancel(() => {
            for (const t of stepTimers) clearTimeout(t);
            isCreating.value = false;
        });
}

function startConversation() {
    if (!createdPersona.value) return;

    sessionStore.startConversation({
        id: createdPersona.value.id,
        name: createdPersona.value.name,
        era: createdPersona.value.era || "",
        nationality: createdPersona.value.nationality || "",
        profession: createdPersona.value.profession || "",
        avatar: "",
        image: createdPersona.value.image || "",
        firstMessage: createdPersona.value.firstMessage || "",
        firstMessageEs: createdPersona.value.firstMessageEs || "",
    });

    router.push(localePath("/session?persona=" + encodeURIComponent(createdPersona.value.id)));
}

function resetForm() {
    characterName.value = "";
    hints.value = "";
    isCreating.value = false;
    errorMessage.value = "";
    createdPersona.value = null;
    for (const step of progressSteps.value) {
        step.active = false;
        step.done = false;
    }
}
</script>
