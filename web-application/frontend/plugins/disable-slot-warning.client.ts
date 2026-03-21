export default defineNuxtPlugin(() => {
    // Supresses the "Slot invoked outside of the render function"

    const originalWarnHandler = console.warn;

    console.warn = (...args: any[]) => {
        if (typeof args[0] === "string" && args[0].includes('Slot "default" invoked outside of the render function')) {
            return; // suppress this one specific warning
        }

        // Forward all other warnings
        originalWarnHandler(...args);
    };
});
