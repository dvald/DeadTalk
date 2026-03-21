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
                required
            />
        </FormRow>
        <FormRow>
            <InputField
                id="new-password"
                v-model="formData.newPassword"
                v-model:error="formErrors.newPassword"
                :validator="validateField"
                :label="$t('New password')"
                placeholder="*********"
                type="password"
                :maxLength="FieldMaxLength.PASSWORD"
                autocomplete="new-password"
                required
            />
        </FormRow>
        <FormRow>
            <InputField
                id="repeat-new-password"
                v-model="formData.repeatNewPassword"
                v-model:error="formErrors.repeatNewPassword"
                :validator="(value) => validatePasswordMatch(value, formData.repeatNewPassword)"
                :label="$t('Repeat new password')"
                placeholder="*********"
                type="password"
                autocomplete="new-password"
                :maxLength="FieldMaxLength.PASSWORD"
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
                :password="formData.newPassword"
                :repeatPassword="formData.repeatNewPassword"
            />
        </FormRow>
        <FormActions>
            <ActionButton
                :text="$t('Save changes')"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:content-save-outline"
                type="submit"
                isMobileFullWidth
                :isLoading="isSaving"
                :isLoadingText="loadingMessages.SAVING_CHANGES"
            />
        </FormActions>
    </Form>
</template>
<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// Props
const props = defineProps({
    requireCurrentPassword: {
        type: Boolean as PropType<boolean>,
        default: true,
    },
});

// States
const formData = reactive({
    currentPassword: "",
    newPassword: "",
    repeatNewPassword: "",
});

const isSaving = ref(false);

// Request IDs
const requestId = getUniqueStringId();

// Composables
const { isRouteCurrentUser } = useRoutes();

// Route
const route = useRoute();
const userId = computed(() => {
    return isRouteCurrentUser.value ? AuthController.UID : String(route.params.userId);
});

// Computed
const requiredFields = computed(() => {
    const fields = ["newPassword", "repeatNewPassword"];
    if (props.requireCurrentPassword) {
        fields.unshift("currentPassword");
    }
    return fields;
});

const validators = computed(() => {
    return {
        ...(props.requireCurrentPassword && { currentPassword: validateField }),
        newPassword: (value: unknown) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
        repeatNewPassword: (value: unknown) =>
            validatePasswordMatch(
                formData.newPassword,
                value,
                formFieldValidationErrors.value.REQUIRED_FIELD,
                formFieldValidationErrors.value.PASSWORDS_MISMATCH,
            ),
    };
});

// Validators
const { formErrors, validateFormFields, resetForm } = useForm({
    formData,
    requiredFields: requiredFields.value,
    validators: validators.value,
});

const { $toast } = useNuxtApp();

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();
const { formSubmitErrors, formFieldValidationErrors, serverResponseErrors, formSubmitMessages, loadingMessages, appNotifications } =
    useTranslations(t);

// Composables
const { copyToClipboardWithNotification } = useToastifiedActions();
const { requireLogin } = useRequireLogin();
const { listenOnAppEvent } = useGlobalEvents();

// Methods
const submit = async () => {
    const isValid = validateFormFields();
    const passwordMatchError = formErrors.repeatNewPassword;

    const hasErrors = !isValid || !!passwordMatchError;

    if (hasErrors) {
        if (!isValid) {
            $toast.error($t(formSubmitErrors.value.REQUIRED_FIELDS), {
                toastId: "required-fields-error",
            });
        } else if (passwordMatchError) {
            $toast.error(formSubmitErrors.value.PASSWORD_MISMATCH, {
                toastId: "password-mismatch",
            });
        }

        return;
    }

    isSaving.value = true;

    if (isRouteCurrentUser.value) {
        await changeCurrentUserPassword();
    } else {
        await changeManagedUserPassword();
    }

    isSaving.value = false;
};

const changeCurrentUserPassword = async () => {
    Request.Pending(
        requestId,
        ApiAccount.ChangePassword({
            old_password: formData.currentPassword,
            new_password: formData.newPassword,
        }),
    )
        .onSuccess(() => {
            isSaving.value = false;

            AuthController.CheckAuthStatus();

            $toast.success(formSubmitMessages.value.CHANGES_SAVED, {
                toastId: "changes-saved",
            });

            resetForm();
        })
        .onCancel(() => {
            isSaving.value = false;
        })
        .onRequestError((err, handleErr) => {
            isSaving.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                badRequestWrongPassword: () => {
                    $toast.error(serverResponseErrors.value.INCORRECT_PASSWORD, {
                        toastId: "wrong-password",
                    });
                },
                badRequestWeakPassword: () => {
                    $toast.error($t("The provided password is too short"), {
                        toastId: "weak-password",
                    });
                },
                badRequest: () => {
                    $toast.error(serverResponseErrors.value.BAD_REQUEST, {
                        toastId: "bad-request",
                    });
                },
                serverError: () => {
                    $toast.error(serverResponseErrors.value.INTERNAL_SERVER_ERROR, {
                        toastId: "enable-server-error",
                    });
                },
                networkError: () => {
                    $toast.error(serverResponseErrors.value.NETWORK_ERROR, {
                        toastId: "enable-network-error",
                    });
                },
            });
        })
        .onUnexpectedError((err) => {
            isSaving.value = false;

            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "unexpected-error",
            });
        });
};

const changeManagedUserPassword = async () => {
    Request.Pending(requestId, ApiUsersAdmin.ChangePasswordFromAdmin(userId.value, { password: formData.newPassword }))
        .onSuccess(() => {
            isSaving.value = false;

            $toast.success(formSubmitMessages.value.CHANGES_SAVED, {
                toastId: "changes-saved",
            });

            resetForm();
        })
        .onCancel(() => {
            isSaving.value = false;
        })
        .onRequestError((err, handleErr) => {
            handleErr(err, {
                unauthorized: () => {
                    navigateTo(localePath(`/${AppSlug.LOGIN}`));
                },
                badRequestWeakPassword: () => {
                    $toast.error($t("The provided password is too short"), {
                        toastId: "weak-password",
                    });
                },
                badRequest: () => {
                    $toast.error(serverResponseErrors.value.BAD_REQUEST, {
                        toastId: "bad-request",
                    });
                },
                notFound: () => {
                    $toast.error($t("User not found"), {
                        toastId: "user-not-found",
                    });
                },
                forbidden: () => {
                    $toast.error(serverResponseErrors.value.FORBIDDEN_ACTION, {
                        toastId: "enable-forbidden",
                    });
                },
                serverError: () => {
                    $toast.error(serverResponseErrors.value.INTERNAL_SERVER_ERROR, {
                        toastId: "enable-server-error",
                    });
                },
                networkError: () => {
                    $toast.error(serverResponseErrors.value.NETWORK_ERROR, {
                        toastId: "enable-network-error",
                    });
                },
            });
        })
        .onUnexpectedError((err) => {
            isSaving.value = false;

            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "unexpected-error",
            });
        });
};

const generatePassword = () => {
    formData.newPassword = generateSecurePassword();
    formData.repeatNewPassword = formData.newPassword;

    copyToClipboardWithNotification(formData.newPassword, appNotifications.value.SECURE_PASSWORD_COPIED_TO_CLIPBOARD);
};

const onAuthChanged = () => {
    if (!AuthController.isAuthenticated()) {
        requireLogin();
    }
};

onMounted(() => {
    listenOnAppEvent("auth-status-changed", onAuthChanged);
});

// Abort request handling
onBeforeUnmount(() => {
    Request.Abort(requestId);
});
</script>
