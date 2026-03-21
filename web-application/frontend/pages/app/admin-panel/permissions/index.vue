<template>
    <LoadingScreen
        :isLoading
        :loadingText="loadingMessages.LOADING"
        :isFullScreen="false"
        :error="errorMessage"
        :title="$t('Oops! An error happened when loading permissions!')"
        :goBackLink="localePath(`/${AppSlug.APP}/${AppSlug.PROFILE}`)"
        :goBackText="$t('Go back to profile')"
        :helpText="loadingScreenMessages.HELP_TEXT"
        :retryText="loadingScreenMessages.TRY_AGAIN"
        :retryLimitReachedText="loadingScreenMessages.RETRY_LIMIT_REACHED"
        :cooldownText="loadingScreenMessages.RETRY_COOLDOWN_TEXT"
        @retry="loadPermissions"
    />
    <Section
        v-if="!isLoading && !errorMessage && permissions.length"
        :hasSidePadding="false"
        hasContentMaxWidth
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <Heading
                :title
                :size="HeadingSize.SM"
            />
        </SectionHeader>
        <SectionBody>
            <PermissionsGroupsWithDetailList :permissions="groupedPermissions" />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

definePageMeta({
    layout: "admin-panel",
    permissions: ["moderateUsers", "manageUsers", "manageRoles"],
});

// Page title
const title = computed(() => $t("Permissions"));

useHead(() => ({
    title: title.value,
}));

// States
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const permissions = ref<GlobalRolePermission[]>([]);

// Request IDs
const requestId = getUniqueStringId();

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();
const { loadingMessages, serverResponseErrors, loadingScreenMessages } = useTranslations(t);

// Composables
const { groupPermissions, getPermissionName, getPermissionDescription } = usePermissions(t);

const { requireLogin } = useRequireLogin();

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

// Enrich and group the permissions
const groupedPermissions = computed<GroupedPermission[]>(() => {
    const enriched = permissions.value.map((p) => ({
        ...p,
        name: getPermissionName(p.id),
        description: getPermissionDescription(p.id),
    }));

    return groupPermissions(enriched);
});

// Abort request handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
});
</script>
