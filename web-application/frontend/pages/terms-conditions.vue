<template>
    <Section hasContentMaxWidth>
        <SectionBody>
            <ContentRenderer
                v-if="data"
                :value="data"
                class="max-w-[800px]"
            />
        </SectionBody>
    </Section>
</template>
<script setup lang="ts">
definePageMeta({
    layout: "landing",
});

// Page title
useHead(() => ({
    title: $t("Terms & Conditions"),
}));

// Translation dependencies
const { locale } = useI18n();

// Route
const route = useRoute();

// Computed
const cleanPath = computed<string>(() => {
    const path = route.path ?? "";
    return path.split("?")[0]?.split("#")[0] ?? "";
});

const localizedPath = computed<string>(() => {
    if (!cleanPath.value) {
        return "";
    }

    return `/${locale.value}${cleanPath.value}`;
});

// Data
const { data } = await useAsyncData(
    () => `page-${locale.value}-${cleanPath.value}`,
    async () => {
        if (!localizedPath.value) {
            return null;
        }

        return await queryCollection("content").path(localizedPath.value).first();
    },
    {
        watch: [locale],
    },
);
</script>
