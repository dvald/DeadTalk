export const useNavigationToastStore = defineStore("navigationToast", () => {
    const toastMessage = ref<string | null>(null);

    const setOriginPageToastMessage = (msg: string) => {
        toastMessage.value = msg;
    };

    const clearToast = () => {
        toastMessage.value = null;
    };

    return {
        toastMessage,
        setOriginPageToastMessage,
        clearToast,
    };
});
