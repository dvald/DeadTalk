<template>
    <div class="relative w-full max-w-[280px] mx-auto aspect-square flex items-center justify-center">
        <!-- Ectoplasm wave blobs (behind portrait) -->
        <div class="absolute inset-0 flex items-center justify-center">
            <div
                class="ectoplasm-wave absolute w-64 h-64 rounded-full"
                :style="{
                    backgroundColor: emotionColor,
                    opacity: isActive ? blobOpacity * 1.3 : 0.08,
                    transform: `scale(${isActive ? blobScale : 0.9})`,
                    animation: isActive ? 'none' : 'ectoplasm-breathe 4s ease-in-out infinite',
                }"
            />
            <div
                class="ectoplasm-wave absolute w-80 h-48 rounded-full"
                :style="{
                    backgroundColor: secondaryColor,
                    opacity: isActive ? blobOpacity * 0.8 : 0.05,
                    transform: `scale(${isActive ? blobScale * 0.95 : 0.85})`,
                    animation: isActive ? 'none' : 'ectoplasm-breathe-alt 5s ease-in-out infinite',
                }"
            />
            <div
                class="ectoplasm-wave absolute w-48 h-80 rounded-full"
                :style="{
                    backgroundColor: emotionColor,
                    opacity: isActive ? blobOpacity * 0.6 : 0.04,
                    transform: `scale(${isActive ? blobScale * 1.05 : 0.95})`,
                    animation: isActive ? 'none' : 'ectoplasm-breathe-slow 6s ease-in-out infinite',
                }"
            />
        </div>

        <!-- Portrait image: lip-sync frame > static photo > initial fallback -->
        <div
            class="relative z-10 w-48 h-48 rounded-sm overflow-hidden seance-glow group"
            :class="{ 'seance-glow-strong': isActive }"
        >
            <!-- Portrait image -->
            <img
                v-if="personaImage && !imageError"
                :src="personaImage"
                :alt="personaName"
                class="w-full h-full object-cover grayscale opacity-80 group-hover:scale-110 transition-transform duration-[2000ms]"
                @error="imageError = true"
            />
            <div
                v-else
                class="w-full h-full flex items-center justify-center bg-[#1b1b20]"
            >
                <span class="heading-font italic text-6xl text-[#f2c36b]/60">
                    {{ personaName.charAt(0) }}
                </span>
            </div>
            <!-- Bottom gradient fade -->
            <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

const props = defineProps({
    personaName: {
        type: String as PropType<string>,
        required: true,
    },
    personaImage: {
        type: String as PropType<string>,
        default: "",
    },
    isActive: {
        type: Boolean as PropType<boolean>,
        default: false,
    },
    emotionColor: {
        type: String as PropType<string>,
        default: "#d4a853",
    },
    frequencyDataFn: {
        type: Function as PropType<() => Uint8Array | null>,
        default: null,
    },
    emotionIntensity: {
        type: Number as PropType<number>,
        default: 1.0, // 1.0 = normal, 1.5+ = intense emotions (angry, excited)
    },
});

const secondaryColor = "#cec1e2";
const imageError = ref(false);

// Reactive blob animation driven by audio frequency data
const blobScale = ref(1);
const blobOpacity = ref(0.15);
let animFrameId: number | null = null;

function updateBlobs() {
    if (!props.isActive) {
        blobScale.value = 1;
        blobOpacity.value = 0.15;
        animFrameId = null;
        return;
    }

    const freqData = props.frequencyDataFn ? props.frequencyDataFn() : null;
    if (freqData && freqData.some((v) => v > 0)) {
        // Compute average amplitude (0..1)
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) {
            sum += freqData[i];
        }
        const avg = sum / (freqData.length * 255);
        // Smooth: lerp towards target — emotionIntensity amplifies the effect
        const intensity = props.emotionIntensity;
        const targetScale = 0.9 + avg * 0.5 * intensity;
        const targetOpacity = 0.12 + avg * 0.35 * intensity;
        blobScale.value += (targetScale - blobScale.value) * 0.15;
        blobOpacity.value += (targetOpacity - blobOpacity.value) * 0.15;
    } else {
        // No data — gentle idle pulse
        blobScale.value += (1 - blobScale.value) * 0.05;
        blobOpacity.value += (0.15 - blobOpacity.value) * 0.05;
    }

    animFrameId = requestAnimationFrame(updateBlobs);
}

watch(
    () => props.isActive,
    (active) => {
        if (active && animFrameId === null) {
            animFrameId = requestAnimationFrame(updateBlobs);
        }
    },
);

watch(
    () => props.personaImage,
    () => {
        imageError.value = false;
    },
);

onMounted(() => {
    if (props.isActive) {
        animFrameId = requestAnimationFrame(updateBlobs);
    }
});

onBeforeUnmount(() => {
    if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
});
</script>
