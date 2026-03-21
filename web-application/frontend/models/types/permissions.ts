export interface GroupedPermission {
    id: string;
    name: string;
    permissions: (GlobalRolePermission & {
        name: string;
        description: string;
    })[];
}

export type PermissionKey = "manageUsers" | "moderateUsers" | "manageRoles";
