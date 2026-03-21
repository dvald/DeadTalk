<template>
    <AppHeader showSidebarToggle />

    <ContentBody>
        <SidebarWithContentWrapper>
            <AppSidebar
                :heightOffset="sidebarHeightOffset"
                :stickyTopHeight="80"
                class="!w-[200px]"
            >
                <AdminPanelSidebarMenu />
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
const { sidebarHeightOffset } = useNavSidebar();
</script>
