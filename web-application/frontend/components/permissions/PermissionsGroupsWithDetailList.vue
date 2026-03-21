<template>
    <div class="w-full flex flex-col gap-4">
        <Card
            v-for="group in permissions"
            :key="group.id"
            class="!gap-4"
        >
            <CardHeader class="border-b-1 border-border-default pb-2">
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
                        <PermissionListItem
                            :id="permission.id!"
                            :title="permission.name"
                            :description="permission.description"
                        />
                    </ListItem>
                </List>
                <EmptyState
                    v-else
                    :title="$t('No permissions assigned')"
                    :description="$t('This permission group has no permissions assigned to it.')"
                    hasContainer
                    icon="mdi:list-status"
                    styledContainerClass="py-6"
                />
            </CardBody>
        </Card>
    </div>
</template>

<script setup lang="ts">
// Props
defineProps({
    permissions: {
        type: Array as PropType<GroupedPermission[]>,
        required: true,
    },
});
</script>
