<template>
    <ul
        :class="[
            'list-disc',
            'pl-6',
            'space-y-2',
            'marker:text-icon-secondary-brand-default',
        ]"
    >
        <slot />
    </ul>
</template>