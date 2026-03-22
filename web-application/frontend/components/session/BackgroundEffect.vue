<template>
    <canvas
        ref="canvasRef"
        class="absolute inset-0 z-0 pointer-events-none"
        :width="canvasWidth"
        :height="canvasHeight"
    />
</template>

<script setup lang="ts">
import type { PropType } from "vue";

const props = defineProps({
    personaId: {
        type: String as PropType<string>,
        required: true,
    },
    isActive: {
        type: Boolean as PropType<boolean>,
        default: false,
    },
    emotionColor: {
        type: String as PropType<string>,
        default: "#d4a853",
    },
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasWidth = ref(400);
const canvasHeight = ref(600);
let animFrameId: number | null = null;

// Particle system
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    opacity: number;
    text?: string; // For equation particles
}

let particles: Particle[] = [];

// Per-persona effect configuration
interface EffectConfig {
    color: string;
    glowColor: string;
    particleCount: number;
    init: (w: number, h: number) => Particle[];
    draw: (ctx: CanvasRenderingContext2D, p: Particle, w: number, h: number, time: number, intensity: number) => void;
    update: (p: Particle, w: number, h: number) => void;
}

function createTeslaEffect(): EffectConfig {
    return {
        color: "#00d4ff",
        glowColor: "rgba(0, 212, 255, 0.3)",
        particleCount: 25,
        init(w, h) {
            return Array.from({ length: 25 }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: Math.random() * 100,
                maxLife: 60 + Math.random() * 60,
                size: 1 + Math.random() * 2,
                opacity: 0.3 + Math.random() * 0.5,
            }));
        },
        draw(ctx, p, w, h, time, intensity) {
            // Electric arc segments
            ctx.strokeStyle = `rgba(0, 212, 255, ${p.opacity * intensity})`;
            ctx.lineWidth = p.size * intensity;
            ctx.shadowColor = "rgba(0, 212, 255, 0.6)";
            ctx.shadowBlur = 8 * intensity;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            const segments = 3 + Math.floor(Math.random() * 3);
            let cx = p.x;
            let cy = p.y;
            for (let i = 0; i < segments; i++) {
                cx += (Math.random() - 0.5) * 30;
                cy += (Math.random() - 0.5) * 30;
                ctx.lineTo(cx, cy);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        },
        update(p, w, h) {
            p.x += p.vx;
            p.y += p.vy;
            p.life++;
            if (p.life > p.maxLife || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
                p.x = Math.random() * w;
                p.y = Math.random() * h;
                p.life = 0;
                p.opacity = 0.3 + Math.random() * 0.5;
            }
        },
    };
}

function createCurieEffect(): EffectConfig {
    return {
        color: "#4ade80",
        glowColor: "rgba(74, 222, 128, 0.2)",
        particleCount: 40,
        init(w, h) {
            return Array.from({ length: 40 }, () => ({
                x: w * 0.3 + Math.random() * w * 0.4,
                y: h * 0.8 + Math.random() * h * 0.2,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -0.3 - Math.random() * 0.8,
                life: Math.random() * 100,
                maxLife: 120 + Math.random() * 80,
                size: 1 + Math.random() * 3,
                opacity: 0.2 + Math.random() * 0.6,
            }));
        },
        draw(ctx, p, _w, _h, _time, intensity) {
            // Glowing radium particles floating up
            const r = p.size * intensity;
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
            gradient.addColorStop(0, `rgba(74, 222, 128, ${p.opacity * intensity})`);
            gradient.addColorStop(1, `rgba(74, 222, 128, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(180, 255, 200, ${p.opacity * intensity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 0.5, 0, Math.PI * 2);
            ctx.fill();
        },
        update(p, w, h) {
            p.x += p.vx + Math.sin(p.life * 0.05) * 0.3;
            p.y += p.vy;
            p.life++;
            p.opacity *= 0.998;
            if (p.life > p.maxLife || p.y < 0 || p.opacity < 0.05) {
                p.x = w * 0.3 + Math.random() * w * 0.4;
                p.y = h * 0.8 + Math.random() * h * 0.2;
                p.life = 0;
                p.opacity = 0.2 + Math.random() * 0.6;
                p.vy = -0.3 - Math.random() * 0.8;
            }
        },
    };
}

function createEinsteinEffect(): EffectConfig {
    const equations = [
        "E=mc\u00B2",
        "\u2207\u00B2\u03C8",
        "\u222B\u222B",
        "dx/dt",
        "\u0127",
        "R\u03BC\u03BD",
        "\u03BB",
        "\u03C0r\u00B2",
        "c\u00B2",
        "\u2206t",
    ];
    return {
        color: "#a0aec0",
        glowColor: "rgba(160, 174, 192, 0.15)",
        particleCount: 15,
        init(w, h) {
            return Array.from({ length: 15 }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -0.1 - Math.random() * 0.3,
                life: Math.random() * 200,
                maxLife: 200 + Math.random() * 150,
                size: 10 + Math.random() * 6,
                opacity: 0.1 + Math.random() * 0.25,
                text: equations[Math.floor(Math.random() * equations.length)],
            }));
        },
        draw(ctx, p, _w, _h, _time, intensity) {
            ctx.font = `${p.size}px serif`;
            ctx.fillStyle = `rgba(200, 210, 230, ${p.opacity * intensity})`;
            ctx.fillText(p.text || "E=mc\u00B2", p.x, p.y);
        },
        update(p, w, h) {
            p.x += p.vx;
            p.y += p.vy;
            p.life++;
            p.opacity *= 0.999;
            if (p.life > p.maxLife || p.y < -20 || p.opacity < 0.03) {
                p.x = Math.random() * w;
                p.y = h + 20;
                p.life = 0;
                p.opacity = 0.1 + Math.random() * 0.25;
                p.text = equations[Math.floor(Math.random() * equations.length)];
            }
        },
    };
}

function createCleopatraEffect(): EffectConfig {
    return {
        color: "#d4a853",
        glowColor: "rgba(212, 168, 83, 0.2)",
        particleCount: 35,
        init(w, h) {
            return Array.from({ length: 35 }, () => ({
                x: Math.random() * w,
                y: -10 - Math.random() * h * 0.3,
                vx: (Math.random() - 0.5) * 0.4,
                vy: 0.2 + Math.random() * 0.5,
                life: Math.random() * 150,
                maxLife: 150 + Math.random() * 100,
                size: 1 + Math.random() * 2,
                opacity: 0.15 + Math.random() * 0.4,
            }));
        },
        draw(ctx, p, _w, _h, time, intensity) {
            // Gold dust particles drifting down
            const shimmer = 0.7 + Math.sin(time * 0.003 + p.life * 0.1) * 0.3;
            ctx.fillStyle = `rgba(242, 195, 107, ${p.opacity * intensity * shimmer})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * intensity, 0, Math.PI * 2);
            ctx.fill();
        },
        update(p, w, h) {
            p.x += p.vx + Math.sin(p.life * 0.02) * 0.2;
            p.y += p.vy;
            p.life++;
            if (p.life > p.maxLife || p.y > h + 10) {
                p.x = Math.random() * w;
                p.y = -10;
                p.life = 0;
                p.opacity = 0.15 + Math.random() * 0.4;
            }
        },
    };
}

