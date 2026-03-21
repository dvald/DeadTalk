<template>
    <div :class="['w-full', 'flex', 'flex-col', 'gap-4', 'items-center']">
        <div class="w-full">
            <SearchField
                id="search"
                :modelValue="modelValue.searchQuery"
                :maxLength="FieldMaxLength.SEARCH"
                :placeholder="$t('Search by id, username or email')"
                @update:modelValue="updateField('searchQuery', $event)"
            />
        </div>
        <div :class="['w-full', 'flex', 'flex-col md:flex-row', 'gap-4', 'items-center']">
            <SelectField
                id="email-verified-status"
                :modelValue="modelValue.emailVerfiedStatus"
                :options="verifiedStatusOptions"
                class="w-full lg:min-w-[200px]"
                @update:modelValue="updateField('emailVerfiedStatus', $event)"
            />

            <SelectField
                id="role"
                :modelValue="modelValue.role"
                :options="rolesOptions"
                class="w-full lg:min-w-[200px]"
                @update:modelValue="updateField('role', $event)"
            />

            <SelectField
                id="banned-status"
                :modelValue="modelValue.banned"
                :options="bannedStatusOptions"
                class="w-full lg:min-w-[200px]"
                @update:modelValue="updateField('banned', $event)"
            />

            <SelectField
                id="date-range"
                :modelValue="modelValue.dateRange"
                :options="dateRangeOptions"
                class="w-full lg:min-w-[200px]"
                @update:modelValue="updateField('dateRange', $event)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    modelValue: {
        type: Object as PropType<UsersTableFilter>,
        required: true,
    },
    rolesOptions: {
        type: Array as PropType<SelectOption[]>,
        required: true,
    },
    verifiedStatusOptions: {
        type: Array as PropType<SelectOption[]>,
        required: true,
    },
    bannedStatusOptions: {
        type: Array as PropType<SelectOption[]>,
        required: true,
    },
    dateRangeOptions: {
        type: Array as PropType<SelectOption[]>,
        required: true,
    },
});

const emit = defineEmits(["update:modelValue"]);

const updateField = (key: keyof UsersTableFilter, value: any) => {
    emit("update:modelValue", {
        ...props.modelValue,
        [key]: value,
    });
};
</script>
