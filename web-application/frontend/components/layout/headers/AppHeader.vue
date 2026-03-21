<template>
    <CompactHeader
        :navMenuItems="menuItems"
        :userFullname="profileName"
        :userAvatarUrl="profileImage"
        :userMenuItems
        isSticky
        hasGlassEffect
        containerClass="h-[72px]"
        navMobileMenuClass="min-w-[326px]"
    >
        <template #header-logo>
            <AppLogo
                :src="isDark ? logoDark : logoLight"
                :to="localePath(`/${AppSlug.APP}/${AppSlug.PROFILE}`)"
                logoClass="max-w-[84px]"
            />

            <!-- Mobile sidebar toggler -->
            <ActionIconButton
                v-if="isMobile && showSidebarToggle"
                :icon="isMobileSidebarOpen ? 'mdi:menu-open' : 'mdi:menu-close'"
                class="ml-4"
                @click="toggleMobileSidebar"
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
                @update:model-value="onLanguageChanged"
            />

            <ThemeToggle
                :hasOnlyIcons="!isMobile"
                :customClass="isMobile ? 'pt-4 border-t border-border-neutral-subtle' : undefined"
            />
        </template>
    </CompactHeader>
</template>
<script setup lang="ts">
// Imports
import logoLight from "@/public/images/logo/air-ui-logo-color.svg?raw";
import logoDark from "@/public/images/logo/air-ui-logo-white.svg?raw";

// Props
defineProps({
    showSidebarToggle: {
        type: Boolean as PropType<boolean>,
        default: false,
    },
});

// Stores
const languageStore = useLanguageStore();
const { languages } = languageStore;
const { currentLanguage } = storeToRefs(languageStore);

const onLanguageChanged = () => {
    languageStore.setLanguage(currentLanguage.value);
};

const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);

// Composables
const { isMobileSidebarOpen, toggleMobileSidebar } = useMobileSidebar();
const { isMobile } = useIsMobile();

const { t } = useI18n();
const { can } = usePermissions(t);

// Translation dependencies
const localePath = useLocalePath();

// States
const profileName = ref(AuthController.ProfileName || AuthController.Username || "");
const profileImage = ref(AuthController.ProfileImage);
const loggedIn = ref(AuthController.isAuthenticated());

// Computed
const menuItems = computed<MenuItem[]>(() => [
    {
        text: $t("Dashboard"),
        to: localePath(`/${AppSlug.APP}/${AppSlug.PROFILE}`),
    },
]);

const userMenuItems = computed<DropdownMenuItem[]>(() => {
    const items: DropdownMenuItem[] = [
        {
            text: $t("User profile"),
            to: localePath(`/${AppSlug.APP}/${AppSlug.PROFILE}`),
            type: DropdownItemType.ICON,
            icon: "mdi:account-circle-outline",
        },
        {
            text: $t("Account settings"),
            to: localePath(`/${AppSlug.APP}/${AppSlug.ACCOUNT_SETTINGS}/profile-data`),
            type: DropdownItemType.ICON,
            icon: "mdi:cog-outline",
        },
    ];

    if (AuthController.Role === "admin" || can.value.manageUsers || can.value.moderateUsers || can.value.manageRoles) {
        items.push({
            text: $t("Admin panel"),
            to: localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.USERS}`),
            type: DropdownItemType.ICON,
            icon: "mdi:shield-account-outline",
        });
    }

    items.push({
        text: $t("Logout"),
        actionType: DropdownActionType.ACTION,
        type: DropdownItemType.DANGER_ICON,
        icon: "mdi:logout",
        callback: () => {
            AuthController.Logout();
            AuthController.PageToGo = { name: "index" };
            navigateTo({ name: "index" });
        },
    });

    return items;
});

const onAuthChanged = () => {
    profileName.value = AuthController.ProfileName || AuthController.Username || "";
    profileImage.value = AuthController.ProfileImage;
    loggedIn.value = AuthController.isAuthenticated();
};

const { listenOnAppEvent } = useGlobalEvents();

onMounted(() => {
    listenOnAppEvent("auth-status-changed", onAuthChanged);
});

// Block search engines from indexing app pages
useHead({
    meta: [
        {
            name: "robots",
            content: "noindex, nofollow",
        },
    ],
});
</script>
