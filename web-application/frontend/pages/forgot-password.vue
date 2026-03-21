<template>
    <Card class="p-9 max-w-[460px]">
        <CardBody>
            <div class="flex flex-col gap-9 items-center">
                <Heading
                    :title
                    :size="HeadingSize.SM"
                    :align="Align.CENTER"
                />

                <ForgotPasswordForm />
            </div>
        </CardBody>
    </Card>
</template>
<script setup lang="ts">
definePageMeta({
    layout: "auth",
    auth: false, // Avoids infinite redirection
});

// Page title
const title = computed(() => $t("Recover password"));

useHead(() => ({
    title: title.value,
}));

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
</script>
