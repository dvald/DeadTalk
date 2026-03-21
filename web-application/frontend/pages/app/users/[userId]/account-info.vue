<template>
    <LoadingScreen
        :isLoading
        :loadingText="loadingMessages.LOADING"
        :isFullScreen="false"
        :error="errorMessage"
        :title="$t('Oops! An error happened when loading user info!')"
        :goBackLink="localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId}`)"
        :goBackText="$t('Go back to profile')"
        :helpText="loadingScreenMessages.HELP_TEXT"
        :retryText="loadingScreenMessages.TRY_AGAIN"
        :retryLimitReachedText="loadingScreenMessages.RETRY_LIMIT_REACHED"
        :cooldownText="loadingScreenMessages.RETRY_COOLDOWN_TEXT"
        @retry="loadVisitedUserData"
    />
    <Section
        v-if="!isLoading && !errorMessage && visitedUserUsername && visitedUserEmail"
        :hasSidePadding="false"
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <Heading
                :overtitle="$t('Management')"
                :title
                :size="HeadingSize.SM"
            />
        </SectionHeader>
        <SectionBody>
            <AccountInfoForm
                :username="visitedUserUsername"
                :email="visitedUserEmail"
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
const title = computed(() => $t("Account info"));

useHead(() => ({
    title: title.value,
}));

// Route
const route = useRoute();
const userId = computed(() => String(route.params.userId || ""));

// States
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const visitedUserUsername = ref("");
const visitedUserEmail = ref("");

// Request IDs
const requestId = getUniqueStringId();

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();
const { serverResponseErrors, loadingMessages, loadingScreenMessages } = useTranslations(t);

// Methods
const loadVisitedUserData = async () => {
    // Abort previous timeouts and requests
    Timeouts.Abort(requestId);
    Request.Abort(requestId);

    // Reset error
    errorMessage.value = null;

    isLoading.value = true;

    Request.Pending(requestId, ApiUsersAdmin.GetUser(userId.value))
        .onSuccess((user) => {
            isLoading.value = false;
            visitedUserUsername.value = user.username;
            visitedUserEmail.value = user.email;

            // If the current fetched user is admin, it will redirect for security reasons.
            if (user.role === "admin") {
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
            });
        })
        .onUnexpectedError((err) => {
            isLoading.value = false;

            errorMessage.value = err?.message || serverResponseErrors.value.UNKNOWN_ERROR;
        });
};

// Data
await loadVisitedUserData();

// Abort request handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
});
</script>
