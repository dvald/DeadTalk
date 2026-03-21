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
                :maxLength="FieldMaxLength.EMAIL"
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
                :text="$t('Recover')"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                type="submit"
                isFullWidth
                :isLoading="isSubmitting"
                :loadingText="loadingMessages.SUBMITTING"
            />
        </FormActions>
    </Form>
    <SuccessModalDialog
        v-model="showModal"
        :title="$t('Password recovery request sent')"
        :description="$t('We’ve sent a recovery link to your email address. Follow the instructions to reset your password.')"
        icon="mdi:email-fast-outline"
        @close="closeModal"
    />
</template>
<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// States
const formData = reactive({
    email: "",
});
const isSubmitting = ref(false);
const showModal = ref(false);

// Validators
const { formErrors, validateFormFields } = useForm({
    formData,
    requiredFields: ["email"],
    validators: {
        email: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
    },
});

// Toast
const { $toast } = useNuxtApp();

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();

const { formSubmitErrors, loadingMessages, serverResponseErrors, formFieldValidationErrors } = useTranslations(t);

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

    Request.Do(
        ApiAuth.RequestPasswordReset({
            email: formData.email,
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
                badRequestCaptcha: () =>
                    $toast.error(serverResponseErrors.value.CAPTCHA_FAILED, {
                        toastId: "invalid-captcha",
                    }),

                badRequestEmailInvalid: () =>
                    $toast.error($t("Invalid email provided"), {
                        toastId: "invalid-email",
                    }),

                badRequest: () =>
                    $toast.error($t("Invalid email provided"), {
                        toastId: "invalid-email",
                    }),

                notFound: () =>
                    $toast.error($t("We did not find any account with the provided email"), {
                        toastId: "email-not-found",
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

const closeModal = () => {
    showModal.value = false;

    navigateTo(localePath(`/${AppSlug.LOGIN}`));
};
</script>
