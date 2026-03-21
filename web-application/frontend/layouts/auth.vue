<template>
    <div
        :style="{ backgroundImage: `url(${sampleBg})` }"
        :class="[
            'bg-cover',
            'bg-center',
            'bg-no-repeat',
            'min-h-screen',
            'flex',
            'items-start',
            'lg:items-center',
            'justify-center',
            'overflow-auto',
            'py-10',
            'px-content-side-padding-mobile md:px-content-side-padding',
        ]"
    >
        <div :class="['w-full', 'flex flex-col', 'items-center', 'gap-8 lg:gap-14']">
            <AppLogo
                :src="sampleLogo"
                logoClass="text-white max-w-[92px] md:max-w-[152px]"
            />
            <slot />
        </div>
    </div>
</template>

<script setup>
// Imports
import sampleBg from "@/assets/images/backgrounds/auth-bg.jpg";
import sampleLogo from "@/public/images/logo/air-ui-logo-white.svg?raw";
</script>
