<template>
    <thead 
        :class="[
            'bg-background-neutral-subtlest',
            'text-text-default',
            'uppercase',
            'text-xs',
            'tracking-wide',
        ]"
    >
        <slot />
    </thead>
</template>