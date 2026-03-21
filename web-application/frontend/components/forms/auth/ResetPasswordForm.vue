<template>
    <Form @submit="submit">
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
                :text="$t('Reset password')"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                type="submit"
                isMobileFullWidth
                :isLoading="isSubmitting"
                :loadingText="loadingMessages.SUBMITTING"
            />
        </FormActions>
    </Form>
    <SuccessModalDialog
        v-model="showModal"
        :title="$t('Password reset successfully')"
        :description="$t('You’ve created a new password successfully. You can now log in.')"
        @close="closeModal"
    />
</template>
<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// States
const formData = reactive({
    password: "",
    repeatPassword: "",
});
const isSubmitting = ref(false);
const showModal = ref(false);

// Validators
const { formErrors, validateFormFields } = useForm({
    formData,
    requiredFields: ["password", "repeatPassword"],
    validators: {
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

// Toast
const { $toast } = useNuxtApp();

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();
const { formSubmitErrors, loadingMessages, serverResponseErrors, formFieldValidationErrors, appNotifications } = useTranslations(t);

// Composables
const { copyToClipboardWithNotification } = useToastifiedActions();

// Route
const route = useRoute();

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

    Request.Do(
        ApiAuth.ResetAccountPassword({
            uid: String(route.params.uid),
            verification: String(route.params.token),
            password: formData.password,
        }),
    )
        .onSuccess(() => {
            isSubmitting.value = false;
            showModal.value = true;
        })
        .onCancel(() => {
            isSubmitting.value = false;
        })
        .onRequestError((err, handleErr) => {
            isSubmitting.value = false;

            handleErr(err, {
                badRequestWeakPassword: () =>
                    $toast.error($t("The provided password is too short"), {
                        toastId: "reset-password-weak",
                    }),

                badRequest: () =>
                    $toast.error($t("Invalid password provided"), {
                        toastId: "reset-password-invalid",
                    }),

                notFound: () =>
                    $toast.error($t("This verification link is either invalid or has expired"), {
                        toastId: "reset-password-link-invalid",
                    }),

                serverError: () =>
                    $toast.error(serverResponseErrors.value.INTERNAL_SERVER_ERROR, {
                        toastId: "server-error",
                    }),

                networkError: () =>
                    $toast.error(serverResponseErrors.value.NETWORK_ERROR, {
                        toastId: "network-error",
                    }),
            });
        })
        .onUnexpectedError((err) => {
            isSubmitting.value = false;

            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "unexpected-error",
            });
        });
};

const generatePassword = () => {
    formData.password = generateSecurePassword();
    formData.repeatPassword = formData.password;

    copyToClipboardWithNotification(formData.password, appNotifications.value.SECURE_PASSWORD_COPIED_TO_CLIPBOARD);
};

const closeModal = () => {
    showModal.value = false;

    navigateTo(localePath(`/${AppSlug.LOGIN}`));
};
</script>
