<template>
    <nav class="flex gap-5 flex-col sm:flex-row">
        <NavFooterMenuItem
            v-for="item in items"
            :key="item.text"
            :text="item.text"
            :to="item.to"
            class="text-sm"
        />
    </nav>
</template>
<script setup lang="ts">
// Props
defineProps({
    items: {
        type: Array as PropType<MenuItem[]>,
        required: true,
    },
});
</script>
