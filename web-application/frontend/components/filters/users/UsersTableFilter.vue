<template>
    <div :class="['w-full', 'flex', 'hidden md:flex md:flex-row', 'gap-4']">
        <UsersTableFilterItems
            :modelValue
            :rolesOptions
            :verifiedStatusOptions
            :bannedStatusOptions
            :dateRangeOptions
            @update:modelValue="emit('update:modelValue', $event)"
        />

        <ActionIconButton
            v-if="hasModifiedFilters"
            :styleType="ButtonStyleType.DELETE_SOFT"
            icon="mdi:restore"
            @click="restoreFilters"
        />
    </div>
    <Collapsible
        :title="$t('Filters')"
        class="flex-col md:hidden !gap-4 !py-0"
    >
        <!-- Safe area padding for focus state inputs -->
        <div class="p-1">
            <UsersTableFilterItems
                :modelValue
                :rolesOptions
                :verifiedStatusOptions
                :bannedStatusOptions
                :dateRangeOptions
                @update:modelValue="emit('update:modelValue', $event)"
            />

            <ActionButton
                v-if="hasModifiedFilters"
                :styleType="ButtonStyleType.DELETE_SOFT"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:restore"
                :text="$t('Restore filters')"
                isMobileFullWidth
                class="mt-4"
                @click="restoreFilters"
            />
        </div>
    </Collapsible>
</template>

<script setup lang="ts">
// Props
const props = defineProps({
    modelValue: {
        type: Object as PropType<UsersTableFilter>,
        required: true,
    },
    rolesOptions: {
        type: Array as PropType<SelectOption[]>,
        required: true,
    },
});

// emits
const emit = defineEmits(["update:modelValue"]);

// Default filters definition - Used for reset
const defaultFilters: UsersTableFilter = {
    searchQuery: "",
    emailVerfiedStatus: "all",
    role: "all",
    banned: "all",
    dateRange: "all",
};

// Data
const verifiedStatusOptions: SelectOption[] = [
    {
        text: $t("All verified status"),
        value: "all",
    },
    {
        text: $t("Only verified"),
        value: "true",
    },
    {
        text: $t("Not verified"),
        value: "false",
    },
];

const bannedStatusOptions: SelectOption[] = [
    {
        text: $t("All banned status"),
        value: "all",
    },
    {
        text: $t("Not banned"),
        value: "false",
    },
    {
        text: $t("Banned"),
        value: "true",
    },
];

const dateRangeOptions: SelectOption[] = [
    {
        text: $t("All dates"),
        value: "all",
    },
    {
        text: $t("Past year"),
        value: "past-year",
    },
    {
        text: $t("Past month"),
        value: "past-month",
    },
    {
        text: $t("Past week"),
        value: "past-week",
    },
    {
        text: $t("Past 24 hours"),
        value: "past-24h",
    },
];

// Computed
const hasModifiedFilters = computed(() => {
    return Object.entries(defaultFilters).some(([key, value]) => {
        return props.modelValue[key as keyof UsersTableFilter] !== value;
    });
});

// Methods
const restoreFilters = () => {
    emit("update:modelValue", {
        ...defaultFilters,
    });
};
</script>
