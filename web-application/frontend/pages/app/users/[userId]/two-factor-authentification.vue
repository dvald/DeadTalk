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
        @retry="loadUserData"
    />
    <Section
        v-if="!isLoading && !errorMessage && tfa !== null"
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
            <Card v-if="tfa">
                <CardBody class="!items-center py-4">
                    <ContainedIcon
                        :color="ColorAccent.SUCCESS"
                        icon="mdi:check-circle-outline"
                        :size="IconContainerSize.LG"
                    />
                    <h3 class="font-semibold text-center">
                        {{ $t("This user has two-factor authentification enabled") }}
                    </h3>
                    <div class="w-full flex justify-center mt-2">
                        <ActionButton
                            :styleType="ButtonStyleType.DELETE_SOFT"
                            :iconPosition="IconPosition.LEFT"
                            icon="mdi:close"
                            :size="ButtonSize.SM"
                            :text="$t('Disable 2FA authentication')"
                            :isLoading="isDisabling"
                            :loadingText="loadingMessages.PROCESSING"
                            @click="showDisableTFAModal = true"
                        />
                    </div>
                </CardBody>
            </Card>
            <EmptyState
                v-else
                :containerStyle="EmptyPlaceholderContainerStyle.DASHED"
                :title="$t('Two-factor authentication disabled')"
                :description="$t('This user has not activated the two-factor authentification yet.')"
                icon="mdi:close-box-outline"
                hasContainer
            />
        </SectionBody>
    </Section>

    <DangerModalDialog
        v-model="showDisableTFAModal"
        :title="$t('Are you sure you want to disable two-factor authentification for this user?')"
        :description="$t('Once confirmed, the user will its password to login instead of the single-use code.')"
        :buttonActionText="$t('Disable authentication')"
        buttonActionIcon="mdi:close"
        @action="disableUserTFA"
    />
</template>

<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

definePageMeta({
    layout: "account-settings",
    permissions: ["moderateUsers", "manageUsers"],
});

// Page title
const title = computed(() => $t("Two-factor authentication"));

useHead(() => ({
    title: title.value,
}));

// Route
const route = useRoute();
const userId = computed(() => String(route.params.userId || ""));

// States
const tfa = ref<boolean | null>(null);
const isLoading = ref(false);
const isDisabling = ref(false);
const errorMessage = ref<string | null>(null);
const showDisableTFAModal = ref(false);

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();
const { serverResponseErrors, loadingMessages, loadingScreenMessages } = useTranslations(t);

// Toast
const { $toast } = useNuxtApp();

// Request IDs
const requestId = getUniqueStringId();
const disableTFARequestId = getUniqueStringId();

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
            tfa.value = data.tfa;

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
            });
        })
        .onUnexpectedError((err) => {
            isLoading.value = false;

            errorMessage.value = err?.message || serverResponseErrors.value.UNKNOWN_ERROR;
        });
};

// Data
await loadUserData();

const { requireLogin } = useRequireLogin();

// Methods
const disableUserTFA = async () => {
    isDisabling.value = true;

    Request.Pending(disableTFARequestId, ApiUsersAdmin.DisableTFA(userId.value))
        .onSuccess(() => {
            isDisabling.value = false;
            $toast.success($t("The two-factor authentification was successfully disabled"), {
                toastId: "disable-two-factor-auth-success",
            });

            // Refresh data
            loadUserData();
        })
        .onCancel(() => {
            isDisabling.value = false;
        })
        .onRequestError((err, handleErr) => {
            isDisabling.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                notFound: () => {
                    $toast.error($t("User not found"), {
                        toastId: "user-not-found",
                    });
                },
                forbidden: () => {
                    $toast.error(serverResponseErrors.value.FORBIDDEN_ACTION, {
                        toastId: "forbidden",
                    });
                },
                serverError: () => {
                    $toast.error(serverResponseErrors.value.INTERNAL_SERVER_ERROR, {
                        toastId: "ban-server-error",
                    });
                },
                networkError: () => {
                    $toast.error(serverResponseErrors.value.NETWORK_ERROR, {
                        toastId: "ban-network-error",
                    });
                },
            });
        })
        .onUnexpectedError((err) => {
            isDisabling.value = false;

            errorMessage.value = err?.message || serverResponseErrors.value.UNKNOWN_ERROR;
        });
};

// Abort handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
    Request.Abort(disableTFARequestId);
});
</script>
