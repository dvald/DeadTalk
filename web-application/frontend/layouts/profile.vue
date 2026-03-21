<template>
    <AppHeader showSidebarToggle />

    <LoadingScreen
        :isLoading
        :loadingText="loadingMessages.LOADING"
        :isFullScreen="false"
        :error="errorMessage"
        :title="$t('Oops! An error happened when loading user profile!')"
        :goBackLink="localePath(`/${AppSlug.APP}/${AppSlug.PROFILE}`)"
        :goBackText="$t('Go back to profile')"
        :helpText="loadingScreenMessages.HELP_TEXT"
        :retryText="loadingScreenMessages.TRY_AGAIN"
        :retryLimitReachedText="loadingScreenMessages.RETRY_LIMIT_REACHED"
        :cooldownText="loadingScreenMessages.RETRY_COOLDOWN_TEXT"
        @retry="load"
    />

    <ContentBody v-if="!isLoading && !errorMessage && userProfile">
        <SidebarWithContentWrapper>
            <AppSidebar
                :heightOffset="sidebarHeightOffset"
                :stickyTopHeight="80"
            >
                <ProfileInfo
                    v-if="userProfile"
                    :displayName="capitalizeFirstLetter(userDisplayName)"
                    :imgUrl="userAvatarImg ?? undefined"
                    :email="userEmail"
                    :date="`${$t('User since')} ${formatLocalizedDate(userJoinDate ?? '', locale)}`"
                    :location="userLocation"
                    :website="userWebsite"
                    :description="userDescription"
                />
                <div class="flex flex-col gap-3">
                    <ActionButton
                        v-if="isRouteCurrentUser"
                        :actionType="ButtonActionType.LINK"
                        :text="$t('Edit profile')"
                        :iconPosition="IconPosition.LEFT"
                        icon="mdi:pencil-outline"
                        :to="localePath(`/${AppSlug.APP}/${AppSlug.ACCOUNT_SETTINGS}/profile-data`)"
                    />
                    <ActionButton
                        v-if="!isRouteCurrentUser && (can.manageUsers || can.moderateUsers) && userProfile?.username !== 'admin'"
                        :actionType="ButtonActionType.LINK"
                        :text="$t('Manage user')"
                        :iconPosition="IconPosition.LEFT"
                        icon="mdi:cog-outline"
                        :to="localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId}/details`)"
                    />
                </div>
            </AppSidebar>
            <AppMainContent
                hasSidebar
                :translationWidth="300"
            >
                <slot />
            </AppMainContent>
        </SidebarWithContentWrapper>
    </ContentBody>

    <Footer :translationWidth="300" />
</template>
<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// Route
const route = useRoute();
const userId = computed(() => String(route.params.userId || ""));

// States
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const userProfile = ref<UserProfile | null>(null);

// Request IDs
const requestId = getUniqueStringId();

const { t, locale } = useI18n();

// Composables
const { isRouteCurrentUser } = useRoutes();
const { can } = usePermissions(t);

// Translation dependencies
const localePath = useLocalePath();
const { serverResponseErrors, loadingMessages, loadingScreenMessages } = useTranslations(t);

// Computed - Profile info based on the type of current user or the visited user
const userDisplayName = computed(() => {
    const profile = userProfile.value;

    const name = profile?.name?.trim();
    const username = profile?.username || "";

    return name ? capitalizeFirstLetter(name) : username;
});

const userAvatarImg = computed(() => userProfile.value?.image);
const userEmail = computed(() => undefined);
const userJoinDate = computed(() => userProfile.value?.joinDate);
const userLocation = computed(() => userProfile.value?.location);
const userWebsite = computed(() => userProfile.value?.website);
const userDescription = computed(() => userProfile.value?.bio);

const { requireLogin } = useRequireLogin();
const { listenOnAppEvent } = useGlobalEvents();

// Methods
const load = async () => {
    // Abort previous timeouts and requests
    Timeouts.Abort(requestId);
    Request.Abort(requestId);

    // Reset error
    errorMessage.value = null;

    isLoading.value = true;

    if (!AuthController.isAuthenticated()) {
        requireLogin();
        return;
    }

    Request.Pending(requestId, ApiProfile.GetProfile(isRouteCurrentUser.value ? AuthController.UID : userId.value))
        .onSuccess((profile) => {
            isLoading.value = false;
            userProfile.value = profile;
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
                temporalError: () => {
                    errorMessage.value = $t("User profile request exceeded the allowed time limit.");
                },
            });
        })
        .onUnexpectedError((err) => {
            isLoading.value = false;

            errorMessage.value = err?.message || serverResponseErrors.value.UNKNOWN_ERROR;
        });
};

// Composables
const { sidebarHeightOffset } = useNavSidebar();

const onAuthChanged = () => {
    if (!AuthController.isAuthenticated()) {
        requireLogin();
    } else if (AuthController.isAskingForTwoFactor()) {
        navigateTo(localePath(`/${AppSlug.TFA_LOGIN}`));
    }
};

onMounted(async () => {
    // Data
    await load();
    listenOnAppEvent("auth-status-changed", onAuthChanged);
});

// Abort request handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
});
</script>
