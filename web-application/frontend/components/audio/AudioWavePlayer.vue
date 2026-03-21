<template>
  <div class="flex items-center gap-3 w-full">
    <!-- Avatar with active glow -->
    <div class="relative shrink-0">
      <div
        v-if="isActive"
        class="absolute inset-0 rounded-full bg-background-primary-brand-default/30 animate-ping"
      />
      <Avatar
        :displayName="agentName"
        :imgUrl="agentAvatar"
        :size="AvatarSize.SM"
        :shape="AvatarShape.CIRCLE"
        :class="[
          'relative z-10 transition-shadow duration-300',
          isActive ? 'ring-2 ring-background-primary-brand-default' : '',
        ]"
      />
    </div>

    <!-- Name + waveform -->
    <div class="flex-1 min-w-0 flex flex-col gap-1">
      <!-- Agent name + emotion tag -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-text-default truncate">
          {{ agentName }}
        </span>
        <Badge
          v-if="audioTag"
          :text="audioTag"
          :color="ColorAccent.NEUTRAL"
          class="shrink-0"
        />
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
});

const CANVAS_HEIGHT = 32;
const BAR_COUNT = 24;
const BAR_GAP = 2;
const BAR_MIN_HEIGHT = 2;

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
let phase = 0;

function getColorToken(varName: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
}

function drawWave(timestamp: number) {
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
    // Animated bars
    const activeColor = getColorToken("--color-background-primary-brand-default", "#6366f1");
    ctx.fillStyle = activeColor;
    phase = timestamp * 0.003;

    for (let i = 0; i < BAR_COUNT; i++) {
      const x = i * totalBarSpace;
      // Multiple sine waves for organic movement
      const wave1 = Math.sin(phase + i * 0.4) * 0.4;
      const wave2 = Math.sin(phase * 1.7 + i * 0.7) * 0.3;
      const wave3 = Math.sin(phase * 0.5 + i * 0.2) * 0.3;
      const normalizedHeight = 0.3 + Math.abs(wave1 + wave2 + wave3) * 0.7;
      const barHeight = Math.max(BAR_MIN_HEIGHT, normalizedHeight * (h - 4));
      const y = (h - barHeight) / 2;

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1);
      ctx.fill();
    }
  } else {
    // Idle: flat line
    const idleColor = getColorToken("--color-border-default", "#d1d5db");
    ctx.fillStyle = idleColor;

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
    drawWave(0);
  });
}

watch(() => props.isActive, (active) => {
  if (active) {
    startAnimation();
  } else {
    stopAnimation();
  }
});

onMounted(() => {
  nextTick(() => {
    if (props.isActive) {
      startAnimation();
    } else {
      drawWave(0);
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
