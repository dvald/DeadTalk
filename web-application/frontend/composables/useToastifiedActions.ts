export const useToastifiedActions = () => {
    // Toast
    const { $toast } = useNuxtApp();

    const { t } = useI18n();

    const { appNotifications } = useTranslations(t);

    // Methods
    const copyToClipboardWithNotification = async (
        text: string,
        successMessage: string = appNotifications.value.COPIED_TO_CLIPBOARD,
        toastId: string = "clipboard-success",
    ) => {
        const success = await copyToClipboard(text.toString() ?? "");

        if (success) {
            $toast.success(successMessage, { toastId: toastId });
        } else {
            $toast.error(appNotifications.value.COPY_TO_CLIPBOARD_ERROR, { toastId: `${toastId}-fail-message` });
        }
    };

    return {
        copyToClipboardWithNotification,
    };
};
