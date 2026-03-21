// https://eslint.nuxt.com/packages/module

// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
    rules: {
        "vue/attribute-hyphenation": "off",
        "vue/no-multiple-template-root": "off",
        "vue/require-default-prop": "off",
        "vue/multi-word-component-names": "off",
        "vue/v-on-event-hyphenation": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "no-useless-escape": "off",
        "@typescript-eslint/no-extraneous-class": "off",
        "@typescript-eslint/no-dynamic-delete": "off",
    },
});
