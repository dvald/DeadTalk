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

const { t } = useI18n();

// Composables
const { can } = usePermissions(t);

// Data
const menuItems = computed<SidebarMenuItem[]>(() => {
    const basePermission = AuthController.Role === "admin" || can.value.manageUsers || can.value.moderateUsers;

    if (!basePermission) {
        return [];
    }

    const items: SidebarMenuItem[] = [];

    // Section: User management
    items.push(
        {
            isSectionTitle: true,
            text: $t("User management"),
        },
        {
            text: $t("Users"),
            icon: "mdi:account-group-outline",
            to: localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.USERS}`),
        },
    );

    // Section: Roles & permissions (only for admin or manageRoles)
    if (AuthController.Role === "admin" || can.value.manageRoles) {
        items.push(
            {
                isSectionTitle: true,
                text: $t("Roles & permissions"),
            },
            {
                text: $t("Roles"),
                icon: "mdi:account-star-outline",
                to: localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}`),
            },
            {
                text: $t("Permissions"),
                icon: "mdi:list-status",
                to: localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.PERMISSIONS}`),
            },
        );
    }

    return items;
});
</script>
