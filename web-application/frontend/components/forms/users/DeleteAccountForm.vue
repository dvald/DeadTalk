<template>
    <Form @submit="submit">
        <FormRow>
            <InputField
                id="password"
                v-model="formData.password"
                v-model:error="formErrors.password"
                :validator="validateField"
                type="password"
                :placeholder="$t('Enter your password')"
                :maxLength="FieldMaxLength.PASSWORD"
                required
            />
        </FormRow>
        <FormRow v-if="tfa">
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
                isMobileFullWidth
                @click="emit('close')"
            />
            <ActionButton
                :styleType="ButtonStyleType.DELETE_FILLED"
                :iconPosition="IconPosition.LEFT"
                type="submit"
                icon="mdi:delete-forever-outline"
                :text="$t('Delete account')"
                :isLoading
                isMobileFullWidth
            />
        </FormActions>
    </Form>
</template>
<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// States
const formData = reactive({
    password: "",
    token: "",
});
const tfa = ref(AuthController.RequiresTwoFactorAuthentication);
const isLoading = ref(false);

// Request IDs
const requestId = getUniqueStringId();

// Emits
const emit = defineEmits(["close"]);

// Validators
const requiredFields = ["password"];
if (tfa.value) {
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

// Translation dependencies
const { t } = useI18n();
const { formSubmitErrors, serverResponseErrors, formFieldValidationErrors } = useTranslations(t);

const { requireLogin } = useRequireLogin();

// Methods
const submit = async () => {
    const isValid = validateFormFields();

    if (!isValid) {
        $toast.error(formSubmitErrors.value.REQUIRED_FIELDS, {
            toastId: "required-fields-error",
        });

        return;
    }

    isLoading.value = true;

    Request.Pending(requestId, ApiAccount.DeleteAccount({ tfa_token: formData.token, password: formData.password }))
        .onSuccess(() => {
            isLoading.value = false;

            // Refresh
            AuthController.CheckAuthStatus();

            AuthController.Logout();
        })
        .onCancel(() => {
            isLoading.value = false;
        })
        .onRequestError((err, handleErr) => {
            isLoading.value = false;
            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                badRequestInvalidTfaCode: () => {
                    $toast.error(serverResponseErrors.value.INVALID_SINGLE_USE_CODE, {
                        toastId: "invalid-one-time-password",
                    });
                },
                badRequestWrongPassword: () => {
                    $toast.error(serverResponseErrors.value.INCORRECT_PASSWORD, {
                        toastId: "wrong-password",
                    });
                },
                badRequest: () => {
                    $toast.error(serverResponseErrors.value.BAD_REQUEST, {
                        toastId: "bad-request",
                    });
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
            $toast.error(err.message, {
                toastId: "unexpected-error",
            });
            console.error(err);
        });
};

// Abort request handling
onBeforeUnmount(() => {
    Request.Abort(requestId);
});
</script>
