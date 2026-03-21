<template>
  <Section class="min-h-[100dvh] flex flex-col px-4 py-8">
    <!-- Hero -->
    <div class="flex flex-col gap-2 items-center text-center pt-8 pb-6">
      <Heading :title="$t('DeadTalk')" :size="HeadingSize.MD" :align="Align.CENTER" />
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
          class="group flex flex-col items-center gap-2 rounded-xl border border-border-default
                 p-4 transition-all duration-200
                 hover:border-border-brand hover:bg-background-neutral-subtle
                 active:scale-95 cursor-pointer"
          @click="selectPersona(p)"
        >
          <!-- Avatar placeholder -->
          <div
            class="w-16 h-16 rounded-full bg-background-neutral-subtle
                   flex items-center justify-center text-2xl font-bold text-text-neutral-subtle
                   group-hover:bg-background-primary-brand-default group-hover:text-text-inverse
                   transition-colors duration-200"
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
      <div v-if="isLoading" class="flex items-center justify-center py-12">
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
import type { PersonaSummary } from "~/models/session";

definePageMeta({
  layout: "landing",
});

const { t } = useI18n();
const localePath = useLocalePath();
const router = useRouter();
const sessionStore = useSessionStore();

useHead(() => ({
  title: t("DeadTalk — Talk to History"),
}));

// Fetch personas from API
const personas = ref<PersonaSummary[]>([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    // Try to fetch from API; fallback to hardcoded list
    const apiBase = import.meta.env.DEV
      ? (import.meta.env.VITE__DEV_TEST_HOST || "http://localhost") + "/api/v1"
      : "/api/v1";

    const response = await fetch(apiBase + "/personas");
    if (response.ok) {
      const data = await response.json();
      personas.value = Array.isArray(data) ? data : [];
    }
  } catch (_err) {
    // Fallback: hardcoded personas
    personas.value = [
      { id: "tesla", name: "Nikola Tesla", era: "1856-1943", nationality: "Serbian-American", profession: "Inventor & Engineer", avatar: "", firstMessage: "" },
      { id: "einstein", name: "Albert Einstein", era: "1879-1955", nationality: "German-Swiss-American", profession: "Theoretical Physicist", avatar: "", firstMessage: "" },
      { id: "curie", name: "Marie Curie", era: "1867-1934", nationality: "Polish-French", profession: "Physicist & Chemist", avatar: "", firstMessage: "" },
      { id: "cleopatra", name: "Cleopatra VII", era: "69-30 BC", nationality: "Egyptian", profession: "Pharaoh & Ruler", avatar: "", firstMessage: "" },
      { id: "jobs", name: "Steve Jobs", era: "1955-2011", nationality: "American", profession: "Entrepreneur & Visionary", avatar: "", firstMessage: "" },
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
