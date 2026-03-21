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
            <ActionButton
                :actionType="ButtonActionType.LINK"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                :to="localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}/new-role`)"
                :text="$t('New role')"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:plus-circle-outline"
            />
        </SectionHeader>
        <SectionBody>
            <RolesTable />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
definePageMeta({
    layout: "admin-panel",
    permissions: ["moderateUsers", "manageUsers", "manageRoles"],
});

// Page title
const title = computed(() => $t("Roles"));

useHead(() => ({
    title: title.value,
}));

// Stores
const toastStore = useNavigationToastStore();
const { clearToast } = toastStore;
const { toastMessage } = storeToRefs(toastStore);

// Translation dependencies
const localePath = useLocalePath();

// Toast
const { $toast } = useNuxtApp();

onMounted(() => {
    if (toastMessage.value) {
        $toast.success(toastMessage.value, {
            toastId: "role-deleted-success",
        });

        clearToast();
    }
});
</script>
