<template>
    <div class="w-full flex flex-col gap-4">
        <Card
            v-for="group in permissions"
            :key="group.id"
            class="!gap-4"
        >
            <CardHeader>
                <CardTitle
                    :title="trimText(group.name, FieldMaxLength.PERMISSION_GROUP_NAME)"
                    class="text-base font-semibold"
                />
            </CardHeader>
            <CardBody>
                <List
                    v-if="group.permissions.length"
                    class="!gap-3"
                >
                    <ListItem
                        v-for="permission in group.permissions"
                        :key="permission.id"
                    >
                        <SwitchField
                            :id="permission.id!"
                            :key="permission.id"
                            v-model="selectedPermissions[permission.id!]"
                            :label="trimText(permission.name, FieldMaxLength.PERMISSION_NAME)"
                            :helpText="trimText(permission.description, FieldMaxLength.SHORT_DESCRIPTION)"
                            :disabled
                        />
                    </ListItem>
                </List>
                <EmptyState
                    v-else
                    :title="$t('No permissions assigned')"
                    :description="$t('This permission group has no permissions assigned to it. Add some permissions.')"
                    :buttonText="$t('New permission')"
                    :buttonIconPosition="IconPosition.LEFT"
                    :buttonStyleType="ButtonStyleType.PRIMARY_BRAND_TRANSPARENT"
                    buttonIcon="mdi:plus-circle-outline"
                    hasContainer
                    icon="mdi:list-status"
                    styledContainerClass="py-6"
                    @buttonClick="
                        navigateTo(
                            localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.PERMISSIONS}/new-permission?group=${group.id}`),
                        )
                    "
                />
            </CardBody>
        </Card>
    </div>
</template>

<script setup lang="ts">
// Props
const props = defineProps({
    permissions: {
        type: Array as PropType<GroupedPermission[]>,
        required: true,
    },
    modelValue: {
        type: Object as PropType<Record<string, boolean>>,
        required: true,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
});

// Emits
const emit = defineEmits(["update:modelValue"]);

// Computed
const selectedPermissions = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

// Translation dependencies
const localePath = useLocalePath();

// Watchers
watch(
    () => props.permissions,
    (newData) => {
        if (!newData?.length) return;

        for (const group of newData) {
            for (const permission of group.permissions) {
                if (selectedPermissions.value[permission.id] === undefined) {
                    selectedPermissions.value[permission.id] = permission.granted ?? false;
                }
            }
        }
    },
    { immediate: true },
);
</script>
