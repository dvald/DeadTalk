<template>
    <Section
        :hasSidePadding="false"
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <Heading
                :overtitle="$t('Account')"
                :title
                :size="HeadingSize.SM"
            />
        </SectionHeader>
        <SectionBody>
            <AccountInfoForm
                :username="AuthController.Username"
                :email="AuthController.Email"
            />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
definePageMeta({ layout: "account-settings" });

// Page title
const title = computed(() => $t("Account info"));

useHead(() => ({
    title: title.value,
}));
</script>
