<template>
    <Form @submit="submitConditionally">
        <FormRow>
            <InputField
                id="username"
                v-model="formData.username"
                v-model:error="formErrors.username"
                :validator="validateField"
                :label="$t('Username')"
                :placeholder="$t('Ex.: jsteward')"
                :maxLength="FieldMaxLength.USERNAME"
                required
            />
            <InputField
                id="email"
                v-model="formData.email"
                v-model:error="formErrors.email"
                :validator="validateEmail"
                :label="$t('Email')"
                type="email"
                :placeholder="$t('Ex.: jsteward')"
                :maxLength="FieldMaxLength.EMAIL"
                required
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
                :isLoading="isSubmitting"
            />
        </FormActions>
    </Form>

    <!-- Current account -->
    <template v-if="isRouteCurrentUser && AuthController.Role !== 'admin'">
        <Divider />

        <div :class="['flex', 'gap-4', 'w-full', 'flex-col md:flex-row']">
            <ActionButton
                :styleType="ButtonStyleType.DELETE_FILLED"
                :iconPosition="IconPosition.RIGHT"
                icon="mdi:delete-forever-outline"
                :size="ButtonSize.SM"
                :text="$t('Delete account')"
                @click="showDeleteUserModal = true"
            />
        </div>
    </template>

    <!-- Managed user pages -->
    <template v-else-if="!isRouteCurrentUser && can.banUsers">
        <Divider />

        <div :class="['flex', 'gap-4', 'w-full', 'flex-col md:flex-row']">
            <!-- An admin cannot delete / manage banned state on its own account -->
            <template v-if="!isRouteCurrentUser && isUserBanned !== null && !isLoadingBanState">
                <ActionButton
                    v-if="isUserBanned"
                    :styleType="ButtonStyleType.PRIMARY_BRAND_SOFT"
                    :iconPosition="IconPosition.RIGHT"
                    icon="mdi:account-reactivate-outline"
                    :size="ButtonSize.SM"
                    :text="$t('Enable account')"
                    @click="showEnableUserModal = true"
                />
                <ActionButton
                    v-else
                    :styleType="ButtonStyleType.DELETE_SOFT"
                    :iconPosition="IconPosition.RIGHT"
                    icon="mdi:account-off-outline"
                    :size="ButtonSize.SM"
                    :text="$t('Disable account')"
                    @click="showDisableUserModal = true"
                />
            </template>
        </div>
    </template>

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

    <!-- Delete confirmation for your account -->
    <DangerModalDialog
        v-model="showDeleteUserModal"
        :title="$t('Are you sure you want to delete your account?')"
        :description="$t('Once confirmed, your account will be deleted forever and cannot be undone.')"
        :showModalActions="false"
    >
        <DeleteAccountForm @close="showDeleteUserModal = false" />
    </DangerModalDialog>

    <!-- Disable the account (ban the user) if its a different account than ours -->
    <DangerModalDialog
        v-model="showDisableUserModal"
        :title="$t('Are you sure you want to disable this account?')"
        :description="$t('Once confirmed, this account will remain inaccessible until it is reactivated.')"
        :buttonCloseText="$t('Close')"
        :buttonActionText="$t('Disable account')"
        buttonActionIcon="mdi:account-off-outline"
        :isLoading="isProcessingUserState"
        @action="disableUserAccount"
    />

    <!-- Enable the account (ban the user) if its a different account than ours -->
    <InfoModalDialog
        v-model="showEnableUserModal"
        :title="$t('Are you sure you want to enable this account?')"
        :description="$t('Once confirmed, this account will be reactivated.')"
        :buttonCloseText="$t('Close')"
        :buttonActionText="$t('Enable account')"
        buttonActionIcon="mdi:account-reactivate-outline"
        :isLoading="isProcessingUserState"
        @action="enableUserAccount"
    />
</template>
<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// Props
const props = defineProps({
    username: {
        type: String as PropType<string>,
        required: true,
    },
    email: {
        type: String as PropType<string>,
        required: true,
    },
});

// States
const formData = reactive({
    username: props.username,
    email: props.email,
});

const password = ref("");
const tfa = ref(AuthController.RequiresTwoFactorAuthentication);
const token = ref("");

const lastUsedUsername = ref(props.username);
const lastUsedEmail = ref(props.email);

const isSubmitting = ref(false);
const isLoadingBanState = ref(false);
const isUserBanned = ref<boolean | null>(null);

const showDisableUserModal = ref(false);
const showEnableUserModal = ref(false);
const showDeleteUserModal = ref(false);
const showConfirmChangeModal = ref(false);
const isProcessingUserState = ref(false);

