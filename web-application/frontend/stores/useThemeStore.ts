export const useThemeStore = defineStore("theme", () => {
    // Translation composable
    const { t } = useI18n();

    const themes = computed<Array<SelectOption & { value: UITheme }>>(() => [
        {
            text: t("Light"),
            value: "light",
            icon: "mdi:weather-sunny",
        },
        {
            text: t("Dark"),
            value: "dark",
            icon: "mdi:moon-waxing-crescent",
        },
        {
            text: t("System"),
            value: "system",
            icon: "mdi:theme-light-dark",
        },
    ]);

    const colorMode = useColorMode({
        emitAuto: true,
        modes: {
            light: "light",
            dark: "dark",
            system: "auto",
        },
    });

    const selectedTheme = ref<UITheme>((colorMode.value === "auto" ? "system" : colorMode.value) as UITheme);
    const isDark = computed(() => colorMode.value === "dark");
    const preferredDark = usePreferredDark();

    function setTheme(theme: UITheme) {
        selectedTheme.value = theme;
        colorMode.value = theme === "system" ? "auto" : theme;
    }

    watch(selectedTheme, (newTheme) => {
        setTheme(newTheme);
    });

    return {
        themes,
        selectedTheme,
        preferredDark,
        isDark,
        setTheme,
    };
});
