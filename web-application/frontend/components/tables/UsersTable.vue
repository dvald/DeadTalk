<template>
    <UsersTableFilter
        v-if="!isLoading && !errorMessage && users && users.length > 0"
        :modelValue="filters"
        :rolesOptions
        @update:modelValue="(newFilters) => Object.assign(filters, newFilters)"
    />
    <TableLoading
        :isLoading
        :loadingText="loadingMessages.LOADING"
        :error="errorMessage"
        :title="$t('Oops! An error happened when loading users!')"
        :helpText="loadingScreenMessages.HELP_TEXT"
        :retryText="loadingScreenMessages.TRY_AGAIN"
        :retryLimitReachedText="loadingScreenMessages.RETRY_LIMIT_REACHED"
        :cooldownText="loadingScreenMessages.RETRY_COOLDOWN_TEXT"
        @retry="loadUsers"
    />
    <TableWrapper v-if="!isLoading && !errorMessage && paginatedData.length">
        <Table>
            <TableHeader>
                <TableHeaderCell>
                    {{ $t("Username") }}
                </TableHeaderCell>
                <TableHeaderCell>
                    {{ $t("Email") }}
                </TableHeaderCell>
                <TableHeaderCell>
                    {{ $t("Verified") }}
                </TableHeaderCell>
                <TableHeaderCell>
                    {{ $t("Role") }}
                </TableHeaderCell>
                <TableHeaderCell>
                    {{ $t("Banned") }}
                </TableHeaderCell>
                <TableHeaderCell>
                    {{ $t("Created at") }}
                </TableHeaderCell>
                <TableHeaderCell>
                    <!-- Actions -->
                </TableHeaderCell>
            </TableHeader>
            <TableBody>
                <TableRow
                    v-for="(item, index) in paginatedData"
                    :key="item.id"
                >
                    <TableCell>
                        <NuxtLink :to="localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${item.id}`)">
                            <User
                                :displayName="item?.username"
                                :size="AvatarSize.SM"
                                :avatarSize="AvatarSize.XS"
                                isInteractive
                                class="text-text-primary-brand-default hover:text-text-primary-brand-hover"
                            />
                        </NuxtLink>
                    </TableCell>
                    <TableCell>
                        {{ item?.email }}
                    </TableCell>
                    <TableCell>
                        <Icon
                            :name="item?.verified ? 'mdi:check-circle-outline' : 'mdi:close-circle-outline'"
                            :iconClass="item?.verified ? '!text-icon-success' : '!text-icon-danger'"
                        />
                    </TableCell>

                    <TableCell class="min-w-[170px]">
                        <Badge
                            :color="item?.role === 'admin' ? ColorAccent.SECONDARY_BRAND : ColorAccent.NEUTRAL"
                            :text="capitalizeFirstLetter(!item?.role && item?.role === '' ? defaultRoleName : item?.role)"
                        />
                    </TableCell>

                    <TableCell>
                        <Icon
                            :name="item?.banned ? 'mdi:check' : 'mdi:close'"
                            :iconClass="item?.banned ? '!text-icon-success' : '!text-icon-danger'"
                        />
                    </TableCell>

                    <TableCell>
                        {{ formatLocalizedDateTime(item?.created!, locale) }}
                    </TableCell>
                    <TableCell fitToContent>
                        <DropdownMenu
                            :position="
                                index === paginatedData.length - 1 && users?.length !== 1
                                    ? DropdownPosition.LEFT_BOTTOM
                                    : DropdownPosition.LEFT_TOP
                            "
                            :positionXOffset="8"
                            class="min-w-[160px]"
                        >
                            <template #activator>
                                <ActionIconButton
                                    :size="ButtonSize.MD"
                                    icon="mdi:dots-vertical"
                                    :styleType="ButtonStyleType.NEUTRAL_TRANSPARENT_SUBTLE"
                                />
                            </template>
                            <template #items>
                                <DropdownMenuItem
                                    :text="$t('View details')"
                                    icon="mdi:eye-outline"
                                    :type="DropdownItemType.ICON"
                                    :to="localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${item.id}`)"
                                />
                                <DropdownMenuItem
                                    :text="$t('Edit')"
                                    icon="mdi:pencil-outline"
                                    :type="DropdownItemType.ICON"
                                    :to="localePath(`/${AppSlug.APP}/${AppSlug.USERS}/${item.id}/account-info`)"
                                />
                                <DropdownMenuItem
                                    v-if="item?.role !== 'admin'"
                                    :text="$t('Delete')"
                                    icon="mdi:delete-forever-outline"
                                    :type="DropdownItemType.DANGER_ICON"
                                    :actionType="DropdownActionType.ACTION"
                                    @click="handleShowDeleteModal(item.id)"
                                />
                            </template>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
        <ButtonPagination
            v-model="currentPage"
            v-model:itemsPerPage="currentItemsPerPage"
            :totalItems="filteredData?.length ?? 0"
            :resultTextMultiplePages
            :resultTextSinglePage
            :resultTextSingleItem
        />
    </TableWrapper>

    <EmptyState
        v-if="isEmpty || isFilteredEmpty"
        :hasContainer="true"
        :title="isFilteredEmpty ? $t('No results found') : $t('No users available')"
        :description="
            isFilteredEmpty ? $t('Try adjusting your filtering settings') : $t('There are currently no users to display.')
        "
        :icon="isFilteredEmpty ? 'mdi:magnify' : 'mdi:account-group-outline'"
    />

    <DangerModalDialog
        v-if="currentSelectedId !== undefined"
        v-model="showDeleteModal"
        :title="$t('Are you sure you want to delete this user?')"
        :description="$t('Once confirmed, this user will be deleted forever and cannot be undone.')"
        :buttonActionText="$t('Delete user')"
        @action="emit('delete', currentSelectedId)"
    />
