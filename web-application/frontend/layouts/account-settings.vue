<template>
    <AppHeader showSidebarToggle />

    <ContentBody>
        <SidebarWithContentWrapper>
            <AppSidebar
                :heightOffset="sidebarHeightOffset"
                :stickyTopHeight="80"
                class="!w-[200px]"
            >
                <NuxtLink :to="userProfileRoute">
                    <User
                        :size="AvatarSize.SM"
                        isInteractive
                        :displayName="trimText(userDisplayName, 12)"
                        :imgUrl="userAvatarUrl"
                    />
                </NuxtLink>
                <AccountSidebarMenu v-if="isRouteCurrentUser" />
                <UserManagementSidebarMenu v-else />
            </AppSidebar>
            <AppMainContent>
                <slot />
            </AppMainContent>
        </SidebarWithContentWrapper>
    </ContentBody>

    <Footer />
</template>
<script setup lang="ts">
// Composables
const { isRouteCurrentUser } = useRoutes();
const { sidebarHeightOffset } = useNavSidebar();

// Translation dependencies
const localePath = useLocalePath();

// Stores
const accountStore = useAccountStore();

// Computed - Profile info based on the type of current user or the visited user
const userDisplayName = computed(() => {
    const getName = (name?: string, username?: string) => {
        const resolvedName = name?.trim() || username || "";

        // Capitzalize first letter if name is present
        return name?.trim() ? capitalizeFirstLetter(resolvedName) : resolvedName;
    };

    return getName(accountStore.profileName, accountStore.username);
});

const userAvatarUrl = computed(() => accountStore.profileImage || undefined);

const userProfileRoute = computed(() =>
    isRouteCurrentUser.value
        ? localePath(`/${AppSlug.APP}/${AppSlug.PROFILE}`)
        : localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${accountStore.userId}`),
);
</script>