// Request IDs
const usernameUpdateRequestId = getUniqueStringId();
const emailUpdateRequestId = getUniqueStringId();
const banStatusRequestId = getUniqueStringId();
const disableUserRequestId = getUniqueStringId();
const enableUserRequestId = getUniqueStringId();

// Composables
const { t } = useI18n();
const { isRouteCurrentUser } = useRoutes();
const { can } = usePermissions(t);

// Route
const route = useRoute();
const userId = computed(() => String(route.params.userId || ""));

// Validators
const { formErrors, validateFormFields } = useForm({
    formData,
    requiredFields: ["username", "email"],
    validators: {
        username: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
        email: (value) =>
            validateEmail(value, formFieldValidationErrors.value.REQUIRED_FIELD, formFieldValidationErrors.value.INVALID_EMAIL),
    },
});

// Toast
const { $toast } = useNuxtApp();

// Translation dependencies
const { formSubmitErrors, serverResponseErrors, formFieldValidationErrors } = useTranslations(t);

// Methods
const handlePasswordConfirmation = async ({ password: confirmedPassword, token: confirmedToken }: { password: string; token: string }) => {
    password.value = confirmedPassword;
    token.value = confirmedToken;

    await submit();

    // Clear sensitive data
    password.value = "";
    token.value = "";
};

const submitConditionally = async () => {
    const isValid = validateFormFields();

    if (!isValid) {
        $toast.error(formSubmitErrors.value.REQUIRED_FIELDS, {
            toastId: "required-fields-error",
        });
        return;
    }

    // Check if username and email has changed since the last submit
    const usernameChanged = formData.username !== lastUsedUsername.value;
    const emailChanged = formData.email !== lastUsedEmail.value;

    const shouldConfirm = isRouteCurrentUser.value && AuthController.Role !== "admin" && (usernameChanged || emailChanged);

    if (shouldConfirm) {
        showConfirmChangeModal.value = true;
    } else {
        await submit();
    }
};

const submit = async () => {
    try {
        isSubmitting.value = true;

        const usernameChanged = formData.username !== lastUsedUsername.value;
        const emailChanged = formData.email !== lastUsedEmail.value;

        // Call updates based on what changed
        const updatePromises: Promise<void>[] = [];

        // Username and email updates use different methods depending if its the current user or an admin managing other users
        if (usernameChanged) {
            if (isRouteCurrentUser.value) {
                updatePromises.push(
                    updateUsername(usernameUpdateRequestId, {
                        username: formData.username,
                        password: password.value,
                        tfaToken: token.value,
                    }),
                );
            } else if (AuthController.Role === "admin" || can.value.manageUsers || can.value.moderateUsers) {
                updatePromises.push(updateUsernameAsAdmin(usernameUpdateRequestId, userId.value, formData.username));
            }
        }

        if (emailChanged) {
            if (isRouteCurrentUser.value) {
                updatePromises.push(
                    updateUserEmail(emailUpdateRequestId, {
                        email: formData.email,
                        password: password.value,
                        tfaToken: token.value,
                    }),
                );
            } else if (AuthController.Role === "admin" || can.value.manageUsers || can.value.moderateUsers) {
                updatePromises.push(updateUserEmailAsAdmin(emailUpdateRequestId, userId.value, formData.email));
            }
        }

        await Promise.all(updatePromises);

        const successMessage = emailChanged
            ? $t("Check your inbox for an email we have sent to your new email in order to verify it and complete the change.")
            : $t("Changes saved");

        $toast.success(successMessage, {
            toastId: "changes-saved",
        });

        // Sync local refs with new values
        if (usernameChanged) {
            lastUsedUsername.value = formData.username;
        }

        if (emailChanged) {
            lastUsedEmail.value = formData.email;
        }
    } catch (error) {
        $toast.error(error, {
            toastId: "update-error",
        });
    } finally {
        isSubmitting.value = false;
    }
};

const { requireLogin } = useRequireLogin();

const updateUsername = (
    requestId: string,
    formData: {
        username: string;
        password: string;
        tfaToken?: string;
    },
): Promise<void> => {
    return new Promise((resolve, reject) => {
        Request.Pending(
            requestId,
            ApiAccount.ChangeUsername({
                username: formData.username,
                password: formData.password,
                tfa_token: formData.tfaToken,
            }),
        )
            .onSuccess(() => {
                // Refresh
                AuthController.CheckAuthStatus();

                if (isRouteCurrentUser.value) {
                    AuthController.Username = formData.username;
                }

                resolve();
            })
            .onCancel(() => {
                reject(new Error($t("Request was cancelled")));
            })
            .onRequestError((err, handleErr) => {
                handleErr(err, {
                    unauthorized: () => {
                        requireLogin();
                    },
                    badRequestInvalidTfaCode: () => {
                        reject(new Error(serverResponseErrors.value.INVALID_SINGLE_USE_CODE));
                    },
                    badRequestUsernameInvalid: () => {
                        reject(new Error($t("Invalid username provided")));
                    },
                    badRequestUsernameInUse: () => {
                        reject(new Error($t("The provided username is already in use")));
                    },
                    badRequestWrongPassword: () => {
                        reject(new Error(serverResponseErrors.value.INCORRECT_PASSWORD));
                    },
                    badRequest: () => {
                        reject(new Error(serverResponseErrors.value.BAD_REQUEST));
                    },
                    serverError: () => {
                        reject(new Error(serverResponseErrors.value.INTERNAL_SERVER_ERROR));
                    },
                    networkError: () => {
                        reject(new Error(serverResponseErrors.value.NETWORK_ERROR));
                    },
                });
            })
            .onUnexpectedError((err) => {
                reject(new Error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR));
            });
    });
};

