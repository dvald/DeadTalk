<template>
    <Section
        :hasSidePadding="false"
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <Heading
                title="Visited user content"
                :size="HeadingSize.SM"
            />
        </SectionHeader>
        <SectionBody>
            <ContentPlaceholder />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
definePageMeta({
    layout: "account-settings",
});

// Page title
useHead(() => ({
    title: $t("User profile"),
}));
</script>
