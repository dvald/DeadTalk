<template>
  <Section class="min-h-[100dvh] flex items-center justify-center px-4">
    <SectionBody class="w-full max-w-lg flex flex-col gap-8 items-center">
      <!-- Hero -->
      <div class="flex flex-col gap-3 items-center text-center">
        <Heading :title="$t('What should they debate?')" :size="HeadingSize.SM" :align="Align.CENTER" />
        <p class="text-sm text-text-neutral-subtle max-w-sm">
          {{ $t("Enter a topic and watch two AI agents argue with real sources") }}
        </p>
      </div>

      <!-- Input + Action -->
      <div class="flex flex-col gap-3 w-full">
        <InputField
          id="topic"
          v-model="topic"
          :placeholder="$t('Enter a topic...')"
          icon="mdi:lightbulb-outline"
          @keyup.enter="onStart"
        />
        <ActionButton
          :text="$t('Start debate')"
          :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
          :iconPosition="IconPosition.LEFT"
          icon="mdi:play"
          isFullWidth
          :disabled="!topic.trim()"
          @click="onStart"
        />
      </div>

      <!-- Suggestion chips -->
      <div class="flex flex-wrap gap-2 justify-center">
        <button
          v-for="(suggestion, i) in suggestions"
          :key="i"
          class="rounded-full border border-border-default px-3 py-1.5 text-xs text-text-neutral-subtle
                 hover:bg-background-neutral-subtle hover:text-text-default
                 transition-colors duration-150 cursor-pointer"
          @click="selectSuggestion(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
    </SectionBody>
  </Section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "landing",
});

const { t } = useI18n();
const localePath = useLocalePath();
const router = useRouter();

useHead(() => ({
  title: t("Home"),
}));

const topic = ref("");

const suggestions = computed(() => [
  t("Is AI consciousness possible?"),
  t("Pineapple on pizza"),
  t("Tabs vs spaces"),
  t("Remote work vs office"),
  t("Is social media good for society?"),
]);

function onStart() {
  if (!topic.value.trim()) return;
  router.push(localePath("/session?topic=" + encodeURIComponent(topic.value.trim())));
}

function selectSuggestion(suggestion: string) {
  topic.value = suggestion;
}
</script>
