import { defineI18nConfig } from "#i18n";

export default defineI18nConfig(() => {
    return {
        legacy: false,

        postTranslation: (translatedValue, key) => {
            if (translatedValue === "") {
                return key;
            }
            return translatedValue;
        },
    };
});
