<template>
    <Section
        :hasSidePadding="false"
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <Heading
                :overtitle="$t('Security')"
                :title
                :size="HeadingSize.SM"
            />
        </SectionHeader>
        <SectionBody>
            <TwoFactorAuthentificationForm />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
definePageMeta({ layout: "account-settings" });

// Page title
const title = computed(() => $t("Two-factor authentication"));

useHead(() => ({
    title: title.value,
}));
</script>
