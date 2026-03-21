<template>
    <div
        :class="[
            'relative',
            'w-full',
            'flex',
            'flex-col',
            'gap-3',
            'p-8',
            'rounded-xl',
            'overflow-hidden',
            isDark && 'dark',
            containerClass,
        ]"
    >
        <!-- Background image overlay -->
        <div
            v-if="backgroundImage"
            :style="{
                backgroundImage: `url(${backgroundImage})`,
                opacity: backgroundImageOpacity,
            }"
            class="absolute inset-0 bg-cover bg-center pointer-events-none"
        />

        <!-- Content -->
        <Heading
            :overtitle
            :title
            :description
            :align
            :size
            class="relative z-10"
        />
    </div>
</template>

<script setup lang="ts">
// Props
defineProps({
    overtitle: String as PropType<string>,
    title: String as PropType<string>,
    description: String as PropType<string>,
    align: String as PropType<Align>,
    size: {
        type: String as PropType<HeadingSize>,
        default: HeadingSize.SM,
    },
    containerClass: {
        type: String as PropType<string>,
        default: "bg-background-primary-brand-default",
    },
    isDark: {
        type: Boolean as PropType<boolean>,
        default: true,
    },
    backgroundImage: {
        type: String as PropType<string>,
        default: "",
    },
    backgroundImageOpacity: {
        type: Number as PropType<number>,
        default: 0.2,
    },
});
</script>
