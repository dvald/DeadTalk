<template>
    <LoadingScreen
        :isLoading
        :loadingText="loadingMessages.LOADING"
        :isFullScreen="false"
        :error="errorMessage"
        :goBackLink
        :goBackText
        :title="$t('Oops! An error happened when loading user roles permissions!')"
        :helpText="loadingScreenMessages.HELP_TEXT"
        :retryText="loadingScreenMessages.TRY_AGAIN"
        :retryLimitReachedText="loadingScreenMessages.RETRY_LIMIT_REACHED"
        :cooldownText="loadingScreenMessages.RETRY_COOLDOWN_TEXT"
        @retry="loadPermissions"
    />
    <Section
        v-if="!isLoading && !errorMessage && roleId && permissions.length"
        hasContentMaxWidth
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <div class="flex flex-col gap-2">
                <NavLink
                    :text="goBackText"
                    :iconPosition="IconPosition.LEFT"
                    icon="mdi:keyboard-backspace"
                    :to="goBackLink"
                />
                <div>
                    <span class="text-text-neutral-subtle font-semibold">{{ $t("Edit role") }}</span>
                    <Heading
                        :title
                        :size="HeadingSize.SM"
                    />
                </div>
            </div>
        </SectionHeader>
        <SectionBody>
            <EditRoleForm
                :roleId
                :permissions
            />

            <!-- Admin roles can not be deleted -->
            <template v-if="!isProtectedRole(roleId)">
                <Divider />
                <ActionButton
                    :styleType="ButtonStyleType.DELETE_FILLED"
                    :iconPosition="IconPosition.LEFT"
                    :size="ButtonSize.SM"
                    icon="mdi:delete-forever-outline"
                    :text="$t('Delete role')"
                    @click="showDeleteModal = true"
                />
            </template>
        </SectionBody>
    </Section>

    <DangerModalDialog
        v-if="!isProtectedRole(roleId)"
        v-model="showDeleteModal"
        :title="$t('Are you sure you want to delete this role?')"
        :description="$t('Once confirmed, the role will be deleted forever and cannot be undone.')"
        :buttonActionText="$t('Delete role')"
        :buttonCloseText="$t('Close')"
        :isLoading="isDeleting"
        @action="deleteRole"
    />
</template>

<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

definePageMeta({
    layout: "admin-panel",
    permissions: ["moderateUsers", "manageUsers", "manageRoles"],
});

// Route
const route = useRoute();

// Page title
const roleId = computed(() => route.query.role as string);
const title = computed(() => capitalizeFirstLetter(roleId.value));

useHead(() => ({
    title: `${$t("Edit role")} - ${title.value}`,
}));

// States
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const permissions = ref<GlobalRolePermission[]>([]);

// Request IDs
const requestId = getUniqueStringId();
const deleteRequestId = getUniqueStringId();

// Stores
const toastStore = useNavigationToastStore();
const { setOriginPageToastMessage } = toastStore;

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();
const { loadingMessages, loadingScreenMessages, serverResponseErrors } = useTranslations(t);

// Toast
const { $toast } = useNuxtApp();
const { requireLogin } = useRequireLogin();

// Composables
const { previousRoute } = useRoutes();
const { isProtectedRole, defaultRoleRouteId } = usePermissions(t);

// The user can reach the edit role page from two places: Details page or roles page
const cameFromRoleDetail = computed(() => {
    const previous = previousRoute.value || "";

    return previous.startsWith(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}/`) && !previous.endsWith("/edit");
});

const goBackLink = computed(() => {
    if (cameFromRoleDetail.value) {
        return localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}/${roleId.value}`);
    }
    return localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}/`);
});

const goBackText = computed(() => (cameFromRoleDetail.value ? $t("Go back to role details") : $t("Go back to roles")));

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

            const isDefaultRole = roleId.value === defaultRoleRouteId;
            const targetRoleId = isDefaultRole ? "" : roleId.value;

            const matchedRole = data.find((role) => role.id === targetRoleId);
            permissions.value = matchedRole?.permissions || [];
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

// Methods
const deleteRole = async () => {
    isDeleting.value = true;

    Request.Pending(deleteRequestId, ApiRolesAdmin.DeleteRole(roleId.value))
        .onSuccess(() => {
            isDeleting.value = false;

            setOriginPageToastMessage($t("Role successfully deleted"));

            navigateTo(localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}`));
        })
        .onRequestError((err, handleErr) => {
            isDeleting.value = false;

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
            isDeleting.value = false;

            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "unexpected-error",
            });
        });
};

// Abort request handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
    Request.Abort(deleteRequestId);
});
</script>
