<template>
    <div :class="['w-full', 'flex', 'flex-col', 'gap-6']">
        <div class="flex flex-col gap-2">
            <Avatar
                :size="AvatarSize.XXXL"
                :imgUrl
                :displayName
            />
            <span class="w-full text-lg font-bold">
                {{ trimText(displayName, FieldMaxLength.FULLNAME) }}
            </span>
            <p
                v-if="additionalInfo"
                class="text-sm text-text-neutral-subtle"
            >
                {{ trimText(additionalInfo, 70) }}
            </p>
        </div>

        <p
            v-if="description"
            class="text-sm"
        >
            {{ trimText(description, 150) }}
        </p>

        <div
            v-if="date || email || phone || location || website"
            class="flex flex-col gap-4"
        >
            <ProfileInfoDetail
                v-if="date"
                icon="mdi:calendar-blank"
                :text="trimText(date, 60)"
            />
            <ProfileInfoDetail
                v-if="location"
                icon="mdi:map-marker-outline"
                :text="trimText(location, FieldMaxLength.LOCATION)"
            />
            <ProfileInfoDetail
                v-if="phone"
                icon="mdi:phone-outline"
                :text="trimText(phone, FieldMaxLength.PHONE)"
            />
            <ProfileInfoDetail
                v-if="email"
                icon="mdi:email-outline"
                :text="trimText(email, FieldMaxLength.EMAIL)"
            />
            <ProfileInfoDetail
                v-if="website"
                icon="mdi:link-variant"
                :text="trimText(website, FieldMaxLength.WEBSITE)"
            />
        </div>
    </div>
</template>
<script setup lang="ts">
// Props
defineProps({
    displayName: {
        type: String as PropType<string>,
        default: "John Steward",
    },
    imgUrl: String as PropType<string>,
    additionalInfo: String as PropType<string>,
    description: String as PropType<string>,
    date: String as PropType<string>,
    email: String as PropType<string>,
    phone: String as PropType<string>,
    location: String as PropType<string>,
    website: String as PropType<string>,
});
</script>
