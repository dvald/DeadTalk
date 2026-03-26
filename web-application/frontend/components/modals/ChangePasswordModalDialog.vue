<template>
    <ModalDialog
        :modelValue="modelValue"
        cardClass="max-w-[450px]"
        :hasCornerCloseButton="false"
        @update:modelValue="updateModelValue"
    >
        <ModalContent>
            <ModalTitle :title="$t('Change account password')" />
            <ChangePasswordForm
                :requireCurrentPassword
                :closeOnSubmit
                @close="closeModal"
                @submit="submit"
            />
        </ModalContent>
    </ModalDialog>
</template>
<script setup lang="ts">
// Props
defineProps({
    modelValue: {
        type: Boolean as PropType<boolean>,
        default: false,
    },
    requireCurrentPassword: Boolean as PropType<boolean>,
    closeOnSubmit: Boolean as PropType<boolean>,
});

// Emits
const emit = defineEmits(["update:modelValue", "close", "submit"]);

// Methods
const updateModelValue = (value: boolean) => {
    emit("update:modelValue", value);
};

const closeModal = () => {
    // Emit the model update to close the modal
    updateModelValue(false);
};

const submit = (payload: string | { password: string; currentPassword: string }) => {
    emit("submit", payload);
};
</script>
