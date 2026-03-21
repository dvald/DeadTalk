<template>
    <Section
        :hasSidePadding="false"
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <Heading
                :overtitle="$t('User')"
                :title
                :size="HeadingSize.SM"
            />
        </SectionHeader>
        <SectionBody>
            <TableLoading
                :isLoading
                :loadingText="loadingMessages.LOADING"
                :error="errorMessage"
                :title="$t('Oops! An error happened when loading user sessions!')"
                :helpText="loadingScreenMessages.HELP_TEXT"
                :retryText="loadingScreenMessages.TRY_AGAIN"
                :retryLimitReachedText="loadingScreenMessages.RETRY_LIMIT_REACHED"
                :cooldownText="loadingScreenMessages.RETRY_COOLDOWN_TEXT"
                @retry="loadUserData"
            />
            <UserActiveSessionsTable
                v-if="!isLoading && !errorMessage"
                :data="userSessions"
            />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

definePageMeta({
    layout: "account-settings",
    permissions: ["moderateUsers", "manageUsers"],
});

// Page title
const title = computed(() => $t("Active sessions"));

useHead(() => ({
    title: title.value,
}));

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();
const { serverResponseErrors, loadingMessages, loadingScreenMessages } = useTranslations(t);

// Route
const route = useRoute();
const userId = computed(() => String(route.params.userId || ""));

// States
const userSessions = ref<SessionListItem[]>([]);

const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

// Request IDs
const requestId = getUniqueStringId();

// Methods
const loadUserData = async () => {
    // Abort previous timeouts and requests
    Timeouts.Abort(requestId);
    Request.Abort(requestId);

    // Reset error
    errorMessage.value = null;

    isLoading.value = true;

    Request.Pending(requestId, ApiUsersAdmin.GetUser(userId.value))
        .onSuccess((data) => {
            isLoading.value = false;
            userSessions.value = data.sessions;

            // If the current fetched user is admin, it will redirect for security reasons.
            if (data.role === "admin") {
                navigateTo(localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId.value}`));
            }
        })
        .onRequestError((err, handleErr) => {
            isLoading.value = false;

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
                    errorMessage.value = $t("User data request exceeded the allowed time limit.");
                },
                serverError: () => {
                    errorMessage.value = serverResponseErrors.value.INTERNAL_SERVER_ERROR;
                },
                networkError: () => {
                    errorMessage.value = serverResponseErrors.value.NETWORK_ERROR;
                },
            });
        })
        .onUnexpectedError((err) => {
            isLoading.value = false;

            errorMessage.value = err?.message || serverResponseErrors.value.UNKNOWN_ERROR;
        });
};

// Data
await loadUserData();

// Abort handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
});
</script>
