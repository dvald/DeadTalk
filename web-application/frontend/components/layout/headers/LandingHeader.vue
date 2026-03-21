<template>
    <CompactHeader
        :navMenuItems="menuItems"
        isSticky
        hasGlassEffect
        navMobileMenuClass="min-w-[326px]"
    >
        <template #header-logo>
            <AppLogo
                :src="isDark ? logoDark : logoLight"
                logoClass="max-w-[84px]"
            />
        </template>

        <template #header-actions>
            <DropdownSelect
                v-if="languages.length && currentLanguage"
                v-model="currentLanguage"
                :options="languages"
                :type="SelectType.IMAGE"
                class="w-full min-w-[160px]"
                selectBoxClass="bg-background-neutral-default"
            />

            <ThemeToggle
                :hasOnlyIcons="!isMobile"
                :customClass="isMobile ? 'py-4 border-y border-border-neutral-subtle' : undefined"
            />

            <ActionButton
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                :text="$t('Access')"
                :actionType="ButtonActionType.LINK"
                :to="localePath(`/${AppSlug.LOGIN}`)"
                :isFullWidth="isMobile"
            />
        </template>
    </CompactHeader>
</template>
<script setup lang="ts">
// Imports
import logoLight from "@/public/images/logo/air-ui-logo-color.svg?raw";
import logoDark from "@/public/images/logo/air-ui-logo-white.svg?raw";

// Stores
const languageStore = useLanguageStore();
const { languages } = languageStore;
const { currentLanguage } = storeToRefs(languageStore);

const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);

// Translation dependencies
const localePath = useLocalePath();

// Composables
const { isMobile } = useIsMobile();

// Computed
const menuItems = computed<MenuItem[]>(() => [
    {
        text: $t("Home"),
        to: localePath("/"),
    },
    {
        text: $t("About"),
        to: localePath("/about"),
    },
]);
</script>
