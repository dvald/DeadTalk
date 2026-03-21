export const useAccountStore = defineStore("account", () => {
    const userId = ref<string>("");
    const username = ref<string>("");
    const profileName = ref<string>("");
    const profileImage = ref<string>("");

    return {
        userId,
        username,
        profileName,
        profileImage,
    };
});
