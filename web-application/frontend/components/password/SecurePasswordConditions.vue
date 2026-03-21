<template>
    <div :class="['flex', 'flex-col', 'items-start', 'gap-2']">
        <SecurePasswordCondition
            v-if="enabledConditions.includes('length')"
            :label="$t('Password should be at least 12 characters long.')"
            :isValid="conditions.isLongEnough"
        />

        <SecurePasswordCondition
            v-if="enabledConditions.includes('combination')"
            :label="$t('Use a mix of uppercase and lowercase letters.')"
            :isValid="conditions.hasMixedCase"
        />

        <SecurePasswordCondition
            v-if="enabledConditions.includes('specialCharacters')"
            :label="$t('Include numbers and special characters for extra security.')"
            :isValid="conditions.hasNumbersAndSpecialChars"
        />

        <SecurePasswordCondition
            v-if="enabledConditions.includes('passwordMatch') && repeatPassword !== undefined"
            :label="$t('Both passwords must match.')"
            :isValid="password === repeatPassword && password !== ''"
        />
    </div>
</template>

<script setup lang="ts">
// Props
const props = defineProps({
    password: {
        type: String as PropType<string>,
        required: true,
    },
    repeatPassword: {
        type: String as PropType<string>,
        required: false,
    },
    enabledConditions: {
        type: Array as PropType<Array<"length" | "combination" | "specialCharacters" | "passwordMatch">>,
        default: () => ["length", "combination", "specialCharacters", "passwordMatch"],
    },
});

// Emits
const emit = defineEmits(["conditions-checked"]);

// Computed states
const conditions = computed(() => evaluateSecurePasswordConditions(props.password));

// Watch & emit condition status
watchEffect(() => {
    const checks: boolean[] = [];

    if (props.enabledConditions.includes("length")) {
        checks.push(conditions.value.isLongEnough);
    }

    if (props.enabledConditions.includes("combination")) {
        checks.push(conditions.value.hasMixedCase);
    }

    if (props.enabledConditions.includes("specialCharacters")) {
        checks.push(conditions.value.hasNumbersAndSpecialChars);
    }

    if (props.enabledConditions.includes("passwordMatch") && props.repeatPassword !== undefined) {
        checks.push(props.password === props.repeatPassword);
    }

    emit("conditions-checked", checks.every(Boolean));
});
</script>