function createJobsEffect(): EffectConfig {
    return {
        color: "#6b7280",
        glowColor: "rgba(107, 114, 128, 0.1)",
        particleCount: 20,
        init(w, h) {
            const cols = 5;
            const rows = 4;
            return Array.from({ length: cols * rows }, (_, i) => ({
                x: (i % cols) * (w / cols) + w / (cols * 2),
                y: Math.floor(i / cols) * (h / rows) + h / (rows * 2),
                vx: 0,
                vy: 0,
                life: Math.random() * 100,
                maxLife: 999,
                size: 2,
                opacity: 0.08 + Math.random() * 0.12,
            }));
        },
        draw(ctx, p, _w, _h, time, intensity) {
            // Minimalist grid dots with subtle pulse
            const pulse = 0.8 + Math.sin(time * 0.002 + p.x * 0.01 + p.y * 0.01) * 0.2;
            const r = p.size * pulse * intensity;
            ctx.fillStyle = `rgba(180, 180, 190, ${p.opacity * intensity * pulse})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
        },
        update(p, _w, _h) {
            p.life++;
        },
    };
}

// Default effect for unknown personas
function createDefaultEffect(): EffectConfig {
    return createCleopatraEffect(); // Gold dust as default
}

const EFFECTS: Record<string, () => EffectConfig> = {
    tesla: createTeslaEffect,
    einstein: createEinsteinEffect,
    curie: createCurieEffect,
    cleopatra: createCleopatraEffect,
    jobs: createJobsEffect,
};

function getEffect(personaId: string): EffectConfig {
    const factory = EFFECTS[personaId];
    return factory ? factory() : createDefaultEffect();
}

let effect: EffectConfig | null = null;
let startTime = 0;

function initEffect() {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
        canvasWidth.value = Math.floor(rect.width);
        canvasHeight.value = Math.floor(rect.height);
    }

    effect = getEffect(props.personaId);
    particles = effect.init(canvasWidth.value, canvasHeight.value);
    startTime = performance.now();
}

function animate() {
    const canvas = canvasRef.value;
    if (!canvas || !effect) {
        animFrameId = null;
        return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        animFrameId = null;
        return;
    }

    const w = canvasWidth.value;
    const h = canvasHeight.value;
    const time = performance.now() - startTime;
    const intensity = props.isActive ? 1.0 : 0.3;

    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
        effect.draw(ctx, p, w, h, time, intensity);
        effect.update(p, w, h);
    }

    animFrameId = requestAnimationFrame(animate);
}

// Re-init on persona change
watch(
    () => props.personaId,
    () => {
        initEffect();
    },
);

onMounted(() => {
    initEffect();
    animFrameId = requestAnimationFrame(animate);
});

onBeforeUnmount(() => {
    if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
});
</script>
