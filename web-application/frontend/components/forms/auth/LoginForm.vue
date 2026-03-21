<template>
    <Form @submit="submit">
        <FormRow>
            <InputField
                id="username"
                v-model="formData.username"
                v-model:error="formErrors.username"
                :validator="validateField"
                :label="$t('Username')"
                :placeholder="$t('Enter your username')"
                icon="mdi:account-outline"
                :maxLength="FieldMaxLength.EMAIL"
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
                icon="mdi:lock-outline"
                type="password"
                :linkText="$t('Forgot your password?')"
                :linkUrl="localePath('/forgot-password')"
                :maxLength="FieldMaxLength.PASSWORD"
                required
            />
        </FormRow>
        <FormActions>
            <ActionButton
                :text="$t('Back to homepage')"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:keyboard-backspace"
                :actionType="ButtonActionType.LINK"
                :to="localePath('/')"
                isFullWidth
            />
            <ActionButton
                :text="$t('Login')"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                type="submit"
                isFullWidth
                :isLoading="isSubmitting"
                :loadingText="loadingMessages.PROCESSING"
            />
        </FormActions>
    </Form>
</template>
<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// States
const formData = reactive({
    username: "",
    password: "",
});
const isSubmitting = ref(false);

// Request IDs
const requestId = getUniqueStringId();
const thirdPartyRequestId = getUniqueStringId();

// Validators
const { formErrors, validateFormFields } = useForm({
    formData,
    requiredFields: ["username", "password"],
    validators: {
        username: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
        password: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
    },
});

// Toast
const { $toast } = useNuxtApp();

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();

const { formSubmitErrors, serverResponseErrors, formFieldValidationErrors, loadingMessages } = useTranslations(t);

// Methods
const submit = async () => {
    const isValid = validateFormFields();

    if (!isValid) {
        $toast.error(formSubmitErrors.value.REQUIRED_FIELDS, {
            toastId: "required-fields-error",
        });

        return;
    }

    isSubmitting.value = true;

    Request.Pending(
        requestId,
        ApiAuth.Login({
            username: formData.username,
            password: formData.password,
        }),
    )
        .onSuccess(async (response) => {
            isSubmitting.value = false;

            AuthController.SetSession(response.session_id);
        })
        .onCancel(() => {
            isSubmitting.value = false;
        })
        .onRequestError((err, handleErr) => {
            isSubmitting.value = false;

            handleErr(err, {
                badRequestCaptcha: () =>
                    $toast.error(serverResponseErrors.value.CAPTCHA_FAILED, {
                        toastId: "invalid-captcha",
                    }),

                badRequestInvalidCredentials: () =>
                    $toast.error(serverResponseErrors.value.INVALID_CREDENTIALS, {
                        toastId: "invalid-credentials",
                    }),

                badRequest: () =>
                    $toast.error(serverResponseErrors.value.INVALID_CREDENTIALS, {
                        toastId: "invalid-credentials",
                    }),

                forbiddenCaptcha: () =>
                    $toast.error(serverResponseErrors.value.INVALID_CREDENTIALS, {
                        toastId: "invalid-credentials",
                    }),

                forbiddenInvalidCredentials: () =>
                    $toast.error(serverResponseErrors.value.INVALID_CREDENTIALS, {
                        toastId: "invalid-credentials",
                    }),

                forbiddenUserBanned: () =>
                    $toast.error($t("The user you are trying to log into is banned from the platform"), {
                        toastId: "user-banned",
                    }),

                forbidden: () =>
                    $toast.error(serverResponseErrors.value.INVALID_CREDENTIALS, {
                        toastId: "invalid-credentials",
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

// Abort request handling
onBeforeUnmount(() => {
    Request.Abort(requestId);
    Request.Abort(thirdPartyRequestId);
    Timeouts.Abort(thirdPartyRequestId);
});
</script>
