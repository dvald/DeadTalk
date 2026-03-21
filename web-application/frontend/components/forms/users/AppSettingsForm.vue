<template>
    <Form @submit="submit">
        <FormRow>
            <SelectField
                id="language"
                v-model="formData.language"
                :label="$t('Default language')"
                :placeholder="$t('Select a language')"
                :options="languages"
                :type="SelectType.IMAGE"
                class="max-w-[250px]"
            />
        </FormRow>
        <FormRow>
            <SelectField
                id="theme"
                v-model="formData.theme"
                :label="$t('Default theme')"
                :placeholder="$t('Select a theme')"
                :options="themes"
                :type="SelectType.ICON"
                class="max-w-[250px]"
            />
        </FormRow>
        <FormActions>
            <ActionButton
                :text="$t('Save changes')"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:content-save-outline"
                type="submit"
                isMobileFullWidth
                :isLoading="isSaving"
                :loadingText="loadingMessages.SAVING_CHANGES"
            />
        </FormActions>
    </Form>
</template>
<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// Stores
const languageStore = useLanguageStore();
const { languages, setLanguage } = languageStore;

const themeStore = useThemeStore();
const { themes } = themeStore;
const { selectedTheme } = storeToRefs(themeStore);

// States
const formData = reactive<{
    language: LanguageCode;
    theme: UITheme;
}>({
    language: AuthController.Locale as LanguageCode,
    theme: selectedTheme.value,
});

const isSaving = ref(false);

// Request IDs
const requestId = getUniqueStringId();

// Toast
const { $toast } = useNuxtApp();

// Translation dependencies
const { t } = useI18n();
const { serverResponseErrors, loadingMessages } = useTranslations(t);

const { requireLogin } = useRequireLogin();

// Methods
const submit = async () => {
    isSaving.value = true;

    Request.Pending(requestId, ApiAccount.ChangeLocale({ locale: formData.language }))
        .onSuccess(() => {
            isSaving.value = false;
            AuthController.CheckAuthStatus();

            // Set store language
            setLanguage(formData.language);

            // Set store theme
            themeStore.setTheme(formData.theme);

            $toast.success($t("Changes saved"), {
                toastId: "changes-saved",
            });
        })
        .onCancel(() => {
            isSaving.value = false;
        })
        .onRequestError((err, handleErr) => {
            isSaving.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                serverError: () =>
                    $toast.error(serverResponseErrors.value.INTERNAL_SERVER_ERROR, {
                        toastId: "server-error",
                    }),

                networkError: () =>
                    $toast.error(serverResponseErrors.value.NETWORK_ERROR, {
                        toastId: "network-error",
                    }),
            });
        })
        .onUnexpectedError((err) => {
            isSaving.value = false;

            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "unexpected-error",
            });
        });
};

// Abort request handling
onBeforeUnmount(() => {
    Request.Abort(requestId);
});
</script>