const updateUsernameAsAdmin = (requestId: string, userId: string, newUsername: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        Request.Pending(requestId, ApiUsersAdmin.ChangeUsernameFromAdmin(userId, { username: newUsername }))
            .onSuccess(() => {
                resolve();
            })
            .onCancel(() => {
                reject(new Error($t("Request was cancelled")));
            })
            .onRequestError((err, handleErr) => {
                handleErr(err, {
                    unauthorized: () => {
                        requireLogin();
                    },
                    badRequestUsernameInvalid: () => {
                        reject(new Error($t("Invalid username provided")));
                    },
                    badRequestUsernameInUse: () => {
                        reject(new Error($t("The provided username is already in use")));
                    },
                    badRequest: () => {
                        reject(new Error(serverResponseErrors.value.BAD_REQUEST));
                    },
                    notFound: () => {
                        reject(new Error($t("User not found")));
                    },
                    forbidden: () => {
                        reject(new Error(serverResponseErrors.value.FORBIDDEN_ACCESS));
                    },
                    serverError: () => {
                        reject(new Error(serverResponseErrors.value.INTERNAL_SERVER_ERROR));
                    },
                    networkError: () => {
                        reject(new Error(serverResponseErrors.value.NETWORK_ERROR));
                    },
                });
            })
            .onUnexpectedError((err) => {
                reject(new Error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR));
            });
    });
};

const updateUserEmail = (
    requestId: string,
    formData: {
        email: string;
        password: string;
        tfaToken?: string;
    },
): Promise<void> => {
    return new Promise((resolve, reject) => {
        Request.Pending(
            requestId,
            ApiAccount.ChangeEmail({
                email: formData.email,
                password: formData.password,
                tfa_token: formData.tfaToken,
            }),
        )
            .onSuccess(() => {
                resolve();
            })
            .onCancel(() => {
                // Will end the loading
                resolve();
            })
            .onRequestError((err, handleErr) => {
                handleErr(err, {
                    unauthorized: () => {
                        requireLogin();
                    },
                    badRequestInvalidTfaCode: () => {
                        reject(new Error(serverResponseErrors.value.INVALID_SINGLE_USE_CODE));
                    },
                    badRequestEmailInvalid: () => {
                        reject(new Error($t("Invalid email provided")));
                    },
                    badRequestEmailInUse: () => {
                        reject(new Error($t("The provided email is already in use")));
                    },
                    badRequestCaptcha: () => {
                        reject(new Error(serverResponseErrors.value.CAPTCHA_FAILED));
                    },
                    badRequestWrongPassword: () => {
                        reject(new Error(serverResponseErrors.value.INCORRECT_PASSWORD));
                    },
                    badRequest: () => {
                        reject(new Error(serverResponseErrors.value.BAD_REQUEST));
                    },
                    serverError: () => {
                        reject(new Error(serverResponseErrors.value.INTERNAL_SERVER_ERROR));
                    },
                    networkError: () => {
                        reject(new Error(serverResponseErrors.value.NETWORK_ERROR));
                    },
                });
            })
            .onUnexpectedError((err) => {
                reject(new Error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR));
            });
    });
};

const updateUserEmailAsAdmin = (requestId: string, userId: string, newEmail: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        Request.Pending(requestId, ApiUsersAdmin.ChangeEmailFromAdmin(userId, { email: newEmail }))
            .onSuccess(() => {
                resolve();
            })
            .onCancel(() => {
                reject(new Error($t("Request was cancelled")));
            })
            .onRequestError((err, handleErr) => {
                handleErr(err, {
                    unauthorized: () => {
                        requireLogin();
                    },
                    badRequestEmailInvalid: () => {
                        reject(new Error($t("Invalid email provided")));
                    },
                    badRequestEmailInUse: () => {
                        reject(new Error($t("The provided email is already in use")));
                    },
                    badRequest: () => {
                        reject(new Error(serverResponseErrors.value.BAD_REQUEST));
                    },
                    notFound: () => {
                        reject(new Error($t("User not found")));
                    },
                    forbidden: () => {
                        reject(new Error(serverResponseErrors.value.FORBIDDEN_ACCESS));
                    },
                    serverError: () => {
                        reject(new Error(serverResponseErrors.value.INTERNAL_SERVER_ERROR));
                    },
                    networkError: () => {
                        reject(new Error(serverResponseErrors.value.NETWORK_ERROR));
                    },
                });
            })
            .onUnexpectedError((err) => {
                reject(new Error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR));
            });
    });
};

