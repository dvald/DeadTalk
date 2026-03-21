<template>
    <Section
        :hasSidePadding="false"
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <Heading
                title="Title"
                :size="HeadingSize.SM"
            />
        </SectionHeader>
        <SectionBody>
            <ContentPlaceholder class="!h-[400px]" />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
definePageMeta({ layout: "profile" });

// Translation dependencies
const localePath = useLocalePath();

// Composables
const { requireLogin } = useRequireLogin();
const { listenOnAppEvent } = useGlobalEvents();

const onAuthChanged = () => {
    if (!AuthController.isAuthenticated()) {
        requireLogin();
    } else if (AuthController.isAskingForTwoFactor()) {
        navigateTo(localePath(`/${AppSlug.TFA_LOGIN}`));
    }
};

onMounted(() => {
    listenOnAppEvent("auth-status-changed", onAuthChanged);
});

useHead(() => ({
    title: $t("User profile"),
}));
</script>
