<template>
    <div class="flex gap-2 items-center">
        <span class="text-sm">{{ text }}</span>
        <ActionIconButton
            icon="mdi:content-copy"
            :size="ButtonSize.XS"
            @click="copyToClipboardWithNotification(text, confirmationMessage)"
        />
    </div>
</template>
<script setup lang="ts">
// Props
defineProps({
    text: {
        type: String as PropType<string>,
        default: "Copy text",
    },
    confirmationMessage: {
        type: String as PropType<string>,
        default: "Copied to clipboard",
    },
});

// Composables
const { copyToClipboardWithNotification } = useToastifiedActions();
</script>
