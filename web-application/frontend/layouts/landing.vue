<template>
    <CookieControl
        v-if="cookieWindowVisible"
        :locale
    />
    <LandingHeader />
    <ContentBody>
        <slot />
    </ContentBody>
    <Footer />
</template>

<script setup lang="ts">
// States
const cookieWindowVisible = ref(false);

// Translation dependencies
const { locale } = useI18n();

onMounted(() => {
    setTimeout(() => {
        cookieWindowVisible.value = true;
    }, 1000);
});
</script>
