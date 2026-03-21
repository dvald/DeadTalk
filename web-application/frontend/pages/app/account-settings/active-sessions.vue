<template>
    <Section
        :hasSidePadding="false"
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <Heading
                :overtitle="$t('Security')"
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
                @retry="load"
            />
            <UserActiveSessionsTable
                v-if="!isLoading && !errorMessage"
                :data="currentUserSessions ?? []"
                isCurrentUser
                @closeSession="closeSession"
            />

            <ActionButton
                v-if="hasActiveSessions"
                :styleType="ButtonStyleType.DELETE_FILLED"
                :text="$t('Close all sesions')"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:close"
                :isLoading="isClosingSessions"
                :isLoadingText="loadingMessages.PROCESSING"
                @click="showCloseAllSessionsModal = true"
            />
        </SectionBody>
    </Section>
    <DangerModalDialog
        v-model="showCloseAllSessionsModal"
        :title="$t('Are you sure you want to close all sessions?')"
        :description="$t('Once confirmed, all sessions will be closed and you will need to log in again.')"
        :buttonActionText="$t('Close all session')"
        buttonActionIcon="mdi:close"
        @action="closeAllSessions"
    />
</template>

<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

definePageMeta({ layout: "account-settings" });

// Page title
const title = computed(() => $t("Active sessions"));

useHead(() => ({
    title: title.value,
}));

// States
const currentUserSessions = ref<SessionListItem[]>([]);
const showCloseAllSessionsModal = ref(false);

const isLoading = ref(false);
const isClosingSessions = ref(false);
const errorMessage = ref<string | null>(null);

// Request IDs
const requestId = getUniqueStringId();
const closeSessionRequestId = getUniqueStringId();
const closeAllSessionsRequestId = getUniqueStringId();

// Translation dependencies
const { t } = useI18n();
const { serverResponseErrors, loadingMessages, loadingScreenMessages } = useTranslations(t);

// Computed
const hasActiveSessions = computed(() => {
    return (currentUserSessions.value?.length ?? 0) > 0;
});

// Toast
const { $toast } = useNuxtApp();

const { requireLogin } = useRequireLogin();
const { listenOnAppEvent } = useGlobalEvents();

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

    Request.Pending(requestId, ApiAccount.GetSessions())
        .onSuccess((sessions) => {
            isLoading.value = false;

            currentUserSessions.value = sessions;
        })
        .onRequestError((err, handleErr) => {
            isLoading.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                temporalError: () => {
                    errorMessage.value = $t("User sessions request exceeded the allowed time limit.");
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
await load();

// Methods
const closeSession = async (token: string, isCurrentSession: boolean) => {
    // Abort previous timeouts and requests
    Timeouts.Abort(closeSessionRequestId);
    Request.Abort(closeSessionRequestId);

    Request.Pending(closeSessionRequestId, ApiAccount.CloseSession(token))
        .onSuccess(() => {
            // Logout current session
            if (isCurrentSession) {
                AuthController.Logout();
            } else {
                currentUserSessions.value = currentUserSessions.value.filter((sessionData) => {
                    return sessionData.session !== token;
                });

                $toast.error($t("Remote device session removed"), {
                    toastId: "close-session-success",
                });
            }
        })
        .onCancel(() => {
            // Do nothing - No loading state is handled here
        })
        .onRequestError((err, handleErr) => {
            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                serverError: () => {
                    $toast.error(serverResponseErrors.value.INTERNAL_SERVER_ERROR, {
                        toastId: "sessions-server-error",
                    });
                },
                networkError: () => {
                    $toast.error(serverResponseErrors.value.NETWORK_ERROR, {
                        toastId: "sessions-network-error",
                    });
                },
            });
        })
        .onUnexpectedError((err) => {
            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "ban-unexpected-error",
            });
        });
};

const closeAllSessions = async () => {
    // Abort previous timeouts and requests
    Timeouts.Abort(closeAllSessionsRequestId);
    Request.Abort(closeAllSessionsRequestId);

    isClosingSessions.value = true;

    Request.Pending(closeAllSessionsRequestId, ApiAccount.CloseAllSessions())
        .onSuccess(() => {
            isClosingSessions.value = false;

            AuthController.Logout();
        })
        .onCancel(() => {
            isClosingSessions.value = false;
        })
        .onRequestError((err, handleErr) => {
            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                serverError: () => {
                    $toast.error(serverResponseErrors.value.INTERNAL_SERVER_ERROR, {
                        toastId: "all-sessions-server-error",
                    });
                },
                networkError: () => {
                    $toast.error(serverResponseErrors.value.NETWORK_ERROR, {
                        toastId: "all-sessions-network-error",
                    });
                },
            });
        })
        .onUnexpectedError((err) => {
            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "all-sessions-unexpected-error",
            });
        });
};

const onAuthChanged = () => {
    load();
};

onMounted(() => {
    listenOnAppEvent("auth-status-changed", onAuthChanged);
});

// Abort handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
    Request.Abort(closeSessionRequestId);
    Request.Abort(closeAllSessionsRequestId);
});
</script>
