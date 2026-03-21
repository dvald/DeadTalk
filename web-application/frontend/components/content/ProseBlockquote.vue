<template>
    <blockquote 
        :class="[
            'border-l-4 border-border-default',
            'pl-4 italic text-neutral-600',
        ]"
    >
        <slot />
    </blockquote>
</template>