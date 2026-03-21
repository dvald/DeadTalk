export const useRoutes = () => {
    // Route
    const route = useRoute();
    const router = useRouter();
    const previousRoute = useState<string | null>("previousRoute", () => null);
    const isRouteCurrentUser = ref(false);

    // Track the last route globally
    if (import.meta.client) {
        router.beforeEach((to, from, next) => {
            if (from.fullPath !== to.fullPath) {
                previousRoute.value = from.fullPath;
            }
            next();
        });
    }

    watch(
        () => route.params.userId,
        (userId) => {
            // If no user ID in route or matches the current user UID → it's the current user's view
            if (!userId || userId === AuthController.UID) {
                isRouteCurrentUser.value = true;
            }

            return false;
        },
        { immediate: true },
    );

    return {
        previousRoute,
        isRouteCurrentUser,
    };
};
