<template>
    <img 
        :class="[
            'rounded-lg',
            'shadow-md',
            'my-6',
        ]" 
        v-bind="$attrs" 
        :alt="($attrs.alt as string) || ''"
    >
</template>