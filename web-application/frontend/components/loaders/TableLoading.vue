<template>
    <LoadingScreen
        :isLoading
        :loadingText
        :isFullScreen="false"
        :title
        :error
        :hasGoBackButton="false"
        hasRetryButton
        :buttonSize="ButtonSize.MD"
        :retryText
        :retryLimitReachedText
        :cooldownText
        :maxRetryCycles
        :maxRetries
        :cooldownSeconds
        :iconContainerSize="IconContainerSize.LG"
        :isSpaced="false"
        titleClass="text-lg font-semibold"
        errorTextClass="text-sm font-semibold text-text-neutral-subtle"
        helpTextClass="text-sm"
        :helpText
        containerClass="min-h-[200px]"
        @retry="$emit('retry')"
    />
</template>

<script setup lang="ts">
// Props
defineProps({
    title: String as PropType<string>,
    helpText: String as PropType<string>,
    retryText: String as PropType<string>,
    retryLimitReachedText: String as PropType<string>,
    cooldownText: String as PropType<string>,
    maxRetryCycles: Number as PropType<number>,
    maxRetries: Number as PropType<number>,
    cooldownSeconds: Number as PropType<number>,
    isLoading: {
        type: Boolean as PropType<boolean>,
        required: true,
    },
    loadingText: String as PropType<string>,
    error: [String, null] as PropType<string | null>,
});

// Emits
defineEmits(["retry"]);
</script>
