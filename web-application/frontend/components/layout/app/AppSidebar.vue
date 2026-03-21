<template>
    <aside
        :class="[
            'w-[300px]',
            isMobile ? 'fixed flex pr-content-side-padding-mobile' : 'flex',
            !isMobile && stickyTopHeight > 0 && 'sticky',
            'flex-col',
            'pb-4 ',
            'transition-transform duration-300',
            'lg:translate-x-0', // Always visible on large screens
            'bg-background-surface',
            isDark && 'dark',
        ]"
        :style="{
            ...dynamicStyle,
            top: !isMobile && stickyTopHeight > 0 ? `${stickyTopHeight}px` : undefined,
        }"
    >
        <div :class="['flex flex-col gap-6', 'h-full']">
            <slot />
        </div>
    </aside>
</template>

<script setup lang="ts">
// Props
const props = defineProps({
    translationWidth: {
        type: Number as PropType<number>,
        default: 332, // Total width of the sidebar + Padding
    },
    heightOffset: {
        type: Number as PropType<number>,
        default: 0,
    },
    stickyTopHeight: {
        type: Number as PropType<number>,
        default: 0,
    },
    isDark: {
        type: Boolean as PropType<boolean>,
        default: false,
    },
});

// Composables
const { isMobileSidebarOpen } = useMobileSidebar();
const { isMobile } = useIsMobile();

// Computed
const dynamicStyle = computed(() => {
    const styles: Record<string, string> = {};

    // Handle transform for mobile
    if (isMobile.value) {
        const distance = isMobileSidebarOpen.value ? 0 : -props.translationWidth;

        styles.transform = `translateX(${distance}px)`;
    }

    // Calculate dynamic height
    styles.height = `calc(100vh - ${props.heightOffset}px)`;

    return styles;
});
</script>
