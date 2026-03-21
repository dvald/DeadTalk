<template>
    <LoadingScreen
        :isLoading="isLoadingRoles && isLoadingUserDetails"
        :loadingText="loadingMessages.LOADING"
        :isFullScreen="false"
        :error="errorMessage"
        :goBackLink="localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId}`)"
        :goBackText="$t('Go back to roles')"
        :title="$t('Oops! An error happened when loading user roles!')"
        :helpText="loadingScreenMessages.HELP_TEXT"
        :retryText="loadingScreenMessages.TRY_AGAIN"
        :retryLimitReachedText="loadingScreenMessages.RETRY_LIMIT_REACHED"
        :cooldownText="loadingScreenMessages.RETRY_COOLDOWN_TEXT"
        @retry="loadRoles"
    />
    <Section
        v-if="!isLoadingRoles && !isLoadingUserDetails && !errorMessage"
        :hasSidePadding="false"
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <Heading
                :overtitle="$t('User role')"
                :title
                :size="HeadingSize.SM"
            />
        </SectionHeader>
        <SectionBody>
            <UserRoleForm
                :userId
                :userRoleId="userRole"
                :roles
                class="max-w-[500px]"
            />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

definePageMeta({
    layout: "account-settings",
    permissions: ["moderateUsers", "manageUsers", "manageRoles"],
});

// Page title
const title = computed(() => $t("User role"));

useHead(() => ({
    title: title.value,
}));

// Route
const route = useRoute();
const userId = computed(() => String(route.params.userId || ""));

// States
const isLoadingRoles = ref(false);
const isLoadingUserDetails = ref(false);
const errorMessage = ref<string | null>(null);
const userRole = ref<string | null>(null);
const roles = ref<GlobalRole[]>([]);
const userDetailsRequestId = ref(`visited-user-details-role-${userId.value}`);

// Request IDs
const rolesRequestId = getUniqueStringId();

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();
const { loadingMessages, serverResponseErrors, loadingScreenMessages } = useTranslations(t);

const { requireLogin } = useRequireLogin();

// Data loader
const loadRoles = async () => {
    // Abort previous timeouts and requests
    Timeouts.Abort(rolesRequestId);
    Request.Abort(rolesRequestId);

    // Reset error
    errorMessage.value = null;

    isLoadingRoles.value = true;

    Request.Pending(rolesRequestId, ApiRolesAdmin.GetRoles())
        .onSuccess((data) => {
            isLoadingRoles.value = false;

            const mappedRoles = data.map((role) => ({
                id: role.id,
                permissions: role.permissions,
            }));

            // Filter out 'admin' if current user is not an admin
            roles.value = AuthController.Role === "admin" ? mappedRoles : mappedRoles.filter((role) => role.id !== "admin");
        })
        .onRequestError((err, handleErr) => {
            isLoadingRoles.value = false;

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
            isLoadingRoles.value = false;
            errorMessage.value = err?.message || serverResponseErrors.value.UNKNOWN_ERROR;
        });
};

await loadRoles();

const loadManagedUserDetails = async () => {
    // Abort previous timeouts and requests
    Timeouts.Abort(userDetailsRequestId.value);
    Request.Abort(userDetailsRequestId.value);

    // Reset error
    errorMessage.value = null;

    isLoadingUserDetails.value = true;

    Request.Pending(userDetailsRequestId.value, ApiUsersAdmin.GetUser(userId.value))
        .onSuccess((userDetails) => {
            isLoadingUserDetails.value = false;
            userRole.value = userDetails.role;

            // If the current fetched user is admin, it will redirect for security reasons.
            if (userDetails.role === "admin") {
                navigateTo(localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId.value}`));
            }
        })
        .onRequestError((err, handleErr) => {
            isLoadingUserDetails.value = false;

            handleErr(err, {
                unauthorized: () => {
                    errorMessage.value = $t("You are not authorized to view this profile");
                },
                notFound: () => {
                    errorMessage.value = $t("User not found");
                },
                forbidden: () => {
                    navigateTo(localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId.value}`));
                },
                temporalError: () => {
                    errorMessage.value = $t("User profile request exceeded the allowed time limit.");
                },
            });
        })
        .onUnexpectedError((err) => {
            isLoadingUserDetails.value = false;

            errorMessage.value = err?.message || serverResponseErrors.value.UNKNOWN_ERROR;
        });
};

// Data
watch(
    () => [userId.value],
    async () => {
        if (userId.value) {
            await loadManagedUserDetails();
        } else {
            errorMessage.value = $t("Could not load the user role");
        }
    },
    { immediate: true },
);

// Abort request handling
onBeforeUnmount(() => {
    Timeouts.Abort(rolesRequestId);
    Request.Abort(rolesRequestId);
    Timeouts.Abort(userDetailsRequestId.value);
    Request.Abort(userDetailsRequestId.value);
});
</script>
