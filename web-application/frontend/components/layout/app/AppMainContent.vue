<template>
    <main
        :class="['w-full flex flex-col', 'transition-all duration-300']"
        :style="dynamicStyle"
    >
        <slot />
    </main>
</template>

<script setup lang="ts">
// Props
const props = defineProps({
    translationWidth: {
        type: Number as PropType<number>,
        default: 200,
    },
});

// Composables
const { isMobileSidebarOpen } = useMobileSidebar();
const { isMobile } = useIsMobile();

// Computed
const dynamicStyle = computed(() => {
    const widthPx = `${props.translationWidth}px`;

    if (isMobile.value) {
        return {
            transform: `translateX(${isMobileSidebarOpen.value ? widthPx : "0"})`,
        };
    }

    return {}; // No margin or transform on desktop
});
</script>
