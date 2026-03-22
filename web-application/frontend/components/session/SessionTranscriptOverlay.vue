<template>
    <div class="fixed bottom-32 left-0 right-0 z-40 flex justify-center pointer-events-none px-6">
        <Transition
            enter-active-class="transition-opacity duration-500"
            leave-active-class="transition-opacity duration-500"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
        >
            <p
                v-if="displayText"
                :key="displayText"
                class="max-w-sm text-center text-sm leading-relaxed"
                :class="isAgent ? 'heading-font italic text-[#e4e1e9]/80' : 'font-body text-[#e4e1e9]/50'"
            >
                {{ displayText }}
            </p>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

const props = defineProps({
    userTranscript: {
        type: String as PropType<string>,
        default: "",
    },
    agentTranscript: {
        type: String as PropType<string>,
        default: "",
    },
    personaName: {
        type: String as PropType<string>,
        default: "",
    },
});

const isAgent = computed(() => !!props.agentTranscript);

const displayText = computed(() => {
    if (props.agentTranscript) {
        return props.agentTranscript;
    }
    if (props.userTranscript) {
        return props.userTranscript;
    }
    return "";
});
</script>
