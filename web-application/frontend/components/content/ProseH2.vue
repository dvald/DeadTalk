<template>
    <h2 
        :class="[
            'text-2xl md:text-3xl',
            'font-semibold',
            'leading-snug',
            'mt-10 first:mt-0',
            'mb-4',
            'text-text-default',
            'scroll-mt-20',
        ]"
    >
        <slot />
    </h2>
</template>