const disableUserAccount = async () => {
    isProcessingUserState.value = true;

    Request.Pending(disableUserRequestId, ApiUsersAdmin.Ban(userId.value))
        .onSuccess(() => {
            isProcessingUserState.value = false;

            showDisableUserModal.value = false;

            // Refresh ban state
            checkIfUserIsBanned();

            $toast.success($t("The user account was successfully disabled"), {
                toastId: "disable-user-success",
            });
        })
        .onCancel(() => {
            isProcessingUserState.value = false;
        })
        .onRequestError((err, handleErr) => {
            isProcessingUserState.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                badRequest: () => {
                    $toast.error($t("This user is immune to moderation"), {
                        toastId: "ban-immune-user",
                    });
                },
                notFound: () => {
                    $toast.error($t("User not found"), {
                        toastId: "ban-user-not-found",
                    });
                },
                forbidden: () => {
                    $toast.error(serverResponseErrors.value.FORBIDDEN_ACTION, {
                        toastId: "ban-forbidden",
                    });
                },
                serverError: () => {
                    $toast.error(serverResponseErrors.value.INTERNAL_SERVER_ERROR, {
                        toastId: "ban-server-error",
                    });
                },
                networkError: () => {
                    $toast.error(serverResponseErrors.value.NETWORK_ERROR, {
                        toastId: "ban-network-error",
                    });
                },
            });
        })
        .onUnexpectedError((err) => {
            isProcessingUserState.value = false;

            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "ban-unexpected-error",
            });
        });
};

const enableUserAccount = async () => {
    isProcessingUserState.value = true;

    Request.Pending(enableUserRequestId, ApiUsersAdmin.Pardon(userId.value))
        .onSuccess(() => {
            isProcessingUserState.value = false;

            showEnableUserModal.value = false;

            // Refresh ban state
            checkIfUserIsBanned();

            $toast.success($t("The user account was successfully reactivated"), {
                toastId: "enable-user-success",
            });
        })
        .onCancel(() => {
            isProcessingUserState.value = false;
        })
        .onRequestError((err, handleErr) => {
            isProcessingUserState.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                notFound: () => {
                    $toast.error($t("User not found"), {
                        toastId: "enable-user-not-found",
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
            isProcessingUserState.value = false;

            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "reactivation-unexpected-error",
            });
        });
};

const checkIfUserIsBanned = async () => {
    Timeouts.Abort(banStatusRequestId);
    Request.Abort(banStatusRequestId);

    isLoadingBanState.value = true;

    Request.Pending(banStatusRequestId, ApiUsersAdmin.GetUser(userId.value))
        .onSuccess((user) => {
            isLoadingBanState.value = false;
            isUserBanned.value = user.banned;
        })
        .onRequestError((err, handleErr) => {
            isLoadingBanState.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                notFound: () => {
                    $toast.error($t("Could not load user activation state because the user does not exist."), {
                        toastId: "user-not-found",
                    });
                },
                forbidden: () => {
                    $toast.error(serverResponseErrors.value.FORBIDDEN_ACTION, {
                        toastId: "user-fetch-forbidden",
                    });
                },
                temporalError: () => {
                    Timeouts.Set(banStatusRequestId, 1500, checkIfUserIsBanned);
                },
            });
        })
        .onUnexpectedError((err) => {
            isLoadingBanState.value = false;

            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "user-fetch-unexpected",
            });
        });
};

// Data
watch(
    () => userId.value,
    async () => {
        if (isRouteCurrentUser.value) {
            return;
        }

        if (userId.value) {
            await checkIfUserIsBanned();
        } else {
            $toast.error($t("Could not load user state"), {
                toastId: "user-id-not-found",
            });
        }
    },
    { immediate: true },
);

// Abort request handling
onBeforeUnmount(() => {
    Request.Abort(usernameUpdateRequestId);
    Request.Abort(emailUpdateRequestId);
    Timeouts.Abort(banStatusRequestId);
    Request.Abort(banStatusRequestId);
    Request.Abort(disableUserRequestId);
    Request.Abort(enableUserRequestId);
});
</script>
