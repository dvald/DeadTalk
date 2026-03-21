<template>
    <LoadingScreen
        :isLoading
        :loadingText="loadingMessages.LOADING"
        :isFullScreen="false"
        :error="errorMessage"
        :title="$t('Oops! An error happened when loading user profile!')"
        :goBackLink="localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${userId}`)"
        :goBackText="$t('Go back to profile')"
        :helpText="loadingScreenMessages.HELP_TEXT"
        :retryText="loadingScreenMessages.TRY_AGAIN"
        :retryLimitReachedText="loadingScreenMessages.RETRY_LIMIT_REACHED"
        :cooldownText="loadingScreenMessages.RETRY_COOLDOWN_TEXT"
        @retry="loadManagedUserDetails"
    />
    <Section
        v-if="!isLoading && !errorMessage && managedUserDetails"
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
            <Card>
                <DataDetails>
                    <DataDetailsRow>
                        <DataField
                            id="id"
                            :label="$t('ID')"
                            :text="managedUserDetails?.id"
                        >
                            <TextWithClipboardButton
                                :text="managedUserDetails?.id"
                                :confirmationMessage="$t('User ID copied to clipboard')"
                            />
                        </DataField>
                        <DataField
                            id="username"
                            :label="$t('Username')"
                            :text="managedUserDetails?.username"
                        />
                    </DataDetailsRow>
                    <DataDetailsRow>
                        <DataField
                            id="role"
                            :label="$t('Role')"
                        >
                            <Badge
                                :shape="BadgeShape.PILL"
                                :text="
                                    capitalizeFirstLetter(
                                        !managedUserDetails?.role && managedUserDetails?.role === ''
                                            ? defaultRoleName
                                            : managedUserDetails?.role,
                                    )
                                "
                                :color="managedUserDetails?.role === 'admin' ? ColorAccent.SECONDARY_BRAND : ColorAccent.NEUTRAL"
                            />
                        </DataField>
                        <DataField
                            id="email"
                            :label="$t('Email')"
                            :text="managedUserDetails?.email"
                        />
                    </DataDetailsRow>
                    <DataDetailsRow>
                        <DataField
                            id="email-verification-state"
                            :label="$t('Email verification state')"
                        >
                            <IconTextBadge
                                :color="managedUserDetails?.verified ? ColorAccent.SUCCESS : ColorAccent.DANGER"
                                :icon="managedUserDetails?.verified ? 'mdi:check-circle-outline' : 'mdi:close-circle-outline'"
                                :text="managedUserDetails?.verified ? $t('Verified') : $t('Not verified')"
                            />
                        </DataField>
                        <DataField
                            id="language"
                            :label="$t('Language')"
                            :text="managedUserDetails?.locale"
                            :emptyText="$t('Not defined')"
                        />
                    </DataDetailsRow>
                    <DataDetailsRow>
                        <DataField
                            id="banned"
                            :label="$t('Banned')"
                            :text="managedUserDetails?.banned ? $t('Yes') : $t('No')"
                        />
                        <DataField
                            id="moderation-inmune"
                            :label="$t('Moderation inmune')"
                            :text="managedUserDetails?.modImmune ? $t('Yes') : $t('No')"
                        />
                    </DataDetailsRow>
                    <DataDetailsRow>
                        <DataField
                            id="two-factor-authentication"
                            :label="$t('Two-factor authentication enabled')"
                            :text="managedUserDetails?.tfa ? $t('Yes') : $t('No')"
                        />
                    </DataDetailsRow>
                </DataDetails>
            </Card>
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
const title = computed(() => $t("User details"));

useHead(() => ({
    title: title.value,
}));

// Route
const route = useRoute();
const userId = computed(() => String(route.params.userId || ""));

// States
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const requestId = ref(`visited-user-${userId.value}`);
const managedUserDetails = ref<UserAdminDetails | null>(null);

const { t } = useI18n();

// Composables
const { defaultRoleName } = usePermissions(t);

// Translation dependencies
const localePath = useLocalePath();
const { serverResponseErrors, loadingMessages, loadingScreenMessages } = useTranslations(t);

// Data loaders
const loadManagedUserDetails = async () => {
    // Abort previous timeouts and requests
    Timeouts.Abort(requestId.value);
    Request.Abort(requestId.value);

    // Reset error
    errorMessage.value = null;

    isLoading.value = true;

    Request.Pending(requestId.value, ApiUsersAdmin.GetUser(userId.value))
        .onSuccess((userDetails) => {
            isLoading.value = false;
            managedUserDetails.value = userDetails;

            // If the current fetched user is admin, it will redirect for security reasons.
            if (userDetails.role === "admin") {
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
                    errorMessage.value = $t("User profile request exceeded the allowed time limit.");
                },
            });
        })
        .onUnexpectedError((err) => {
            isLoading.value = false;

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
            errorMessage.value = $t("Could not load the user details");
        }
    },
    { immediate: true },
);

// Abort handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId.value);
    Request.Abort(requestId.value);
});
</script>
