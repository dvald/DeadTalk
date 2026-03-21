<template>
    <h1 
        :class="[
            'text-3xl md:text-4xl', 
            'font-semibold',
            'leading-tight',
            'mt-12 first:mt-0',
            'mb-6',
            'text-text-default',
            'scroll-mt-32',
        ]"
    >
        <slot />
    </h1>
</template>
