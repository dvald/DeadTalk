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
            <ChangeUserPasswordForm class="max-w-[500px]" />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
definePageMeta({ layout: "account-settings" });

// Page title
const title = computed(() => $t("Change password"));

useHead(() => ({
    title: title.value,
}));
</script>
