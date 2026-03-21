<template>
    <TableWrapper v-if="data.length">
        <Table>
            <TableHeader>
                <TableHeaderCell>
                    {{ $t("Date") }}
                </TableHeaderCell>
                <TableHeaderCell>
                    {{ $t("IP Address") }}
                </TableHeaderCell>
                <TableHeaderCell>
                    {{ $t("Operative system") }}
                </TableHeaderCell>
                <TableHeaderCell>
                    {{ $t("Browser") }}
                </TableHeaderCell>
                <TableHeaderCell v-if="isCurrentUser">
                    <!-- Actions -->
                </TableHeaderCell>
            </TableHeader>
            <TableBody>
                <TableRow
                    v-for="item in paginatedData"
                    :key="item.session"
                >
                    <TableCell :class="[item.current && 'font-bold']">
                        {{ formatLocalizedDateTime(item.created!, locale) }}
                    </TableCell>
                    <TableCell :class="[item.current && 'font-bold']">
                        {{ item.remote }}
                        <span v-if="item.current"> ({{ $t("current") }}) </span>
                    </TableCell>
                    <TableCell :class="[item.current && 'font-bold']">
                        {{ item.os }}
                    </TableCell>
                    <TableCell :class="[item.current && 'font-bold']">
                        {{ item.browser }}
                    </TableCell>
                    <TableCell
                        v-if="isCurrentUser"
                        fitToContent
                    >
                        <ActionIconButton
                            :size="ButtonSize.MD"
                            icon="mdi:close"
                            :styleType="ButtonStyleType.DELETE_SOFT"
                            @click="handleShowModal(item.session, item?.current ?? false)"
                        />
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
        <ButtonPagination
            v-model="currentPage"
            v-model:itemsPerPage="currentItemsPerPage"
            :totalItems="data?.length ?? 0"
            :resultTextMultiplePages
            :resultTextSinglePage
            :resultTextSingleItem
        />
    </TableWrapper>

    <EmptyState
        v-else
        :hasContainer="true"
        :title="$t('No sessions available')"
        :description="$t('There are currently no user active sessions to display.')"
        icon="mdi:format-list-bulleted"
    />

    <DangerModalDialog
        v-if="currentSelectedId !== undefined"
        v-model="showCloseSessionModal"
        :title="$t('Are you sure you want to close this session?')"
        :description="$t('Once confirmed, your destination session will be closed and you will need to log in again.')"
        :buttonActionText="$t('Close session')"
        buttonActionIcon="mdi:close"
        @action="emit('closeSession', currentSelectedId, isCurrentSession)"
    />
</template>
<script setup lang="ts">
// Props
const props = defineProps({
    data: {
        type: Array as PropType<SessionListItem[]>,
        required: true,
    },
    isCurrentUser: {
        type: Boolean as PropType<boolean>,
        default: false,
    },
});

// States
const currentPage = ref(1);
const currentItemsPerPage = ref(10);
const currentSelectedId = ref<string>();
const isCurrentSession = ref(false);
const showCloseSessionModal = ref(false);

// Emits
const emit = defineEmits(["closeSession"]);

// Translation dependencies
const { locale } = useI18n();

// Computed
const sortedSessions = computed(() => {
    return [...(props.data || [])].sort((a, b) => {
        const dateA = a.created ? new Date(a.created).getTime() : 0;
        const dateB = b.created ? new Date(b.created).getTime() : 0;
        return dateB - dateA;
    });
});

const paginatedData = computed(() => getPaginatedData(sortedSessions.value, currentPage.value, currentItemsPerPage.value));

const { t } = useI18n();

const paginationTexts = computed(() => usePagination(t, currentPage.value, currentItemsPerPage.value, props.data?.length ?? 0));
const resultTextMultiplePages = computed(() => paginationTexts.value.resultTextMultiplePages.value);
const resultTextSinglePage = computed(() => paginationTexts.value.resultTextSinglePage.value);
const resultTextSingleItem = computed(() => paginationTexts.value.resultTextSingleItem.value);

// Methods
const handleShowModal = (id: string, isCurrent: boolean) => {
    if (!id) return;
    showCloseSessionModal.value = true;
    currentSelectedId.value = id;
    isCurrentSession.value = isCurrent;
};
</script>
