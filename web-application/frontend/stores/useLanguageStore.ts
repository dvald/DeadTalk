export const useLanguageStore = defineStore("language", () => {
    // Translation composable
    const { locale, locales, setLocale } = useI18n();

    // States
    const currentLanguage = ref<LanguageCode>();

    // Computed
    const languages = computed<Language[]>(() =>
        locales.value.map((lang, index) => ({
            id: String(index + 1),
            text: lang.name ?? "Language name not found",
            imgUrl: `/images/flags/flag-${lang.code}.png`,
            value: lang.code,
            callback: () => setLanguage(lang.code as LanguageCode),
        })),
    );

    // Methods
    const setLanguage = (code: LanguageCode) => {
        currentLanguage.value = code;
        setLanguagePreference(code);
    };

    // Initial language setup
    const initialLanguage = ((): LanguageCode => {
        const initialLocale = getLanguagePreference() || AuthController.Locale;
        return initialLocale && initialLocale !== "" ? (initialLocale as LanguageCode) : (locale.value as LanguageCode);
    })();

    // Set i18n locale explicitly
    if (initialLanguage !== locale.value) {
        setLocale(initialLanguage);
    }

    currentLanguage.value = initialLanguage;

    // Watchers
    watch(currentLanguage, async (newLanguage) => {
        if (newLanguage && newLanguage !== locale.value) {
            await setLocale(newLanguage);
        }
    });

    watch(
        locale,
        (newLocale) => {
            if (newLocale !== currentLanguage.value) {
                currentLanguage.value = newLocale as LanguageCode;
            }
        },
        { immediate: true },
    );

    return {
        currentLanguage,
        languages,
        setLanguage,
        locales,
    };
});
