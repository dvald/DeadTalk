const toastifyOptions = reactive({
    autoClose: 5000,
    position: "bottom-center",
    theme: "colored",
});

export const useToastifyConfig = () => toastifyOptions;
