<template>
    <Form @submit="submit">
        <FormRow>
            <InputField
                id="id"
                v-model="formData.id"
                v-model:error="formErrors.id"
                :validator="validateField"
                :label="$t('ID')"
                :placeholder="$t('Ex.: Moderator')"
                :helpText="$t('Use lowercase letters, digits, and underscores for spacing.')"
                :maxLength="FieldMaxLength.ROLE_NAME"
                required
                :disabled="!permissions.length"
            />
        </FormRow>

        <FormRow>
            <div class="w-full flex flex-col gap-3">
                <h2 class="text-lg text-text-neutral-subtle font-semibold">
                    {{ $t("Permissions") }}
                </h2>

                <LoadingScreen
                    :isLoading
                    :loadingText="loadingMessages.LOADING"
                    :isFullScreen="false"
                    :error="errorMessage"
                    :goBackLink="localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}`)"
                    :goBackText="$t('Go back to roles')"
                    :title="$t('Oops! An error happened when loading user roles permissions!')"
                    :helpText="loadingScreenMessages.HELP_TEXT"
                    :retryText="loadingScreenMessages.TRY_AGAIN"
                    :retryLimitReachedText="loadingScreenMessages.RETRY_LIMIT_REACHED"
                    :cooldownText="loadingScreenMessages.RETRY_COOLDOWN_TEXT"
                    @retry="loadPermissions"
                />
                <template v-if="!isLoading && !errorMessage && permissions.length">
                    <PermissionsGroupsWithSwitches
                        v-if="groupedPermissions.length"
                        v-model="selectedPermissions"
                        :permissions="groupedPermissions"
                    />
                    <EmptyState
                        v-else
                        :title="$t('No permissions found')"
                        :description="$t('Please add permissions before adding a role.')"
                        :buttonText="$t('New permission')"
                        :buttonIconPosition="IconPosition.LEFT"
                        buttonIcon="mdi:plus-circle-outline"
                        hasContainer
                        @buttonClick="
                            navigateTo(localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.PERMISSIONS}/new-permission`))
                        "
                    />
                </template>
            </div>
        </FormRow>
        <FormActions>
            <ActionButton
                :text="$t('Save changes')"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:content-save-outline"
                type="submit"
                isMobileFullWidth
                :isLoading="isSaving || isLoading"
                :disabled="!permissions.length"
            />
        </FormActions>
    </Form>
</template>

<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// States
const formData = reactive({
    id: "",
});
const isSaving = ref(false);
const selectedPermissions = reactive<Record<string, boolean>>({});

const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const permissions = ref<GlobalRolePermission[]>([]);

// Request IDs
const requestId = getUniqueStringId();
const saveRequestId = getUniqueStringId();

// Stores
const toastStore = useNavigationToastStore();
const { setOriginPageToastMessage } = toastStore;

// Validators
const { formErrors, validateFormFields } = useForm({
    formData,
    requiredFields: ["id"],
    validators: {
        id: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
    },
});

// Toast
const { $toast } = useNuxtApp();

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();
const { formSubmitErrors, loadingMessages, loadingScreenMessages, formFieldValidationErrors, serverResponseErrors } = useTranslations(t);

// Composables
const { groupPermissions, getPermissionName, getPermissionDescription } = usePermissions(t);

// Computed
// Enrich and group the permissions
const groupedPermissions = computed<GroupedPermission[]>(() => {
    const enriched = permissions.value.map((p) => ({
        ...p,
        name: getPermissionName(p.id),
        description: getPermissionDescription(p.id),
    }));

    return groupPermissions(enriched);
});

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

    isSaving.value = true;

    const payload = {
        id: formData.id,
        permissions: permissions.value.map((p) => ({
            id: p.id,
            granted: selectedPermissions[p.id] ?? false,
        })),
    };

    Request.Pending(saveRequestId, ApiRolesAdmin.CreateRole(payload))
        .onSuccess(() => {
            isSaving.value = false;

            setOriginPageToastMessage($t("Role successfully created"));

            navigateTo(localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}/${formData.id}`));
        })
        .onRequestError((err, handleErr) => {
            isSaving.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                badRequestDuplicated: () => {
                    $toast.error($t("The role identifier already exists in the list of roles."), {
                        toastId: "id-duplicated-error",
                    });
                },
                badRequestInvalidId: () => {
                    $toast.error($t("The role identifier must be lowercase and made only of letters, digits or underscores"), {
                        toastId: "id-formatting-error",
                    });
                },
                badRequest: () => {
                    $toast.error(serverResponseErrors.value.BAD_REQUEST, {
                        toastId: "bad-request-error",
                    });
                },
                forbidden: () => {
                    $toast.error(serverResponseErrors.value.FORBIDDEN_ACCESS, {
                        toastId: "forbidden-error",
                    });

                    AuthController.CheckAuthStatus();
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

// Data loader
const loadPermissions = async () => {
    // Abort previous timeouts and requests
    Timeouts.Abort(requestId);
    Request.Abort(requestId);

    // Reset error
    errorMessage.value = null;

    isLoading.value = true;

    Request.Pending(requestId, ApiRolesAdmin.GetRoles())
        .onSuccess((data) => {
            isLoading.value = false;

            // Initialize permissions with all permissions set to not granted
            permissions.value = (data[0]?.permissions || []).map((p) => ({
                ...p,
                granted: false,
            }));
        })
        .onRequestError((err, handleErr) => {
            isLoading.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                forbidden: () => {
                    errorMessage.value = serverResponseErrors.value.FORBIDDEN_ACCESS;
                },
                temporalError: () => {
                    errorMessage.value = $t("Roles permissions request exceeded the allowed time limit.");
                },
            });
        })
        .onUnexpectedError((err) => {
            isLoading.value = false;
            errorMessage.value = err?.message || serverResponseErrors.value.UNKNOWN_ERROR;
        });
};

await loadPermissions();

// Abort request handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
    Request.Abort(saveRequestId);
});
</script>
