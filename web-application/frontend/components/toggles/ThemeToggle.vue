<template>
    <div>
        <!-- Theme toggle hidden: dark séance theme is always active -->
    </div>
</template>
<script setup lang="ts">
// Props
defineProps({
    hasOnlyIcons: {
        type: Boolean as PropType<boolean>,
        default: true,
    },
    showLabel: {
        type: Boolean as PropType<boolean>,
        default: true,
    },
    label: String as PropType<string>,
    customClass: String as PropType<string>,
});

// Stores
const themeStore = useThemeStore();
const { themes, selectedTheme: _selectedTheme } = storeToRefs(themeStore);

const _themeToggleIconButtons = computed(() =>
    themes.value.map((theme) => ({
        text: theme.text,
        icon: theme.icon,
        value: theme.value,
    })),
);

const _themeToggleButtons = computed(() =>
    themes.value.map((theme) => ({
        text: theme.text,
        value: theme.value,
        icon: theme.icon,
        iconPosition: IconPosition.LEFT,
    })),
);
</script>
