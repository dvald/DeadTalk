// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: false },

    nitro: {
        output: {
            publicDir: path.join(__dirname, "dist"),
        },
    },

    routeRules: {
        "/app/**": { ssr: false }, // Disable SSR for all pages under "app"
    },

    runtimeConfig: {
        public: {
            platformName: process.env.VITE__PLATFORM_NAME ?? "DLT Template",
        },
    },

    devServer: {
        port: Number(process.env.DEV_PORT) || 8080,
        host: process.env.VITE__DEV_TEST_HOST || "localhost",
    },

    modules: ["@pinia/nuxt", "@vueuse/nuxt", "@nuxt/content", "@nuxtjs/i18n", "@dargmuesli/nuxt-cookie-control", "@nuxt/icon"],

    plugins: ["@/plugins/vue3-toastify", { src: "~/plugins/disable-slot-warning.client.ts", mode: "client" }],

    // Auto-imports
    imports: {
        dirs: ["models/**", "api/**", "control/**", "composables/**"],
    },

    components: [
        // Auto-import components based only on its name, not path,
        {
            path: "@/components",
            pathPrefix: false,
        },
    ],

    // Extends the project with other autoimportable nuxt project directories
    extends: ["@imaginario27/air-ui-ds/nuxt.config.ts", "@imaginario27/air-ui-utils/nuxt.config.ts"],

    app: {
        head: {
            htmlAttrs: {
                lang: "en",
            },
            link: [
                // Preconnect for fonts
                { rel: "preconnect", href: "https://fonts.googleapis.com" },
                {
                    rel: "preconnect",
                    href: "https://fonts.gstatic.com",
                    crossorigin: "anonymous",
                },
                {
                    rel: "stylesheet",
                    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap",
                },

                // Favicons
                // Generate favicons: https://favicon.io/
                {
                    rel: "apple-touch-icon",
                    sizes: "180x180",
                    href: "/images/favicon/apple-touch-icon.png",
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "192x192",
                    href: "/images/favicon/android-chrome-192x192.png",
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "512x512",
                    href: "/images/favicon/android-chrome-512x512.png",
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "32x32",
                    href: "/images/favicon/favicon-32x32.png",
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "16x16",
                    href: "/images/favicon/favicon-16x16.png",
                },
                {
                    rel: "icon",
                    type: "image/x-icon",
                    href: "/images/favicon/favicon.ico",
                },
            ],

            meta: [
                {
                    name: "viewport",
                    content: "width=device-width, initial-scale=1.0, user-scalable=no",
                },
            ],

            // Default title while waiting for title to be set in page components
            title: "Loading...",

            // $s is replaced by the page title
            titleTemplate: `%s | ${process.env.VITE__PLATFORM_NAME ?? "DLT Template"}`,
        },
    },

    icon: {
        customCollections: [
            {
                prefix: "custom-icons",
                dir: "./assets/images/icons",
                // if you want to include all the icons in nested directories:
                recursive: true,
            },
        ],
    },

    i18n: {
        langDir: "locales",
        strategy: "no_prefix",
        defaultLocale: "en",
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: "i18n_redirected",
            fallbackLocale: "en",
            alwaysRedirect: false,
            redirectOn: "root",
        },
        locales: [
            {
                code: "en",
                iso: "en",
                name: "English",
                file: "en.json",
            },
            {
                code: "es",
                iso: "es",
                name: "Español",
                file: "es.json",
            },
        ],
        vueI18n: "i18n.config.ts",
    },

    cookieControl: {
        // The locales to include
        locales: ["es", "en"],

        // Translations to override
        localeTexts: {
            es: {
                save: "Recordar",
                accept: "Aceptar",
                acceptAll: "Aceptar todo",
                bannerDescription: `Usamos tanto cookies esenciales como de terceros para garantizar el correcto funcionamiento de nuestro
                sitio web y mejorar su experiencia analizando cómo se usa el sitio. Puede gestionar sus preferencias de cookies en cualquier momento,
                permitiéndole controlar a qué cookies da su consentimiento.`,
                bannerTitle: "Consentimiento de cookies",
                close: "X",
                cookiesFunctional: "Cookies funcionales",
                cookiesNecessary: "Cookies necesarias",
                cookiesOptional: "Cookies opcionales",
                decline: "Rechazar",
                declineAll: "Rechazar opcionales",
                here: "aquí",
                iframeBlocked: "Para ver esto, habilite las cookies funcionales",
                manageCookies: "Configuración",
                settingsUnsaved: "Tiene configuraciones sin guardar",
            },
            en: {
                save: "Remember",
                accept: "Accept",
                acceptAll: "Accept all",
                bannerDescription: `We use both essential and third-party cookies to ensure the proper functioning of our website
                and to improve your experience by analyzing how the site is used. You can manage your cookie preferences at any time,
                allowing you to control which cookies you consent to.`,
                bannerTitle: "Cookie Consent",
                close: "X",
                cookiesFunctional: "Functional cookies",
                cookiesNecessary: "Necessary cookies",
                cookiesOptional: "Optional cookies",
                decline: "Decline",
                declineAll: "Decline optional",
                here: "here",
                iframeBlocked: "To view this, please enable functional cookies",
                manageCookies: "Settings",
                settingsUnsaved: "You have unsaved settings",
            },
        },

        // The cookies that are to be controlled
        cookies: {
            necessary: [
                {
                    name: {
                        es: "Token de sesión",
                        en: "Session token",
                    },
                    id: "x-session-token",
                    description: {
                        es: "Esta cookie almacena el token de tu sesión.",
                        en: "This cookie stores your session token.",
                    },
                    isPreselected: true, // Switch will be disabled
                },
            ],
            optional: [],
        },

        // The milliseconds from now until expiry of the cookies that are being set by this module
        cookieExpiryOffsetMs: 1000 * 60 * 60 * 24 * 14, // Two weeks

        // Names for the cookies that are being set by this module
        cookieNameIsConsentGiven: "ncc_c",
        cookieNameCookiesEnabledIds: "ncc_e",

        // Switch to toggle the "accept necessary" button
        isAcceptNecessaryButtonEnabled: true,
    },

    // Type checking when running dev or build | Manual checking: npx nuxt typecheck
    typescript: {
        typeCheck: true,
    },

    css: ["~/assets/css/main.css", "~/assets/css/cookie-control.css"],

    vite: {
        plugins: [tailwindcss() as any], // As any: fixes type error: Plugin$1<any>[]' is not assignable to type 'PluginOption
    },
});
