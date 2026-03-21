<template>
    <Form @submit="submit">
        <FormRow v-if="requireCurrentPassword">
            <InputField
                id="current-password"
                v-model="formData.currentPassword"
                v-model:error="formErrors.currentPassword"
                :validator="validateField"
                :label="$t('Current password')"
                placeholder="*********"
                type="password"
                :maxLength="FieldMaxLength.PASSWORD"
                autocomplete="new-password"
                required
            />
        </FormRow>
        <FormRow>
            <InputField
                id="password"
                v-model="formData.password"
                v-model:error="formErrors.password"
                :validator="validateField"
                :label="$t('Password')"
                placeholder="*********"
                type="password"
                :maxLength="FieldMaxLength.PASSWORD"
                autocomplete="new-password"
                required
            />
        </FormRow>
        <FormRow>
            <InputField
                id="repeat-password"
                v-model="formData.repeatPassword"
                v-model:error="formErrors.repeatPassword"
                :validator="(value) => validatePasswordMatch(value, formData.repeatPassword)"
                :label="$t('Repeat password')"
                placeholder="*********"
                type="password"
                :maxLength="FieldMaxLength.PASSWORD"
                autocomplete="new-password"
                required
            />
        </FormRow>
        <FormRow>
            <ActionButton
                :styleType="ButtonStyleType.PRIMARY_BRAND_SOFT"
                :text="$t('Generate secure password')"
                isFullWidth
                @click="generatePassword"
            />
        </FormRow>
        <FormRow>
            <SecurePasswordConditions
                :password="formData.password"
                :repeatPassword="formData.repeatPassword"
            />
        </FormRow>
        <FormActions class="justify-end">
            <ActionButton
                :text="$t('Cancel')"
                isFullWidth
                @click="emit('close')"
            />
            <ActionButton
                :text="$t('Reset password')"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                type="submit"
                isFullWidth
            />
        </FormActions>
    </Form>
</template>
<script setup lang="ts">
// Props
const props = defineProps({
    requireCurrentPassword: {
        type: Boolean as PropType<boolean>,
        default: false,
    },
    closeOnSubmit: {
        type: Boolean as PropType<boolean>,
        default: true,
    },
});

// States
const formData = reactive({
    currentPassword: "",
    password: "",
    repeatPassword: "",
});

// Validators
const requiredFields = ["password", "repeatPassword"];
if (props.requireCurrentPassword) {
    requiredFields.unshift("currentPassword");
}

const { formErrors, validateFormFields } = useForm({
    formData,
    requiredFields,
    validators: {
        currentPassword: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
        password: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
        repeatPassword: (value) =>
            validatePasswordMatch(
                formData.password,
                value,
                formFieldValidationErrors.value.REQUIRED_FIELD,
                formFieldValidationErrors.value.PASSWORDS_MISMATCH,
            ),
    },
});

// Emits
const emit = defineEmits(["close", "submit"]);

// Toast
const { $toast } = useNuxtApp();

// Translation dependencies
const { t } = useI18n();
const { formSubmitErrors, formFieldValidationErrors, appNotifications } = useTranslations(t);

// Composables
const { copyToClipboardWithNotification } = useToastifiedActions();

// Methods
const submit = async () => {
    const isValid = validateFormFields();
    const passwordMatchError = formErrors.repeatPassword;
    const isInsecurePassword = mustCheckPasswordSecurity() && !isSecurePassword(formData.password);

    const hasErrors = !isValid || !!passwordMatchError || isInsecurePassword;

    if (hasErrors) {
        if (!isValid) {
            $toast.error(formSubmitErrors.value.REQUIRED_FIELDS, {
                toastId: "required-fields-error",
            });
        } else if (passwordMatchError) {
            $toast.error(formSubmitErrors.value.PASSWORD_MISMATCH, {
                toastId: "password-mismatch",
            });
        } else if (isInsecurePassword) {
            $toast.error(formSubmitErrors.value.INSECURE_PASSWORD, {
                toastId: "insecure-password",
            });
        }

        return;
    }

    const payload = {
        password: formData.password,
        ...(props.requireCurrentPassword && { currentPassword: formData.currentPassword }),
    };

    emit("submit", payload);

    if (props.closeOnSubmit) {
        emit("close");
    }
};

const generatePassword = () => {
    formData.password = generateSecurePassword();
    formData.repeatPassword = formData.password;

    copyToClipboardWithNotification(formData.password, appNotifications.value.SECURE_PASSWORD_COPIED_TO_CLIPBOARD);
};
</script>
