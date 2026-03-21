<template>
    <footer
        :class="['px-content-side-padding-mobile md:px-content-side-padding', 'transition-transform duration-300']"
        :style="dynamicStyle"
    >
        <div :class="['w-full', 'flex', 'flex-col sm:flex-row', 'py-8', 'justify-between', 'gap-5']">
            <!-- Credits-->
            <p class="text-sm text-text-neutral-subtle">© Year [Company name]. All rights reserved.</p>

            <!-- Footer menu-->
            <NavFooterMenu :items />
        </div>
    </footer>
</template>
<script setup lang="ts">
// Translation dependencies
const localePath = useLocalePath();

// Data
const items: MenuItem[] = [
    {
        text: $t("About"),
        to: localePath("/about"),
    },
    {
        text: $t("Terms & Conditions"),
        to: localePath("/terms-conditions"),
    },
    {
        text: $t("Cookie policy"),
        to: localePath("/cookie-policy"),
    },
    {
        text: $t("Privacy policy"),
        to: localePath("/privacy-policy"),
    },
];

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
