export const usePermissions = ($t: (t: string) => string) => {
    // Default role
    const defaultRoleRouteId = "default_role";
    const defaultRoleName = computed(() => $t("Default role"));

    // Protected roles
    const protectedRoles = new Set(["admin", defaultRoleRouteId]);
    const isProtectedRole = (id: string) => protectedRoles.has(id);

    // Permissions capabilities
    const can = computed(() => ({
        manageUsers: AuthController.hasPermission("admin.users.manage"),
        manageRoles: AuthController.hasPermission("admin.roles"),
        moderateUsers: AuthController.hasPermission("mod.users"),
        banUsers: AuthController.hasPermission("mod.ban"),
        immune: AuthController.hasPermission("mod.immune"),
    }));

    // Permission labels and descriptions translations
    const permissionLabels = computed(() => ({
        "admin.users.manage": $t("Manage users"),
        "admin.roles": $t("Manage roles"),
        "mod.users": $t("Moderate users"),
        "mod.ban": $t("Ban users"),
        "mod.immune": $t("Immunity settings"),
    }));

    const permissionDescriptions = computed(() => ({
        "admin.users.manage": $t("Grants full ability to manage users."),
        "admin.roles": $t("Grants the ability to create, edit, and delete roles, and manage the permissions assigned to them."),
        "mod.users": $t("Grants the ability to list and moderate users on the platform."),
        "mod.immune": $t("Provides immunity from moderation actions."),
        "mod.ban": $t("Grants the permission to ban users from the platform."),
    }));

    const getPermissionName = (id: string) => permissionLabels.value[id] || id;

    const getPermissionDescription = (id: string) => permissionDescriptions.value[id] || $t("No description available.");

    const getGroupNameFromId = (groupKey: string) => {
        const groupTranslations: Record<string, string> = {
            admin: $t("Admin"),
            mod: $t("Moderator"),
        };

        return groupTranslations[groupKey] || $t("General");
    };

    const groupPermissions = <T extends GlobalRolePermission>(permissions: T[]) => {
        const groups: Record<
            string,
            {
                id: string;
                name: string;
                permissions: T[];
            }
        > = {};

        for (const permission of permissions) {
            const groupKey = permission.id.split(".")[0];

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    id: groupKey,
                    name: getGroupNameFromId(groupKey),
                    permissions: [],
                };
            }

            groups[groupKey].permissions.push(permission);
        }

        return Object.values(groups);
    };

    return {
        getPermissionName,
        getPermissionDescription,
        getGroupNameFromId,
        groupPermissions,
        isProtectedRole,
        can,
        defaultRoleRouteId,
        defaultRoleName,
    };
};
