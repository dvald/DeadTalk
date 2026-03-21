<template>
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

    <Section
        v-if="!isLoading && !errorMessage && roleId && permissions.length"
        hasContentMaxWidth
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <div class="flex flex-col gap-2">
                <NavLink
                    :text="$t('Go back to roles')"
                    :iconPosition="IconPosition.LEFT"
                    icon="mdi:keyboard-backspace"
                    :to="localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}`)"
                />
                <Heading
                    :title
                    :size="HeadingSize.SM"
                />
            </div>
            <ActionButton
                v-if="!isProtectedRole(roleId)"
                :actionType="ButtonActionType.LINK"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:pencil-outline"
                :text="$t('Edit role')"
                :to="localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}/edit?role=${roleId}`)"
            />
        </SectionHeader>
        <SectionBody>
            <RoleDetails
                :roleId
                :permissions
            />

            <EmptyState
                v-if="!isLoading && !permissions.length"
                :hasContainer="true"
                :title="$t('No permissions available')"
                :description="$t('There are currently no permissions to display.')"
                icon="mdi:list-status"
            />

            <!-- Protected roles can not be deleted -->
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
const roleId = computed(() => route.params.id as string);
const title = computed(() => capitalizeFirstLetter(roleId.value));

useHead(() => ({
    title: title.value,
}));

// States
const showDeleteModal = ref(false);

const isLoading = ref(false);
const isDeleting = ref(false);

const errorMessage = ref<string | null>(null);

const permissions = ref<GlobalRolePermission[]>([]);

// Request IDs
const requestId = getUniqueStringId();
const deleteRequestId = getUniqueStringId();

// Stores
const toastStore = useNavigationToastStore();
const { clearToast, setOriginPageToastMessage } = toastStore;
const { toastMessage } = storeToRefs(toastStore);

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();
const { loadingMessages, loadingScreenMessages, serverResponseErrors } = useTranslations(t);

// Composables
const { isProtectedRole, defaultRoleRouteId } = usePermissions(t);
const { requireLogin } = useRequireLogin();

// Toast
const { $toast } = useNuxtApp();

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
                    errorMessage.value = $t("Roles request exceeded the allowed time limit.");
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

onMounted(() => {
    if (toastMessage.value) {
        $toast.success(toastMessage.value, {
            toastId: "role-created-success",
        });

        clearToast();
    }
});

// Abort request handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
    Request.Abort(deleteRequestId);
});
</script>
