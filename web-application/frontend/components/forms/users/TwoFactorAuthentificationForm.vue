<template>
    <Form class="max-w-[700px]">
        <template v-if="!tfa">
            <FormRow>
                <div>
                    <p class="text-sm mb-4">
                        {{ $t("Scan this QR code with your phone") }}
                    </p>
                    <QRCode
                        v-model="qrUri"
                        :isLoading
                    />
                </div>
            </FormRow>
            <FormRow>
                <InputField
                    id="single-use-code"
                    v-model="formData.singleUseCode"
                    :label="$t('Single-use code')"
                    :placeholder="$t('Enter your code')"
                    :maxLength="FieldMaxLength.SINGLE_USE_CODE"
                    type="password"
                    autocomplete="new-password"
                />
            </FormRow>
            <FormRow>
                <div class="w-full flex gap-2 items-end">
                    <InputField
                        id="totp-secret"
                        v-model="formData.totpSecret"
                        v-model:error="formErrors.totpSecret"
                        :validator="validateField"
                        :label="$t('TOTP Secret')"
                        :placeholder="$t('Enter a secret key')"
                        :maxLength="255"
                        disabled
                        required
                    />
                    <ActionIconButton
                        icon="mdi:content-copy"
                        @click="copyToClipboardWithNotification(formData.totpSecret, $t('Secret key copied to clipboard'))"
                    />
                    <ActionIconButton
                        icon="mdi:autorenew"
                        @click="debouncedGenerateQRCode"
                    />
                </div>
            </FormRow>
            <FormRow>
                <Alert
                    :type="AlertType.INFO"
                    :hasCloseButton="false"
                    :title="$t('Important')"
                    :description="
                        $t('Keep your TOTP secret key stored in a safe location in your devices before proceeding with the activation.')
                    "
                />
            </FormRow>
        </template>
        <template v-else>
            <FormRow>
                <InputField
                    id="tfaToken"
                    v-model="formData.singleUseCode"
                    v-model:error="formErrors.singleUseCode"
                    :validator="validateField"
                    :label="$t('Single-use code')"
                    :placeholder="$t('Enter your code')"
                    :maxLength="FieldMaxLength.SINGLE_USE_CODE"
                    required
                />
            </FormRow>
        </template>
        <FormActions>
            <ActionButton
                v-if="!tfa"
                :text="$t('Enable 2FA authentication')"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                isMobileFullWidth
                :isLoading="isSaving"
                :loadingText="loadingMessages.SAVING_CHANGES"
                @click="showConfirmChangeModal = true"
            />
            <ActionButton
                v-if="tfa"
                :text="$t('Disable 2FA authentication')"
                :styleType="ButtonStyleType.DELETE_SOFT"
                isMobileFullWidth
                :isLoading="isSaving"
                :loadingText="loadingMessages.SAVING_CHANGES"
                @click="disableTFA"
            />
        </FormActions>
    </Form>
    <InfoModalDialog
        v-model="showConfirmChangeModal"
        :title="$t('Please enter your password to confirm the change')"
        :showModalActions="false"
        icon="mdi:form-textbox-password"
    >
        <ConfirmUserPasswordForm
            :useTFA="tfa"
            @close="showConfirmChangeModal = false"
            @success="handlePasswordConfirmation"
        />
    </InfoModalDialog>
</template>
<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// States
const formData = reactive({
    singleUseCode: "",
    totpSecret: "",
});

const qrUri = ref("");
const tfa = ref(AuthController.RequiresTwoFactorAuthentication);

const isLoading = ref(false);
const isSaving = ref(false);

const showConfirmChangeModal = ref(false);

// Composables
const { copyToClipboardWithNotification } = useToastifiedActions();

// Request IDs
const generateQRImageRequestId = getUniqueStringId();
const enableTFARequestId = getUniqueStringId();
const disableTFARequestId = getUniqueStringId();

// Computed
const requiredFields = computed(() => {
    const fields = ["singleUseCode"];
    if (!tfa.value) {
        fields.push("totpSecret");
    }
    return fields;
});

const validators = computed(() => {
    return {
        singleUseCode: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
        ...(tfa.value === false && {
            totpSecret: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
        }),
    } as {
        singleUseCode: typeof validateField;
        totpSecret?: typeof validateField;
    };
});

