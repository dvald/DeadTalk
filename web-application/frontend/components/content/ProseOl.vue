<template>
    <ol
        :class="[
            'list-decimal',
            'pl-6',
            'space-y-2',
            'marker:text-icon-secondary-brand-default',
        ]"
    >
        <slot />
    </ol>
</template>