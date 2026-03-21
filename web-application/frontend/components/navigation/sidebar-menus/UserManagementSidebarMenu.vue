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
// Route
const route = useRoute();
const userId = route.params.userId;

// Translation dependencies
const localePath = useLocalePath();

// Composables
const { t } = useI18n();

const { can } = usePermissions(t);

// Data
const menuItems = computed<SidebarMenuItem[]>(() => {
    const basePermission = AuthController.Role === "admin" || can.value.manageUsers || can.value.moderateUsers;

    const items: SidebarMenuItem[] = [];

    if (!basePermission) {
        return items;
    }

    items.push(
        {
            isSectionTitle: true,
            text: $t("User"),
        },
        {
            text: $t("User details"),
            icon: "mdi:account-box-outline",
            to: localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId}/details`),
        },
        {
            text: $t("Active sessions"),
            icon: "mdi:format-list-bulleted",
            to: localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId}/active-sessions`),
        },
        {
            isSectionTitle: true,
            text: $t("Management"),
        },
        {
            text: $t("Account info"),
            icon: "mdi:account-outline",
            to: localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId}/account-info`),
        },
        {
            text: $t("Change password"),
            icon: "mdi:form-textbox-password",
            to: localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId}/change-password`),
        },
    );

    if (can.value.manageRoles) {
        items.push({
            text: $t("User role"),
            icon: "mdi:account-star-outline",
            to: localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId}/user-role`),
        });
    }

    items.push({
        text: $t("Two-factor authentication"),
        icon: "mdi:two-factor-authentication",
        to: localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId}/two-factor-authentification`),
    });

    return items;
});
</script>
