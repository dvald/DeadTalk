export default defineNuxtRouteMiddleware((to) => {
    const localePath = useLocalePath();

    if (to.path === localePath(`/${AppSlug.APP}`)) {
        return navigateTo(localePath(`/${AppSlug.APP}/${AppSlug.PROFILE}`));
    }
});
