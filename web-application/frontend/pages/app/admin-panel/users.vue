<template>
    <Section
        :hasSidePadding="false"
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <Heading
                :title
                :size="HeadingSize.SM"
            />
        </SectionHeader>
        <SectionBody>
            <UsersTable />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
definePageMeta({
    layout: "admin-panel",
    permissions: ["moderateUsers", "manageUsers"],
});

// Page title
const title = computed(() => $t("Users"));

useHead(() => ({
    title: title.value,
}));
</script>
