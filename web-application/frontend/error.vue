<template>
    <div
        :class="[
            'w-full',
            'px-content-side-padding',
            'py-[10vw] md:py-[20vw]',
            'flex',
            'flex-col',
            'gap-4',
            'items-center',
            'justify-center',
        ]"
    >
        <ContainedIcon
            :color="ColorAccent.DANGER"
            icon="mdi:alert-circle-outline"
            :size="IconContainerSize.XXL"
        />

        <div class="flex flex-col gap-4 items-center w-full max-w-[600px]">
            <Heading
                :title="error.statusCode === 404 ? $t('Page not found') : error.statusCode.toString()"
                :align="Align.CENTER"
                :size="HeadingSize.MD"
            />
            <p class="text-text-neutral-subtle font-semibold text-center leading-6">
                {{
                    error.statusCode === 404
                        ? $t("The page you are looking for does not exist or may have been moved. Please try with another page.")
                        : getEnvErrorMessage(
                              error.message ?? $t("Something went wrong on our end. Please try again later."),
                              $t("Something went wrong on our end. Please try again later."),
                          )
                }}
            </p>
        </div>

        <div :class="['w-full', 'flex', 'gap-3', 'mt-6', 'items-center', 'justify-center', 'flex-col', 'md:flex-row']">
            <ActionButton
                :actionType="ButtonActionType.LINK"
                :text="$t('Back to home page')"
                class="w-full md:w-auto"
                icon="mdi:home-outline"
                :iconPosition="IconPosition.LEFT"
                :to="backToPath"
            />
        </div>
    </div>
</template>
<script setup lang="ts">
// Imports
import type { NuxtError } from "#app";

// Props
const props = defineProps({
    error: {
        type: Object as PropType<NuxtError>,
        required: true,
    },
});

// Composables
const route = useRoute();

// Translation dependencies
const localePath = useLocalePath();

// Computed
const backToPath = computed(() => {
    if (route.path.includes(`/${AppSlug.APP}`)) {
        return localePath(`/${AppSlug.APP}/${AppSlug.PROFILE}`);
    } else {
        return localePath("/");
    }
});

const pageTitleText = computed(() => (props.error.statusCode === 404 ? $t("Page not found") : String(props.error.statusCode)));

// Config
const { public: config } = useRuntimeConfig();

// Dynamically set the page title with a watcher (only for error page)
watchEffect(() => {
    document.title = pageTitle(pageTitleText.value, config.platformName);
});
</script>