// Validators
const { formErrors, validateFormFields } = useForm({
    formData,
    requiredFields: requiredFields.value,
    validators: validators.value,
});

// Toast
const { $toast } = useNuxtApp();

// Translation dependencies
const { t } = useI18n();

const { formSubmitErrors, loadingMessages, serverResponseErrors, formFieldValidationErrors } = useTranslations(t);

const { requireLogin } = useRequireLogin();
const { listenOnAppEvent } = useGlobalEvents();

// Data loaders
const load = async () => {
    Timeouts.Abort(generateQRImageRequestId);
    Request.Abort(generateQRImageRequestId);

    isLoading.value = true;

    if (!AuthController.isAuthenticated()) {
        requireLogin();
        return;
    }

    tfa.value = AuthController.RequiresTwoFactorAuthentication;

    Request.Pending(generateQRImageRequestId, ApiAccount.GenerateTFA())
        .onSuccess((generatedTFA) => {
            isLoading.value = false;
            formData.singleUseCode = "";
            formData.totpSecret = generatedTFA.secret;
            qrUri.value = generatedTFA.uri;
        })
        .onRequestError((err, handleErr) => {
            isLoading.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                temporalError: () => {
                    // Retry
                    Timeouts.Set(generateQRImageRequestId, 1500, load);
                },
            });
        })
        .onUnexpectedError((err) => {
            console.error(err);
            isLoading.value = false;

            // Retry
            Timeouts.Set(generateQRImageRequestId, 1500, load);
        });
};

const debouncedGenerateQRCode = useDebounceFn(() => {
    load();
}, 1000);

await load();

// Methods
const handlePasswordConfirmation = async (payload: { password: string }) => {
    await enableTFA(payload.password);
};

const enableTFA = async (confirmedPassword: string) => {
    const isValid = validateFormFields();

    if (!isValid) {
        $toast.error(formSubmitErrors.value.REQUIRED_FIELDS, {
            toastId: "required-fields-error",
        });

        return;
    }

    isSaving.value = true;

    Request.Pending(
        enableTFARequestId,
        ApiAccount.SetupTFA({
            secret: formData.totpSecret,
            password: confirmedPassword,
            token: formData.singleUseCode,
        }),
    )
        .onSuccess(() => {
            isSaving.value = false;

            formData.singleUseCode = "";
            tfa.value = true;

            AuthController.CheckAuthStatus();

            $toast.success($t("2FA successfully enabled"), {
                toastId: "2fa-enabled-success",
            });
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
                        toastId: "incorrect-password",
                    });
                },
                badRequestAlready: () => {
                    $toast.error($t("Two factor authentication is already enabled for this account"), {
                        toastId: "tfa-already-enabled-error",
                    });

                    AuthController.CheckAuthStatus();
                },
                badRequestInvalid: () => {
                    $toast.error(serverResponseErrors.value.INVALID_SINGLE_USE_CODE, {
                        toastId: "invalid-single-use-code",
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
            isSaving.value = false;

            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "unexpected-error",
            });
        });
};

const disableTFA = async () => {
    isSaving.value = true;

    Request.Pending(disableTFARequestId, ApiAccount.RemoveTFA({ token: formData.singleUseCode }))
        .onSuccess(() => {
            isSaving.value = false;

            formData.singleUseCode = "";
            tfa.value = true;

            AuthController.CheckAuthStatus();

            $toast.success($t("2FA successfully disabled"), {
                toastId: "2fa-enabled-success",
            });
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
                badRequestNotEnabled: () => {
                    $toast.error($t("Two factor authentication is not enabled for this account"), {
                        toastId: "tfa-account-not-enabled",
                    });

                    AuthController.CheckAuthStatus();
                },
                badRequestInvalid: () => {
                    $toast.error($t("Invalid single-use code"), {
                        toastId: "bad-request",
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
            isSaving.value = false;

            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "unexpected-error",
            });
        });
};

const onAuthChanged = () => {
    load();
};

onMounted(() => {
    listenOnAppEvent("auth-status-changed", onAuthChanged);
});

// Abort request handling
onBeforeUnmount(() => {
    Timeouts.Abort(generateQRImageRequestId);
    Request.Abort(generateQRImageRequestId);
    Timeouts.Abort(enableTFARequestId);
    Request.Abort(enableTFARequestId);
    Timeouts.Abort(disableTFARequestId);
    Request.Abort(enableTFARequestId);
});
</script>
