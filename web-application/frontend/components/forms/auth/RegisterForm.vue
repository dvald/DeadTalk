<template>
    <Form @submit="submit">
        <FormRow>
            <InputField
                id="email"
                v-model="formData.email"
                v-model:error="formErrors.email"
                :validator="validateField"
                :label="$t('Email')"
                :placeholder="$t('Ex.: john.steward@mail.com')"
                icon="mdi:at"
                type="email"
                :maxLength="FieldMaxLength.EMAIL"
                required
            />
        </FormRow>
        <FormRow>
            <InputField
                id="username"
                v-model="formData.username"
                v-model:error="formErrors.username"
                :validator="validateField"
                :label="$t('Username')"
                :placeholder="$t('Ex.: jsteward')"
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
                type="password"
                :maxLength="FieldMaxLength.PASSWORD"
                autocomplete="new-password"
                required
            />
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
                @click="generatePassword"
            />
        </FormRow>
        <FormRow>
            <SecurePasswordConditions
                :password="formData.password"
                :repeatPassword="formData.repeatPassword"
            />
        </FormRow>
        <FormActions class="justify-between">
            <ActionButton
                :text="$t('Go to login')"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:keyboard-backspace"
                :actionType="ButtonActionType.LINK"
                :to="localePath(`/${AppSlug.LOGIN}`)"
                isMobileFullWidth
            />
            <ActionButton
                :text="$t('Create account')"
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
        :title="$t('Account created')"
        :description="$t('A verification link has been sent to your email. Once verified, you can log in.')"
        @close="close"
    />
</template>
<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// States
const formData = reactive({
    email: "",
    username: "",
    password: "",
    repeatPassword: "",
});
const isSubmitting = ref(false);
const showModal = ref(false);

// Validators
const { formErrors, validateFormFields } = useForm({
    formData,
    requiredFields: ["email", "username", "password", "repeatPassword"],
    validators: {
        email: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
        username: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
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
const { locale } = useI18n();
const localePath = useLocalePath();
const { t } = useI18n();
const { formSubmitErrors, loadingMessages, serverResponseErrors, formFieldValidationErrors, appNotifications } = useTranslations(t);

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

    Request.Do(
        ApiAuth.Signup({
            email: formData.email,
            username: formData.username,
            password: formData.password,
            locale: locale.value,
        }),
    )
        .onSuccess((res) => {
            isSubmitting.value = false;

            if (res.session_id) {
                AuthController.SetSession(res.session_id);
            } else {
                showModal.value = true;
            }
        })
        .onCancel(() => {
            isSubmitting.value = false;
        })
        .onRequestError((err, handleErr) => {
            isSubmitting.value = false;

            handleErr(err, {
                badRequestCaptcha: () =>
                    $toast.error(serverResponseErrors.value.CAPTCHA_FAILED, {
                        toastId: "signup-invalid-captcha",
                    }),

                badRequestUsernameInvalid: () =>
                    $toast.error($t("Invalid username provided"), {
                        toastId: "signup-invalid-username",
                    }),

                badRequestUsernameInUse: () =>
                    $toast.error($t("The provided username is already in use"), {
                        toastId: "signup-username-in-use",
                    }),

                badRequestWeakPassword: () =>
                    $toast.error($t("The provided password is too short"), {
                        toastId: "signup-weak-password",
                    }),

                badRequestEmailInvalid: () =>
                    $toast.error($t("Invalid email provided"), {
                        toastId: "signup-invalid-email",
                    }),

                badRequestEmailInUse: () =>
                    $toast.error($t("The provided email is already in use"), {
                        toastId: "signup-email-in-use",
                    }),

                badRequest: () =>
                    $toast.error(serverResponseErrors.value.BAD_REQUEST, {
                        toastId: "signup-bad-request",
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

const close = () => {
    showModal.value = false;

    navigateTo(localePath(`/${AppSlug.LOGIN}`));
};
</script>
