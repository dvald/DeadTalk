<template>
    <Form @submit="submit">
        <FormRow>
            <InputField
                id="id"
                v-model="formData.id"
                v-model:error="formErrors.id"
                :validator="validateField"
                :label="$t('ID')"
                :placeholder="$t('Ex.: moderator')"
                :maxLength="FieldMaxLength.ROLE_NAME"
                required
                disabled
            />
        </FormRow>

        <FormRow>
            <div class="w-full flex flex-col gap-3">
                <h2 class="text-lg text-text-neutral-subtle font-semibold">
                    {{ $t("Permissions") }}
                </h2>

                <PermissionsGroupsWithSwitches
                    v-if="groupedPermissions.length"
                    v-model="selectedPermissions"
                    :permissions="groupedPermissions"
                    :disabled="formData.id === 'admin'"
                />
                <EmptyState
                    v-else
                    :title="$t('No permissions found')"
                    :description="$t('Please add permissions before adding a role.')"
                    :buttonText="$t('New permission')"
                    :buttonIconPosition="IconPosition.LEFT"
                    buttonIcon="mdi:plus-circle-outline"
                    hasContainer
                    @buttonClick="navigateTo(localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.PERMISSIONS}/new-permission`))"
                />
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
                :isLoading="isSaving"
            />
        </FormActions>
    </Form>
</template>

<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// Props
const props = defineProps({
    roleId: {
        type: String as PropType<string>,
        required: true,
    },
    permissions: {
        type: Array as PropType<GlobalRolePermission[]>,
        required: true,
    },
});

// States
const formData = reactive({
    id: props.roleId,
});
const isSaving = ref(false);
const selectedPermissions = reactive<Record<string, boolean>>({});

// Request IDs
const requestId = getUniqueStringId();

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
const { formSubmitErrors, formFieldValidationErrors, formSubmitMessages, serverResponseErrors } = useTranslations(t);

// Composables
const { groupPermissions, getPermissionName, getPermissionDescription } = usePermissions(t);

// Enrich and group the permissions
const groupedPermissions = computed<GroupedPermission[]>(() => {
    const enriched = props.permissions.map((p) => ({
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

    const payload = {
        id: formData.id,
        permissions: props.permissions.map((p) => ({
            id: p.id,
            granted: selectedPermissions[p.id] ?? false,
        })),
    };

    Request.Pending(requestId, ApiRolesAdmin.ModifyRole(props.roleId || "-", payload))
        .onSuccess(() => {
            isSaving.value = false;
            $toast.success(formSubmitMessages.value.CHANGES_SAVED, {
                toastId: "changed-saved-success",
            });
        })
        .onRequestError((err, handleErr) => {
            isSaving.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
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
                notFound: () => {
                    $toast.error($t("Role not found"), {
                        toastId: "role-not-found-error",
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

onMounted(() => {
    for (const permission of props.permissions) {
        selectedPermissions[permission.id] = permission.granted ?? false;
    }
});

// Abort request handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
});
</script>
