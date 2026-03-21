<template>
    <Form @submit="submit">
        <FormRow>
            <InputField
                id="password"
                v-model="formData.password"
                v-model:error="formErrors.password"
                :validator="validateField"
                type="password"
                :label="$t('Password')"
                :placeholder="$t('Enter your password')"
                :maxLength="FieldMaxLength.PASSWORD"
                required
            />
        </FormRow>
        <FormRow v-if="useTFA">
            <InputField
                id="token"
                v-model="formData.token"
                v-model:error="formErrors.token"
                :validator="validateField"
                type="password"
                :label="$t('Single-use code')"
                :placeholder="$t('Enter your code')"
                :maxLength="FieldMaxLength.SINGLE_USE_CODE"
                autocomplete="new-password"
                required
            />
        </FormRow>
        <FormActions class="justify-end">
            <ActionButton
                :text="$t('Close')"
                isFullWidth
                @click="emit('close')"
            />
            <ActionButton
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                type="submit"
                :text="$t('Confirm')"
                :isLoading
                isFullWidth
            />
        </FormActions>
    </Form>
</template>
<script setup lang="ts">
// Props
const props = defineProps({
    useTFA: {
        type: Boolean as PropType<boolean>,
        default: false,
    },
});

// States
const formData = reactive({
    password: "",
    token: "",
});

const isLoading = ref(false);

// Emits
const emit = defineEmits(["close", "success"]);

// Validators
const requiredFields = ["password"];
if (props.useTFA) {
    requiredFields.unshift("token");
}

const { formErrors, validateFormFields } = useForm({
    formData,
    requiredFields,
    validators: {
        password: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
        token: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
    },
});

// Toast
const { $toast } = useNuxtApp();

const { t } = useI18n();

// Translation dependencies
const { formSubmitErrors, formFieldValidationErrors } = useTranslations(t);

// Methods
const submit = async () => {
    const isValid = validateFormFields();

    if (!isValid) {
        $toast.error(formSubmitErrors.value.REQUIRED_FIELDS, {
            toastId: "required-fields-error",
        });

        return;
    }

    try {
        isLoading.value = true;

        const payload = {
            password: formData.password,
            ...(props.useTFA && { token: formData.token }),
        };

        emit("close");
        emit("success", payload);
    } catch (error) {
        $toast.error(error, {
            toastId: "delete-account-error",
        });
    } finally {
        isLoading.value = false;
    }
};
</script>