</template>
<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// States
const currentPage = ref(1);
const currentItemsPerPage = ref(10);
const currentSelectedId = ref<string>();
const showDeleteModal = ref(false);

const users = ref<UserAdminListItem[]>([]);

const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const filters = reactive<UsersTableFilter>({
    searchQuery: "",
    emailVerfiedStatus: "all",
    role: "all",
    banned: "all",
    dateRange: "all",
});

// Request IDs
const requestId = getUniqueStringId();

// Emits
const emit = defineEmits(["delete"]);

// Translation dependencies
const { locale } = useI18n();
const { t } = useI18n();
const localePath = useLocalePath();
const { serverResponseErrors, loadingMessages, loadingScreenMessages } = useTranslations(t);

// Composables
const { defaultRoleName } = usePermissions(t);

// Computed
const isEmpty = computed(() => {
    return !isLoading.value && !errorMessage.value && users.value?.length === 0;
});

const isFilteredEmpty = computed(() => {
    const hasData = (users.value?.length ?? 0) > 0;

    return !isLoading.value && !errorMessage.value && hasData && filteredData.value.length === 0;
});

const filteredData = computed(() => {
    if (!users.value) return [];

    const query = filters.searchQuery.trim().toLowerCase();
    const emailVerified = filters.emailVerfiedStatus;
    const role = filters.role;
    const banned = filters.banned;
    const dateRange = filters.dateRange;

    return users.value
        .filter((user) => !!user.created)
        .filter((user) => {
            // Search filter
            const username = user.username?.toLowerCase() || "";
            const email = user.email?.toLowerCase() || "";
            if (query && !username.includes(query) && !email.includes(query)) return false;

            // Email verified filter
            if (emailVerified !== "all") {
                const verified = String(user?.verified); // convert to string
                if (verified !== emailVerified) return false;
            }

            // Role filter
            if (role !== "all") {
                if (role === "none" && !!user.role) return false;
                if (role !== "none" && convertStringIntoSlugFormat(user.role) !== role) return false;
            }

            // Banned filter
            if (banned !== "all") {
                const isBanned = String(user?.banned);
                if (isBanned !== banned) return false;
            }

            // Date range filter
            if (dateRange !== "all") {
                const created = new Date(user?.created);
                const now = new Date();

                const isInRange = {
                    "past-24h": () => now.getTime() - created.getTime() <= 24 * 60 * 60 * 1000,
                    "past-week": () => now.getTime() - created.getTime() <= 7 * 24 * 60 * 60 * 1000,
                    "past-month": () => now.getTime() - created.getTime() <= 30 * 24 * 60 * 60 * 1000,
                    "past-year": () => now.getTime() - created.getTime() <= 365 * 24 * 60 * 60 * 1000,
                };

                if (!isInRange[dateRange]?.()) return false;
            }

            return true;
        })
        .sort((a, b) => {
            return new Date(b.created!).getTime() - new Date(a.created!).getTime();
        });
});

const paginatedData = computed(() => getPaginatedData(filteredData.value, currentPage.value, currentItemsPerPage.value));

const paginationTexts = computed(() => usePagination(t, currentPage.value, currentItemsPerPage.value, users.value?.length ?? 0));
const resultTextMultiplePages = computed(() => paginationTexts.value.resultTextMultiplePages.value);
const resultTextSinglePage = computed(() => paginationTexts.value.resultTextSinglePage.value);
const resultTextSingleItem = computed(() => paginationTexts.value.resultTextSingleItem.value);

const rolesOptions = computed<SelectOption[]>(() => {
    const rolesSet = new Set(users.value?.map((u) => u.role).filter((r) => !!r && r !== ""));

    const options: SelectOption[] = [
        {
            text: $t("All roles"),
            value: "all",
        },
        {
            text: defaultRoleName.value,
            value: "none",
        },
    ];

    options.push(
        ...Array.from(rolesSet).map((role) => ({
            text: capitalizeFirstLetter(role),
            value: convertStringIntoSlugFormat(role),
        })),
    );

    return options;
});

const { requireLogin } = useRequireLogin();

// Data loader
const loadUsers = async () => {
    // Abort previous timeouts and requests
    Timeouts.Abort(requestId);
    Request.Abort(requestId);

    // Reset error
    errorMessage.value = null;

    isLoading.value = true;

    Request.Pending(
        requestId,
        ApiUsersAdmin.GetUsers({
            page: currentPage.value,
            /* q: params.query,
            role: params.role,
            pageSize: params.pageSize, */
        }),
    )
        .onSuccess((list) => {
            isLoading.value = false;
            users.value = list.users;
        })
        .onRequestError((err, handleErr) => {
            isLoading.value = false;
            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                forbidden: () => {
                    errorMessage.value = $t("You lack the required permission to access this resource");
                },
                temporalError: () => {
                    errorMessage.value = $t("Users request exceeded the allowed time limit.");
                },
                serverError: () => {
                    errorMessage.value = serverResponseErrors.value.INTERNAL_SERVER_ERROR;
                },
                networkError: () => {
                    errorMessage.value = serverResponseErrors.value.NETWORK_ERROR;
                },
            });
        })
        .onUnexpectedError((err) => {
            isLoading.value = false;
            errorMessage.value = err?.message || serverResponseErrors.value.UNKNOWN_ERROR;
        });
};

await loadUsers();

// Methods
const handleShowDeleteModal = (id: string) => {
    if (!id) return;
    showDeleteModal.value = true;
    currentSelectedId.value = id;
};

// Abort request handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
});
</script>
