<template>
    <TableLoading
        :isLoading
        :loadingText="loadingMessages.LOADING"
        :error="errorMessage"
        :title="$t('Oops! An error happened when loading user roles!')"
        :helpText="loadingScreenMessages.HELP_TEXT"
        :retryText="loadingScreenMessages.TRY_AGAIN"
        :retryLimitReachedText="loadingScreenMessages.RETRY_LIMIT_REACHED"
        :cooldownText="loadingScreenMessages.RETRY_COOLDOWN_TEXT"
        @retry="loadRoles"
    />
    <TableWrapper v-if="!isLoading && !errorMessage && paginatedData.length">
        <Table>
            <TableHeader>
                <TableHeaderCell>
                    {{ $t("Role") }}
                </TableHeaderCell>
                <TableHeaderCell>
                    {{ $t("Permissions") }}
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
                    <TableCell
                        fitToContent
                        class="whitespace-nowrap"
                    >
                        <NavLink
                            :text="capitalizeFirstLetter(item?.id) || $t('Default role')"
                            :to="
                                localePath(
                                    `/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}/${item.id === '' ? defaultRoleRouteId : item.id}`,
                                )
                            "
                        />
                    </TableCell>
                    <TableCell>
                        <template v-if="mapPermissions(item.permissions).length">
                            <BadgeStack
                                :items="mapPermissions(item.permissions)"
                                :itemsLimit="4"
                            />
                        </template>
                        <span
                            v-else
                            class="text-sm text-text-neutral-subtle"
                        >
                            {{ $t("No permissions granted") }}
                        </span>
                    </TableCell>
                    <TableCell fitToContent>
                        <DropdownMenu
                            :position="
                                index === paginatedData.length - 1 && roles?.length !== 1
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
                                    :to="localePath(`/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}/${item.id}`)"
                                />
                                <DropdownMenuItem
                                    v-if="item?.id !== 'admin' && item?.id !== ''"
                                    :text="$t('Edit')"
                                    icon="mdi:pencil-outline"
                                    :type="DropdownItemType.ICON"
                                    :to="
                                        localePath(
                                            `/${AppSlug.APP}/${AppSlug.ADMIN_PANEL}/${AppSlug.ROLES}/edit?role=${item.id === '' ? defaultRoleRouteId : item.id}`,
                                        )
                                    "
                                />
                                <DropdownMenuItem
                                    v-if="item?.id !== 'admin' && item?.id !== ''"
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
            :totalItems="roles?.length ?? 0"
            :resultTextMultiplePages
            :resultTextSinglePage
            :resultTextSingleItem
        />
    </TableWrapper>

    <EmptyState
        v-else-if="!isLoading && !paginatedData.length"
        :hasContainer="true"
        :title="$t('No roles available')"
        :description="$t('There are currently no roles to display.')"
        icon="mdi:account-star-outline"
    />

    <DangerModalDialog
        v-if="currentSelectedId !== undefined"
        v-model="showDeleteModal"
        :title="$t('Are you sure you want to delete this role?')"
        :description="$t('Once confirmed, this role will be deleted forever and cannot be undone.')"
        :buttonActionText="$t('Delete role')"
        :isLoading="isDeleting"
        @action="deleteRole(currentSelectedId!)"
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

const isLoading = ref(false);
const isDeleting = ref(false);
const errorMessage = ref<string | null>(null);
const roles = ref<GlobalRole[]>([]);

// Request IDs
const requestId = getUniqueStringId();
const deleteRequestId = getUniqueStringId();

// Toast
const { $toast } = useNuxtApp();

// Translation dependencies
const localePath = useLocalePath();
const { t } = useI18n();
const { loadingMessages, serverResponseErrors, loadingScreenMessages } = useTranslations(t);

// Composables
const { getPermissionName, defaultRoleRouteId } = usePermissions(t);

// Computed
const paginatedData = computed(() => getPaginatedData(roles.value ?? [], currentPage.value, currentItemsPerPage.value));

const paginationTexts = computed(() => usePagination(t, currentPage.value, currentItemsPerPage.value, roles.value?.length ?? 0));
const resultTextMultiplePages = computed(() => paginationTexts.value.resultTextMultiplePages.value);
const resultTextSinglePage = computed(() => paginationTexts.value.resultTextSinglePage.value);
const resultTextSingleItem = computed(() => paginationTexts.value.resultTextSingleItem.value);

const { requireLogin } = useRequireLogin();

// Data loader
const loadRoles = async () => {
    // Abort previous timeouts and requests
    Timeouts.Abort(requestId);
    Request.Abort(requestId);

    // Reset error
    errorMessage.value = null;

    isLoading.value = true;

    Request.Pending(requestId, ApiRolesAdmin.GetRoles())
        .onSuccess((data) => {
            isLoading.value = false;
            roles.value = data.map((role) => {
                return {
                    id: role.id,
                    permissions: role.permissions,
                    dirty: false,
                    editing: false,
                };
            });
        })
        .onRequestError((err, handleErr) => {
            isLoading.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                forbidden: () => {
                    errorMessage.value = serverResponseErrors.value.FORBIDDEN_ACCESS;
                },
                temporalError: () => {
                    errorMessage.value = $t("Roles request exceeded the allowed time limit.");
                },
            });
        })
        .onUnexpectedError((err) => {
            isLoading.value = false;
            errorMessage.value = err?.message || serverResponseErrors.value.UNKNOWN_ERROR;
        });
};

await loadRoles();

// Methods
const mapPermissions = (permissions: { id: string; granted?: boolean }[] = []) => {
    return permissions
        .filter((permission) => permission.granted === true)
        .map((permission) => ({
            text: getPermissionName(permission.id),
        }));
};

const handleShowDeleteModal = (id: string) => {
    if (!id) return;
    showDeleteModal.value = true;
    currentSelectedId.value = id;
};

// Methods
const deleteRole = async (roleId: string) => {
    isDeleting.value = true;

    Request.Pending(deleteRequestId, ApiRolesAdmin.DeleteRole(roleId))
        .onSuccess(async () => {
            isDeleting.value = false;

            $toast.success($t("Role successfully deleted"), {
                toastId: "role-delete-success",
            });

            await loadRoles();

            currentSelectedId.value = undefined;
            showDeleteModal.value = false;

            // Reset to first page
            currentPage.value = 1;
        })
        .onRequestError((err, handleErr) => {
            isDeleting.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                badRequest: () => {
                    $toast.error(serverResponseErrors.value.BAD_REQUEST, {
                        toastId: "bad-request-error",
                    });
                },
                forbidden: () => {
                    $toast.error(serverResponseErrors.value.FORBIDDEN_ACCESS, {
                        toastId: "forbidden-error",
                    });

                    AuthController.CheckAuthStatus();
                },
                serverError: () => {
                    $toast.error(serverResponseErrors.value.INTERNAL_SERVER_ERROR, {
                        toastId: "server-error",
                    });
                },
                networkError: () => {
                    $toast.error(serverResponseErrors.value.NETWORK_ERROR, {
                        toastId: "network-error",
                    });
                },
            });
        })
        .onUnexpectedError((err) => {
            isDeleting.value = false;

            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "unexpected-error",
            });
        });
};

// Abort request handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId);
    Request.Abort(requestId);
    Timeouts.Abort(deleteRequestId);
    Request.Abort(deleteRequestId);
});
</script>
