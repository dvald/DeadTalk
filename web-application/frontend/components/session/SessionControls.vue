<template>
    <footer class="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center pointer-events-none">
        <div class="mb-6 w-[90%] max-w-md pointer-events-auto">
            <!-- Ended state: Back + SESSION ARCHIVED + Export CTA -->
            <div
                v-if="status === 'ended'"
                class="glassmorphism rounded-sm px-8 h-20 flex items-center justify-between"
            >
                <!-- Left: Back -->
                <button
                    class="text-[#e4e1e9]/50 hover:text-[#f2c36b] transition-all duration-500 flex items-center gap-2"
                    @click="$emit('back')"
                >
                    <Icon
                        name="mdi:arrow-left"
                        class="w-5 h-5"
                    />
                    <span class="hidden md:block text-[10px] uppercase tracking-[0.2em]">
                        {{ $t("Exit") }}
                    </span>
                </button>

                <!-- Center: Status -->
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-red-400/40 animate-pulse" />
                    <span class="text-[#e4e1e9] font-label text-[10px] uppercase tracking-[0.3em] font-light">
                        {{ $t("Session Archived") }}
                    </span>
                </div>

                <!-- Right: Export CTA -->
                <button
                    v-if="canExport"
                    class="flex items-center gap-2 bg-gradient-to-tr from-[#f2c36b] to-[#d4a853] text-[#131318] px-4 py-2 rounded-sm shadow-[0_0_15px_rgba(242,195,107,0.3)] hover:shadow-[0_0_25px_rgba(242,195,107,0.5)] transition-all duration-700"
                    @click="$emit('export')"
                >
                    <Icon
                        name="mdi:download"
                        class="w-4 h-4"
                    />
                    <span class="text-[10px] font-bold uppercase tracking-widest">
                        {{ $t("Export") }}
                    </span>
                </button>
            </div>

            <!-- Active / Connecting state: normal controls -->
            <div
                v-else
                class="glassmorphism rounded-sm p-4 flex items-center"
            >
                <!-- Left: Close + Interrupt (fixed width so center stays stable) -->
                <div class="flex-1 flex justify-start items-center gap-1">
                    <button
                        class="p-3 text-[#e4e1e9]/50 hover:bg-[#39383e] hover:text-[#e4e1e9] rounded-sm transition-all duration-500"
                        @click="$emit('stop')"
                    >
                        <Icon
                            name="mdi:close"
                            class="w-5 h-5"
                        />
                    </button>

                    <!-- Interrupt (next to close, only when agent speaking) -->
                    <button
                        v-if="isAgentSpeaking"
                        class="p-3 text-[#d4a853] hover:bg-[#d4a853]/10 rounded-sm transition-all duration-500"
                        :title="$t('Interrupt')"
                        @click="$emit('interrupt')"
                    >
                        <Icon
                            name="mdi:hand-back-left"
                            class="w-5 h-5"
                        />
                    </button>
                </div>

                <!-- Center: Mic only (flex-none, always centered) -->
                <div class="flex-none relative">
                    <!-- Auto mode: VAD-driven indicator -->
                    <button
                        v-if="micMode === 'auto'"
                        class="rounded-sm p-4 transition-all duration-500"
                        :class="
                            isSpeaking
                                ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105'
                                : 'bg-gradient-to-tr from-[#f2c36b] to-[#d4a853] shadow-[0_0_20px_rgba(242,195,107,0.4)]'
                        "
                        :disabled="status === 'connecting'"
                        @click="$emit('toggle-mic-mode')"
                    >
                        <Icon
                            name="mdi:microphone"
                            class="w-6 h-6"
                            :class="isSpeaking ? 'text-white' : 'text-[#131318]'"
                        />
                    </button>

                    <!-- Manual mode: Push-to-talk -->
                    <button
                        v-else
                        ref="pttButton"
                        class="rounded-sm p-4 transition-all duration-500 select-none touch-none"
                        :class="
                            isSpeaking
                                ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105'
                                : 'bg-gradient-to-tr from-[#f2c36b] to-[#d4a853] shadow-[0_0_20px_rgba(242,195,107,0.4)]'
                        "
                        :disabled="status === 'connecting'"
                        @pointerdown.prevent="onPttDown"
                        @contextmenu.prevent
                    >
                        <Icon
                            name="mdi:microphone"
                            class="w-6 h-6"
                            :class="isSpeaking ? 'text-white' : 'text-[#131318]'"
                        />
                    </button>

                    <!-- Status label (absolute below center, doesn't affect layout) -->
                    <span
                        class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-label text-[10px] uppercase tracking-[0.2em]"
                        :class="statusLabelClass"
                    >
                        {{ statusLabel }}
                    </span>
                </div>

                <!-- Right: Mode toggle + End session (fixed width so center stays stable) -->
                <div class="flex-1 flex justify-end items-center gap-1">
                    <!-- Mode toggle -->
                    <button
                        v-if="status === 'active'"
                        class="p-3 text-[#e4e1e9]/50 hover:bg-[#39383e] hover:text-[#e4e1e9] rounded-sm transition-all duration-500"
                        :title="micMode === 'auto' ? $t('Switch to push-to-talk') : $t('Switch to auto')"
                        @click="$emit('toggle-mic-mode')"
                    >
                        <Icon
                            :name="micMode === 'auto' ? 'mdi:microphone' : 'mdi:gesture-tap-hold'"
                            class="w-4 h-4"
                        />
                    </button>

                    <!-- End session -->
                    <button
                        class="p-3 text-red-400/60 hover:bg-red-500/10 hover:text-red-300 rounded-sm transition-all duration-500"
                        :disabled="status === 'connecting'"
                        @click="$emit('stop')"
                    >
                        <Icon
                            name="mdi:stop-circle-outline"
                            class="w-5 h-5"
                        />
                    </button>
                </div>
            </div>
        </div>
        <!-- Bottom fade -->
        <div class="h-4 w-full bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-80" />
    </footer>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { SessionStatus, MicMode } from "~/models/session";

const props = defineProps({
    status: {
        type: String as PropType<SessionStatus>,
        required: true,
    },
    micMode: {
        type: String as PropType<MicMode>,
        default: "auto",
    },
    isSpeaking: {
        type: Boolean as PropType<boolean>,
        default: false,
    },
    isAgentSpeaking: {
        type: Boolean as PropType<boolean>,
        default: false,
    },
    canExport: {
        type: Boolean as PropType<boolean>,
        default: false,
    },
});

const emit = defineEmits<{
    "toggle-mic-mode": [];
    "push-start": [];
    "push-end": [];
    interrupt: [];
    stop: [];
    back: [];
    export: [];
}>();

const { t: $t } = useI18n();

const statusLabel = computed(() => {
    if (props.status === "connecting") return $t("Connecting...");
    if (props.isSpeaking) return $t("Listening...");
    if (props.isAgentSpeaking) return $t("Speaking...");
    return $t("Ready");
});

const statusLabelClass = computed(() => {
    if (props.status === "connecting") return "text-[#e4e1e9]/40";
    if (props.isSpeaking) return "text-red-400 animate-pulse";
    if (props.isAgentSpeaking) return "text-[#f2c36b] animate-pulse";
    return "text-[#f2c36b]/60";
});

// ── Push-to-talk: capture pointerup on window so it always fires ──
let pttActive = false;

function onPttDown() {
    if (pttActive) return;
    pttActive = true;
    emit("push-start");
    window.addEventListener("pointerup", onPttUp, { once: true });
    window.addEventListener("pointercancel", onPttUp, { once: true });
}

function onPttUp() {
    if (!pttActive) return;
    pttActive = false;
    emit("push-end");
    window.removeEventListener("pointerup", onPttUp);
    window.removeEventListener("pointercancel", onPttUp);
}

onBeforeUnmount(() => {
    if (pttActive) {
        pttActive = false;
        emit("push-end");
        window.removeEventListener("pointerup", onPttUp);
        window.removeEventListener("pointercancel", onPttUp);
    }
});
</script>
