<template>
    <Card class="p-9 max-w-[460px]">
        <CardBody>
            <div class="flex flex-col gap-9 items-center">
                <Heading
                    :title
                    :size="HeadingSize.SM"
                    :align="Align.CENTER"
                />

                <TFALoginForm />

                <NavLink
                    :text="$t('Don’t have an account yet? Sign up')"
                    :iconPosition="IconPosition.NONE"
                    :to="localePath('/register')"
                />
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
const title = computed(() => $t("TFA Login"));

useHead(() => ({
    title: title.value,
}));

// Translation dependencies
const localePath = useLocalePath();

const { goBackFromLogin } = useRequireLogin();

const onAuthChanged = () => {
    if (AuthController.isAuthenticated()) {
        goBackFromLogin();
    } else if (!AuthController.isAskingForTwoFactor()) {
        navigateTo(localePath(`/${AppSlug.LOGIN}`));
    }
};

const { listenOnAppEvent } = useGlobalEvents();

onMounted(() => {
    listenOnAppEvent("auth-status-changed", onAuthChanged);
    onAuthChanged();
});
</script>
