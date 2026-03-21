<template>
    <Card
        :hasShadow="false"
        hasBorder
        class="w-full seance-card-border transition-all duration-200"
    >
        <CardBody class="!p-3 flex flex-col gap-2">
            <!-- Header: favicon + domain + time -->
            <div class="flex items-center gap-2">
                <img
                    :src="faviconUrl"
                    :alt="domain"
                    class="w-4 h-4 rounded-sm shrink-0"
                    @error="onFaviconError"
                />
                <span class="text-xs text-text-neutral-subtle truncate flex-1">{{ domain }}</span>
                <span class="text-xs text-text-neutral-subtle shrink-0">{{ relativeTime }}</span>
            </div>

            <!-- Title -->
            <a
                :href="source.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm font-medium text-text-default line-clamp-2 hover:underline"
            >
                {{ source.title }}
            </a>

            <!-- Snippet -->
            <p class="text-xs text-text-neutral-subtle line-clamp-3 leading-relaxed">
                {{ source.snippet }}
            </p>
        </CardBody>
    </Card>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { SourceCard } from "~/models/source-card";

const props = defineProps({
    source: {
        type: Object as PropType<SourceCard>,
        required: true,
    },
});

const faviconFallback = ref(false);

const domain = computed(() => {
    try {
        return new URL(props.source.url).hostname.replace("www.", "");
    } catch {
        return props.source.url;
    }
});

const faviconUrl = computed(() => {
    if (faviconFallback.value || !props.source.favicon) {
        return "https://www.google.com/s2/favicons?sz=32&domain=" + encodeURIComponent(domain.value);
    }
    return props.source.favicon;
});

const relativeTime = computed(() => {
    const diff = Math.floor((Date.now() - props.source.timestamp) / 1000);
    if (diff < 60) return diff + "s";
    if (diff < 3600) return Math.floor(diff / 60) + "m";
    if (diff < 86400) return Math.floor(diff / 3600) + "h";
    return Math.floor(diff / 86400) + "d";
});

function onFaviconError() {
    faviconFallback.value = true;
}
</script>
