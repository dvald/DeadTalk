<template>
    <table 
        :class="[
            'content-table',
            'w-full',
            'border-collapse',
            'text-left',
            'text-sm',
        ]"
    >
        <slot />
    </table>
</template>