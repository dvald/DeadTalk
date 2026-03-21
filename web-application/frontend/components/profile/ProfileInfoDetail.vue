<template>
    <div class="flex gap-2">
        <Icon
            :name="icon"
            iconClass="text-icon-neutral-subtle"
        />
        <span class="w-full text-sm">
            {{ text }}
        </span>
    </div>
</template>
<script setup lang="ts">
defineProps({
    icon: {
        type: String as PropType<any>,
        default: ":mdi:help",
    },
    text: {
        type: String as PropType<string>,
        default: "Text",
    },
});
</script>
