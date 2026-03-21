<template>
    <pre 
        :class="[
            'dark', // Forces the dark theme
            'bg-background-neutral-subtlest',
            'border border-border-neutral-disabled',
            'px-4 p-2 my-4',
            'overflow-x-auto',
            'rounded-md',
            'text-sm font-mono',
        ]"
    > <slot /> </pre>
</template>