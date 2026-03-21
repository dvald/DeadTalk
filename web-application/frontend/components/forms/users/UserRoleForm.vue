<template>
    <Form @submit="submit">
        <FormRow>
            <SelectField
                id="user-role"
                v-model="formData.userRole"
                :label="$t('Role')"
                :options="roleOptions"
            />
        </FormRow>

        <FormRow>
            <DataField
                id="permissions"
                :label="$t('Permissions')"
            >
                <template v-if="visiblePermissions.length">
                    <BadgeStack :items="visiblePermissions" />
                </template>
                <span
                    v-else
                    class="text-sm text-text-neutral-subtle"
                >
                    {{ $t("No permissions granted") }}
                </span>
            </DataField>
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
    userId: {
        type: String as PropType<string>,
        required: true,
    },
    userRoleId: {
        type: String as PropType<string>,
        required: true,
    },
    roles: {
        type: Array as PropType<GlobalRole[]>,
        required: true,
    },
});

// Composables
const { t } = useI18n();
const { getPermissionName, defaultRoleRouteId, defaultRoleName } = usePermissions(t);

// States
const formData = reactive({
    userRole: props.userRoleId || defaultRoleRouteId,
});

const isSaving = ref(false);

// Request ID
const requestId = getUniqueStringId();

// Toast
const { $toast } = useNuxtApp();

// Translation dependencies
const { serverResponseErrors, formSubmitMessages } = useTranslations(t);

// Computed: role options
const roleOptions = computed(() =>
    convertToSelectOptions(props.roles, {
        text: (role) => capitalizeFirstLetter(role.id || defaultRoleName.value),
        value: (role) => role.id || defaultRoleRouteId,
    }),
);

// Computed
const selectedRole = computed(() => {
    const selectedId = formData.userRole || defaultRoleRouteId;
    return props.roles.find((role) => role.id === selectedId);
});

const visiblePermissions = computed(() => {
    if (!selectedRole.value?.permissions) return [];

    return selectedRole.value.permissions
        .filter((permission) => permission.granted)
        .map((permission) => ({
            text: getPermissionName(permission.id),
        }));
});

const { requireLogin } = useRequireLogin();

// Submit method
const submit = async () => {
    isSaving.value = true;

    // Since the default role is mapped as `defaultRoleRouteId` in the select, it needs to be mapped back to its original value.
    Request.Pending(
        requestId,
        ApiUsersAdmin.SetRole(props.userId, {
            role: formData.userRole === defaultRoleRouteId ? "" : formData.userRole,
        }),
    )
        .onSuccess(() => {
            isSaving.value = false;

            $toast.success(formSubmitMessages.value.CHANGES_SAVED, {
                toastId: "changes-saved",
            });
        })
        .onRequestError((err, handleErr) => {
            isSaving.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                badRequestInvalidRole: () => {
                    $toast.error($t("Invalid role"), {
                        toastId: "invalid-role-error",
                    });
                },
                badRequestSelf: () => {
                    $toast.error($t("You cannot change your own role"), {
                        toastId: "bad-request-own-role-error",
                    });
                },
                badRequest: () => {
                    $toast.error(serverResponseErrors.value.BAD_REQUEST, {
                        toastId: "bad-request",
                    });
                },
                forbidden: () => {
                    $toast.error(serverResponseErrors.value.FORBIDDEN_ACCESS, {
                        toastId: "forbidden-error",
                    });

                    AuthController.CheckAuthStatus();
                },
                notFound: () => {
                    $toast.error($t("User not found"), {
                        toastId: "forbidden-error",
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
</script>
