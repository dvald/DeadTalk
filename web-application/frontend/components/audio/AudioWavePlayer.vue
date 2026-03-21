<template>
    <div class="flex items-center gap-3 w-full">
        <!-- Avatar with emotion-colored aura -->
        <div class="relative shrink-0">
            <div
                v-if="isActive"
                class="absolute inset-0 rounded-full animate-ping transition-colors duration-500"
                :style="{ backgroundColor: emotionColor + '33' }"
            />
            <Avatar
                :displayName="agentName"
                :imgUrl="agentAvatar"
                :size="AvatarSize.SM"
                :shape="AvatarShape.CIRCLE"
                :class="['relative z-10 transition-all duration-500', isActive ? 'ring-2 seance-pulse' : '']"
                :style="isActive ? { '--tw-ring-color': emotionColor, boxShadow: `0 0 12px ${emotionColor}40` } : {}"
            />
        </div>

        <!-- Name + waveform -->
        <div class="flex-1 min-w-0 flex flex-col gap-1">
            <!-- Agent name (no badge — emotion is shown via aura) -->
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-text-default truncate">
                    {{ agentName }}
                </span>
            </div>

            <!-- Waveform canvas -->
            <canvas
                ref="canvasRef"
                class="w-full rounded-sm"
                :height="CANVAS_HEIGHT"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

const EMOTION_COLORS: Record<string, string> = {
    angry: "#ef4444",
    excited: "#f5d78e",
    whispers: "#9689a3",
    melancholy: "#79d2ff",
    pause: "#332f38",
    sad: "#79d2ff",
    surprised: "#f5d78e",
    thoughtful: "#9689a3",
    laughing: "#f5d78e",
    serious: "#9e9490",
};
const DEFAULT_EMOTION_COLOR = "#d4a853";

const props = defineProps({
    agentName: {
        type: String as PropType<string>,
        required: true,
    },
    agentAvatar: {
        type: String as PropType<string>,
        default: "",
    },
    isActive: {
        type: Boolean as PropType<boolean>,
        default: false,
    },
    audioTag: {
        type: String as PropType<string>,
        default: "",
    },
    frequencyDataFn: {
        type: Function as PropType<() => Uint8Array | null>,
        default: null,
    },
});

const emotionColor = computed(() => {
    if (!props.audioTag) return DEFAULT_EMOTION_COLOR;
    return EMOTION_COLORS[props.audioTag.toLowerCase()] || DEFAULT_EMOTION_COLOR;
});

const CANVAS_HEIGHT = 32;
const BAR_COUNT = 24;
const BAR_GAP = 2;
const BAR_MIN_HEIGHT = 2;

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;

function drawWave() {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ensure canvas pixel size matches layout size
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width) {
        canvas.width = rect.width;
    }

    const w = canvas.width;
    const h = CANVAS_HEIGHT;

    ctx.clearRect(0, 0, w, h);

    const barWidth = Math.max(2, (w - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT);
    const totalBarSpace = barWidth + BAR_GAP;

    if (props.isActive) {
        // Use emotion color for waveform bars
        ctx.fillStyle = emotionColor.value;

        // Try to get real frequency data
        const freqData = props.frequencyDataFn ? props.frequencyDataFn() : null;
        const hasRealData = freqData && freqData.some((v) => v > 0);

        for (let i = 0; i < BAR_COUNT; i++) {
            const x = i * totalBarSpace;
            let normalizedHeight: number;

            if (hasRealData && freqData) {
                // Map frequency bins to bars (resample if needed)
                const binIndex = Math.floor((i / BAR_COUNT) * freqData.length);
                const value = freqData[binIndex] / 255; // 0..1
                normalizedHeight = 0.05 + value * 0.95;
            } else {
                // Fallback: minimal bars when active but no data yet
                normalizedHeight = 0.1;
            }

            const barHeight = Math.max(BAR_MIN_HEIGHT, normalizedHeight * (h - 4));
            const y = (h - barHeight) / 2;

            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 1);
            ctx.fill();
        }
    } else {
        // Idle: flat line
        ctx.fillStyle = "#332f38";

        for (let i = 0; i < BAR_COUNT; i++) {
            const x = i * totalBarSpace;
            const y = (h - BAR_MIN_HEIGHT) / 2;

            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, BAR_MIN_HEIGHT, 1);
            ctx.fill();
        }
    }

    animationFrameId = requestAnimationFrame(drawWave);
}

function startAnimation() {
    if (animationFrameId !== null) return;
    animationFrameId = requestAnimationFrame(drawWave);
}

function stopAnimation() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // Draw idle state
    nextTick(() => {
        drawWave();
    });
}

watch(
    () => props.isActive,
    (active) => {
        if (active) {
            startAnimation();
        } else {
            stopAnimation();
        }
    },
);

onMounted(() => {
    nextTick(() => {
        if (props.isActive) {
            startAnimation();
        } else {
            drawWave();
        }
    });
});

onBeforeUnmount(() => {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
});
</script>
