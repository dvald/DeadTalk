export const useNavSidebar = () => {
    // Composabel
    const { isMobile } = useIsMobile();

    const desktopOffset = 68 + 84 + 32 + 32;
    const mobileOffset = 68 + 32 + 16;

    const sidebarHeightOffset = computed(() => (isMobile.value ? mobileOffset : desktopOffset));

    return {
        sidebarHeightOffset,
    };
};
