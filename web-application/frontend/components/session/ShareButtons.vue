<template>
    <div class="flex items-center gap-2">
        <!-- X (Twitter) -->
        <a
            :href="twitterUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="share-btn"
            :title="$t('Share on X')"
        >
            <Icon
                name="mdi:twitter"
                class="w-5 h-5"
            />
        </a>

        <!-- LinkedIn -->
        <a
            :href="linkedInUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="share-btn"
            :title="$t('Share on LinkedIn')"
        >
            <Icon
                name="mdi:linkedin"
                class="w-5 h-5"
            />
        </a>

        <!-- Copy caption (for Instagram / TikTok) -->
        <button
            class="share-btn"
            :title="$t('Copy caption for Instagram/TikTok')"
            @click="copyCaption"
        >
            <Icon
                :name="copied ? 'mdi:check' : 'mdi:content-copy'"
                class="w-5 h-5"
            />
        </button>

        <!-- Web Share API (mobile) -->
        <button
            v-if="canNativeShare"
            class="share-btn"
            :title="$t('Share')"
            @click="nativeShare"
        >
            <Icon
                name="mdi:share-variant"
                class="w-5 h-5"
            />
        </button>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    personaName: string;
    personaEra?: string;
}>();

const copied = ref(false);

const shareText = computed(() => {
    const era = props.personaEra ? ` (${props.personaEra})` : "";
    return `I just talked to ${props.personaName}${era} on DeadTalk! #ElevenHacks @elevenlabsio @firecrawl_dev`;
});

const shareUrl = computed(() => {
    return typeof window !== "undefined" ? window.location.origin : "";
});

const twitterUrl = computed(() => {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.value)}&url=${encodeURIComponent(shareUrl.value)}`;
});

const linkedInUrl = computed(() => {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl.value)}`;
});

const canNativeShare = computed(() => {
    return typeof navigator !== "undefined" && !!navigator.share;
});

async function copyCaption() {
    try {
        await navigator.clipboard.writeText(shareText.value + "\n" + shareUrl.value);
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 2000);
    } catch {
        // clipboard unavailable
    }
}

async function nativeShare() {
    try {
        await navigator.share({
            title: "DeadTalk",
            text: shareText.value,
            url: shareUrl.value,
        });
    } catch {
        // user cancelled
    }
}
</script>

<style scoped>
.share-btn {
    @apply w-10 h-10 rounded-full flex items-center justify-center
         bg-background-neutral-subtle hover:bg-background-neutral-hover
         text-text-neutral-subtle hover:text-text-default
         transition-colors duration-150;
}
</style>
