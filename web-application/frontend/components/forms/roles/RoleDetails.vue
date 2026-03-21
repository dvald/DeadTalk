<template>
    <DataDetails>
        <DataDetailsRow>
            <DataField
                id="name"
                :label="$t('Role ID')"
                :text="roleId"
            />
        </DataDetailsRow>

        <!-- Permissions list -->
        <DataDetailsRow>
            <div
                class="w-full flex flex-col"
                :class="['gap-3']"
            >
                <h2 class="text-lg text-text-neutral-subtle font-semibold">
                    {{ $t("Permissions") }}
                </h2>

                <PermissionsGroupsWithSwitches
                    v-if="groupedPermissions.length"
                    v-model="selectedPermissions"
                    :permissions="groupedPermissions"
                    disabled
                />
            </div>
        </DataDetailsRow>
    </DataDetails>
</template>

<script setup lang="ts">
// Props
const props = defineProps({
    roleId: {
        type: String as PropType<string>,
        required: true,
    },
    permissions: {
        type: Array as PropType<GlobalRolePermission[]>,
        required: true,
    },
});

const { t } = useI18n();

// Composables
const { groupPermissions, getPermissionName, getPermissionDescription } = usePermissions(t);

// Enrich and group the permissions
const groupedPermissions = computed<GroupedPermission[]>(() => {
    const enriched = props.permissions.map((p) => ({
        ...p,
        name: getPermissionName(p.id),
        description: getPermissionDescription(p.id),
    }));

    return groupPermissions(enriched);
});

const selectedPermissions = reactive<Record<string, boolean>>({});
// Sync granted state
watch(
    selectedPermissions,
    () => {
        for (const permission of props.permissions) {
            permission.granted = selectedPermissions[permission.id] ?? false;
        }
    },
    { deep: true },
);
</script>
