<template>
    <Section
        hasContentMaxWidth
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <div class="flex flex-col gap-2">
                <NavLink
                    :text="$t('Go back to roles')"
                    :iconPosition="IconPosition.LEFT"
                    icon="mdi:keyboard-backspace"
                    :to="localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}`)"
                />
                <Heading
                    :title
                    :size="HeadingSize.SM"
                />
            </div>
        </SectionHeader>
        <SectionBody>
            <NewRoleForm />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
definePageMeta({
    layout: "admin-panel",
    permissions: ["moderateUsers", "manageUsers", "manageRoles"],
});

// Page title
const title = computed(() => $t("New role"));

useHead(() => ({
    title: title.value,
}));

// Translation dependencies
const localePath = useLocalePath();
</script>
