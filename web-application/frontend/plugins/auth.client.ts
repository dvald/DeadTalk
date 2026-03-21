export default defineNuxtPlugin(() => {
    AuthController.Initialize();

    return {
        provide: {
            auth: AuthController,
        },
    };
});
