<template>
    <a 
        :class="[
            'text-text-primary-brand-default',
            'hover:text-text-primary-brand-hover',
            'font-medium',
        ]" 
        v-bind="$attrs"
    >
        <slot />
    </a>
</template>