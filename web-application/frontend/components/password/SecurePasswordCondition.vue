<template>
    <div :class="['flex', 'flex-row', 'items-center', 'self-stretch', 'gap-2']">
        <Icon
            :name="isValid ? 'mdi:check' : 'mdi:close'"
            :size="IconSize.SM"
            :iconClass="[isValid ? 'text-icon-success-subtle' : 'text-text-neutral-subtle']"
        />
        <span :class="['text-sm', isValid ? 'text-success-default' : 'text-text-neutral-subtle']">
            {{ label }}
        </span>
    </div>
</template>
<script setup lang="ts">
// Props
defineProps({
    label: {
        type: String as PropType<string>,
        default: "Condition label",
    },
    isValid: {
        type: Boolean as PropType<boolean>,
        required: true,
    },
});
</script>
