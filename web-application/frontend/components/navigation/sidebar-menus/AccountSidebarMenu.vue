<template>
    <NavSidebarMenu class="!p-0">
        <template
            v-for="(item, index) in menuItems"
            :key="index"
        >
            <NavSidebarMenuSectionTitle
                v-if="item.isSectionTitle"
                :text="item.text"
                :icon="item.icon"
                :styleType="SidebarNavMenuItemStyleType.COMPACT"
            />
            <NavSidebarMenuItem
                v-else
                :text="item.text"
                :icon="item.icon"
                :to="item.to"
                :styleType="SidebarNavMenuItemStyleType.COMPACT"
            />
        </template>
    </NavSidebarMenu>
</template>
<script setup lang="ts">
// Translation dependencies
const localePath = useLocalePath();

// Data
const menuItems = computed<SidebarMenuItem[]>(() => [
    {
        isSectionTitle: true,
        text: $t("Account"),
    },
    {
        text: $t("Profile data"),
        icon: "mdi:account-box-outline",
        to: localePath(`/${AppSlug.APP}/${AppSlug.ACCOUNT_SETTINGS}/profile-data`),
    },
    {
        text: $t("Account info"),
        icon: "mdi:account-outline",
        to: localePath(`/${AppSlug.APP}/${AppSlug.ACCOUNT_SETTINGS}/account-info`),
    },
    {
        isSectionTitle: true,
        text: $t("Security"),
    },
    {
        text: $t("Change password"),
        icon: "mdi:form-textbox-password",
        to: localePath(`/${AppSlug.APP}/${AppSlug.ACCOUNT_SETTINGS}/change-password`),
    },
    {
        text: $t("Two-factor authentication"),
        icon: "mdi:two-factor-authentication",
        to: localePath(`/${AppSlug.APP}/${AppSlug.ACCOUNT_SETTINGS}/two-factor-authentification`),
    },
    {
        text: $t("Active sessions"),
        icon: "mdi:format-list-bulleted",
        to: localePath(`/${AppSlug.APP}/${AppSlug.ACCOUNT_SETTINGS}/active-sessions`),
    },
    {
        isSectionTitle: true,
        text: $t("Application"),
    },
    {
        text: $t("Settings"),
        icon: "mdi:cog-outline",
        to: localePath(`/${AppSlug.APP}/${AppSlug.ACCOUNT_SETTINGS}/app-settings`),
    },
]);
</script>
