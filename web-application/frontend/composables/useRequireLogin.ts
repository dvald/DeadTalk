// Composable to require the login of the user

"use strict";

/**
 * Composable to get a function to require the user login
 */
export function useRequireLogin() {
    let requiredLogin = false;

    const router = useRouter();
    const route = useRoute();

    const requireLogin = () => {
        if (requiredLogin) {
            return;
        }

        requiredLogin = true;

        AuthController.ClearSession();

        const goBackRoute = route
            ? {
                  name: route.name as string,
                  params: clone(route.params),
                  query: clone(route.query),
              }
            : { name: "index" };

        const unauthorizedRoutes = [
            "login",
            "register",
            "forgot-password", //TODO: adjust according to your routes
        ];

        if (!unauthorizedRoutes.includes(goBackRoute.name)) {
            AuthController.PageToGo = goBackRoute;
        }

        if (goBackRoute.name !== "login") {
            router.push({ name: "login" });
        }

        requiredLogin = false;
    };

    const goBackFromLogin = () => {
        const localePath = useLocalePath();
        const pageToGo = AuthController.PageToGo;

        AuthController.PageToGo = { name: "app" };

        const defaultRoutes = ["app", "index"];
        if (defaultRoutes.includes(pageToGo.name) && !pageToGo.params && !Object.keys(pageToGo.query || {}).length) {
            router.push(localePath(`/${AppSlug.APP}/${AppSlug.PROFILE}`));
        } else {
            router.push({
                name: pageToGo.name,
                params: pageToGo.params,
                query: pageToGo.query,
            });
        }
    };

    return {
        requireLogin,
        goBackFromLogin,
    };
}
