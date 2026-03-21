<template>
    <Card class="p-9 max-w-[600px]">
        <CardBody>
            <div class="flex flex-col gap-9 items-center">
                <Heading
                    :title
                    :size="HeadingSize.SM"
                    :align="Align.CENTER"
                />

                <template v-if="thirdPartyServices.length">
                    <!-- Customize buttons for third-party auth actions here -->
                    <ActionButton
                        :text="$t('Sign up with Google')"
                        :iconPosition="IconPosition.LEFT"
                        :svgIcon="iconGoogleColor"
                        useSVGIconColor
                        isMobileFullWidth
                        class="mx-auto"
                    />

                    <TextLineDivider :text="$t('Or continue with')" />
                </template>

                <RegisterForm />
            </div>
        </CardBody>
    </Card>
</template>
<script setup lang="ts">
// Import
import { Request } from "@asanrom/request-browser";
import iconGoogleColor from "@/assets/images/icons/icon-google-color.svg?raw";

definePageMeta({
    layout: "auth",
    auth: false, // Avoids infinite redirection
});

// Page title
const title = computed(() => $t("Sign up"));

useHead(() => ({
    title: title.value,
}));

// States
const thirdPartyServices = ref<ThirdPartyLoginService[]>([]);

// Request IDs
const thirdPartyRequestId = getUniqueStringId();

// Data loaders
const loadThirdPartyServices = async () => {
    Request.Abort(thirdPartyRequestId);
    Timeouts.Abort(thirdPartyRequestId);

    Request.Pending(thirdPartyRequestId, ApiAuth.ThirdPartyLoginDetails())
        .onSuccess((tpServices) => {
            thirdPartyServices.value = tpServices;
        })
        .onRequestError((err, handleErr) => {
            handleErr(err, {
                temporalError: () => {
                    Timeouts.Set(thirdPartyRequestId, 1500, loadThirdPartyServices);
                },
            });
        })
        .onUnexpectedError(() => {
            Timeouts.Set(thirdPartyRequestId, 1500, loadThirdPartyServices);
        });
};

await loadThirdPartyServices();

const { listenOnAppEvent } = useGlobalEvents();
const { goBackFromLogin } = useRequireLogin();

const onAuthChanged = () => {
    if (AuthController.isAuthenticated()) {
        goBackFromLogin();
    }
};

onMounted(() => {
    listenOnAppEvent("auth-status-changed", onAuthChanged);
    onAuthChanged();
});

// Abort request handling
onBeforeUnmount(() => {
    Request.Abort(thirdPartyRequestId);
    Timeouts.Abort(thirdPartyRequestId);
});
</script>
