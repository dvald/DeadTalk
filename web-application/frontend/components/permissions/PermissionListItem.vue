<template>
    <div class="w-full flex flex-col gap-1">
        <span class="text-sm">
            {{ trimText(title, FieldMaxLength.PERMISSION_NAME) }}
        </span>
        <p class="text-xs text-text-neutral-subtle">
            {{ trimText(description, FieldMaxLength.SHORT_DESCRIPTION) }}
        </p>
    </div>
</template>
<script setup lang="ts">
// Props
defineProps({
    id: {
        type: String as PropType<string>,
        required: true,
    },
    title: {
        type: String as PropType<string>,
        default: "Title",
    },
    description: {
        type: String as PropType<string>,
        default: "Description",
    },
});
</script>
