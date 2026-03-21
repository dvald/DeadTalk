<template>
    <Section
        :hasSidePadding="false"
        :spacing="SectionSpacing.NONE"
        class="gap-5"
    >
        <SectionHeader>
            <Heading
                :overtitle="$t('Account')"
                :title
                :size="HeadingSize.SM"
            />
        </SectionHeader>
        <SectionBody>
            <ProfileDataForm
                v-if="userProfile"
                :data="userProfile"
            />
        </SectionBody>
    </Section>
</template>

<script setup lang="ts">
import { Request } from "@asanrom/request-browser";

definePageMeta({ layout: "account-settings" });

const accountStore = useAccountStore();

// Page title
const title = computed(() => $t("Profile data"));

useHead(() => ({
    title: title.value,
}));

const userProfile = ref<UserProfile | null>(null);
const requestId = getUniqueStringId();
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const route = useRoute();
const userId = computed(() => String(route.params.userId || ""));

const { t } = useI18n();
const { serverResponseErrors } = useTranslations(t);

// Composables
const { isRouteCurrentUser } = useRoutes();

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

    Request.Pending(requestId, ApiProfile.GetProfile(isRouteCurrentUser.value ? AuthController.UID : userId.value))
        .onSuccess((profile) => {
            isLoading.value = false;
            userProfile.value = profile;
            accountStore.userId = profile.id;
            accountStore.username = profile.username;
            accountStore.profileName = profile.name || "";
            accountStore.profileImage = profile.image || "";
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

// Data
await load();

const onAuthChanged = () => {
    load();
};

onMounted(() => {
    listenOnAppEvent("auth-status-changed", onAuthChanged);
});

onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
});
</script>
