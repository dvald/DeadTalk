<template>
    <NuxtLink
        :to
        class="underline hover:text-text-primary-brand-hover"
    >
        {{ text }}
    </NuxtLink>
</template>
<script setup lang="ts">
// Props
defineProps({
    text: {
        type: String as PropType<string>,
        default: "Menu item",
    },
    to: {
        type: String as PropType<string>,
        required: true,
    },
});
</script>
