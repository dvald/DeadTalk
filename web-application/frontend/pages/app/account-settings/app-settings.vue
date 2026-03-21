<template>
    <Section
        :hasSidePadding="false"
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <Heading
                :overtitle="$t('Application')"
                :title
                :size="HeadingSize.SM"
            />
        </SectionHeader>
        <SectionBody>
            <Alert
                :type="AlertType.INFO"
                :hasCloseButton="false"
                :title="$t('Default settings')"
                :description="
                    $t(
                        'Your language and theme preferences are loaded from your saved user settings. You can change them from the header at any time, but they will revert to your saved settings on page reload.',
                    )
                "
                class="max-w-[600px]"
            />
            <AppSettingsForm />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
definePageMeta({ layout: "account-settings" });

// Page title
const title = computed(() => $t("Settings"));

useHead(() => ({
    title: title.value,
}));
</script>
