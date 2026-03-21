<template>
    <Form @submit="submit">
        <FormRow>
            <InputField
                id="single-use-code"
                v-model="formData.singleUseCode"
                v-model:error="formErrors.singleUseCode"
                :validator="validateField"
                type="password"
                :label="$t('Single-use code')"
                :placeholder="$t('Enter your code')"
                :maxLength="FieldMaxLength.SINGLE_USE_CODE"
                autocomplete="new-password"
                required
            />
        </FormRow>
        <FormActions>
            <ActionButton
                :text="$t('Go back')"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:keyboard-backspace"
                :actionType="ButtonActionType.LINK"
                :to="localePath(`/${AppSlug.LOGIN}`)"
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
    singleUseCode: "",
});
const isSubmitting = ref(false);

// Request IDs
const requestId = getUniqueStringId();

// Stores
const isLoggedIn = ref(AuthController.isAuthenticated());

// Validators
const { formErrors, validateFormFields } = useForm({
    formData,
    requiredFields: ["singleUseCode"],
    validators: {
        singleUseCode: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
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

    Request.Do(ApiAuth.LoginTFA({ captcha: undefined, token: formData.singleUseCode }))
        .onSuccess(() => {
            isSubmitting.value = false;
            AuthController.CheckAuthStatus();

            isLoggedIn.value = true;
        })
        .onCancel(() => {
            isSubmitting.value = false;
        })
        .onRequestError((err, handleErr) => {
            isSubmitting.value = false;

            handleErr(err, {
                unauthorized: () => {
                    AuthController.Logout();
                },
                badRequestCaptcha: () => {
                    $toast.error(serverResponseErrors.value.CAPTCHA_FAILED, {
                        toastId: "invalid-captcha",
                    });
                },
                badRequest: () => {
                    $toast.error(serverResponseErrors.value.INVALID_SINGLE_USE_CODE, {
                        toastId: "invalid-password",
                    });
                },
                forbiddenInvalidCode: () => {
                    $toast.error(serverResponseErrors.value.CAPTCHA_FAILED, {
                        toastId: "invalid-captcha",
                    });
                },
                forbidden: () => {
                    $toast.error(serverResponseErrors.value.INVALID_SINGLE_USE_CODE, {
                        toastId: "invalid-password",
                    });
                },
                notFound: () => {
                    AuthController.Logout();
                },
                serverError: () => {
                    $toast.error(serverResponseErrors.value.INTERNAL_SERVER_ERROR, {
                        toastId: "server-error",
                    });
                },
                networkError: () => {
                    $toast.error(serverResponseErrors.value.NETWORK_ERROR, {
                        toastId: "network-error",
                    });
                },
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
});
</script>
