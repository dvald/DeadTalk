export const usePagination = (
    $t: (t: string) => string,
    currentPage: number,
    itemsPerPage: number,
    totalItems: number,
    options?: {
        resultWord?: string;
        resultsWord?: string;
    },
) => {
    // Page calculations
    const from = computed(() => (currentPage - 1) * itemsPerPage + 1);
    const to = computed(() => Math.min(from.value + itemsPerPage - 1, totalItems));

    // Result texts
    const resultTextMultiplePages = computed(() => {
        // Words
        const showing = $t("Showing");
        const toWord = $t("to");
        const ofWord = $t("of");
        const results = options?.resultsWord ?? $t("results");

        return `${showing} ${from.value} ${toWord} ${to.value} ${ofWord} ${totalItems} ${results}`;
    });

    const resultTextSinglePage = computed(() => {
        // Words
        const showing = $t("Showing");
        const results = options?.resultsWord ?? $t("results");

        return `${showing} ${totalItems} ${results}`;
    });

    const resultTextSingleItem = computed(() => {
        // Words
        const showing = $t("Showing");
        const result = options?.resultWord ?? $t("result");

        return `${showing} ${totalItems} ${result}`;
    });

    return {
        resultTextMultiplePages,
        resultTextSinglePage,
        resultTextSingleItem,
    };
};
