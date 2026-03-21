<template>
    <Form @submit="submit">
        <FormRow>
            <InputField
                id="name"
                v-model="formData.name"
                v-model:error="formErrors.name"
                :validator="validateField"
                :label="$t('Name')"
                :placeholder="$t('Ex.: John Steward')"
                :maxLength="FieldMaxLength.WALLET_NAME"
                required
            />
        </FormRow>
        <FormRow>
            <FileUploadField
                id="featured-image"
                :key="fileUploadResetKey"
                v-model="avatarImageFile"
                :accept="['image/png', 'image/jpeg']"
                :maxFileSize="20"
                :label="$t('Avatar')"
                :title="$t('Upload a file or drag and drop')"
                :upToText="$t('up to')"
                :buttonText="$t('Upload new file')"
                :showPreview="hasAvatarImage"
                :previewImageUrl="formData.image ?? ''"
                :isRemovingPreviewFile="isDeletingImage"
                :removePreviewFileButtonText="$t('Remove')"
                :removingStateText="$t('Deleting')"
                @removePreviewFile="deleteUserAvatar"
            />
        </FormRow>
        <FormRow v-if="hasAvatarImage">
            <ActionButton
                :styleType="ButtonStyleType.DELETE_FILLED"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:delete-forever-outline"
                :text="$t('Delete image')"
                :isLoading
                isMobileFullWidth
                @click="deleteUserAvatar"
            />
        </FormRow>
        <FormRow>
            <TextareaField
                id="description"
                v-model="formData.bio"
                :label="$t('Description')"
                :placeholder="$t('Tell us a bit about yourself. Ex.: Passionate about tech, design, and coffee.')"
                :maxLength="FieldMaxLength.SHORT_DESCRIPTION"
            />
        </FormRow>
        <FormRow>
            <InputField
                id="location"
                v-model="formData.location"
                :validator="validateField"
                :label="$t('Location')"
                :placeholder="$t('Ex.: New York, NY')"
                :maxLength="FieldMaxLength.LOCATION"
            />
            <InputField
                id="website"
                v-model="formData.website"
                :validator="validateUrl"
                :label="$t('Website')"
                :placeholder="$t('Ex.: http://www.example.com')"
                :maxLength="FieldMaxLength.WEBSITE"
                :helpText="$t('Use a valid protocol in the URL (e.g., http, https).')"
            />
        </FormRow>
        <FormActions>
            <ActionButton
                :text="$t('Save changes')"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:content-save-outline"
                type="submit"
                isMobileFullWidth
                :isLoading
                :loadingText="dynamicSavingText"
            />
        </FormActions>
    </Form>
</template>
<script setup lang="ts">
// Imports
import { Request } from "@asanrom/request-browser";

// Props
const props = defineProps({
    data: {
        type: Object as PropType<UserProfile>,
        required: true,
    },
});

// States
const formData = reactive<UserProfile>({
    name: props.data.name,
    image: props.data.image,
    bio: props.data.bio,
    location: props.data.location,
    website: props.data.website,
});
const avatarImageFile = ref<File[]>([]);
const isLoading = ref(false);
const isUploadingImage = ref(false);
const isDeletingImage = ref(false);
const uploadImageProgress = ref(0);
const fileUploadResetKey = ref(0); // Used to reset the FileUpload Field Dropzone

const userProfile = ref<UserProfile | null>(null);
const errorMessage = ref<string | null>(null);

// Request IDs
const requestId = getUniqueStringId();
const saveRequestId = getUniqueStringId();
const imageRequestId = getUniqueStringId();

const { requireLogin } = useRequireLogin();
const { listenOnAppEvent } = useGlobalEvents();

const load = async () => {
    // Abort previous timeouts and requests
    Timeouts.Abort(requestId);
    Request.Abort(requestId);

    // Reset error
    errorMessage.value = null;

    isLoading.value = true;

    if (!AuthController.isAuthenticated()) {
        requireLogin();
        return;
    }

    Request.Pending(requestId, ApiProfile.GetProfile(AuthController.UID))
        .onSuccess((profile) => {
            isLoading.value = false;
            userProfile.value = profile;
        })
        .onRequestError((err, handleErr) => {
            isLoading.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                notFound: () => {
                    errorMessage.value = $t("User not found");
                },
                temporalError: () => {
                    errorMessage.value = $t("User profile request exceeded the allowed time limit.");
                },
            });
        })
        .onUnexpectedError((err) => {
            isLoading.value = false;

            errorMessage.value = err?.message || serverResponseErrors.value.UNKNOWN_ERROR;
        });
};

// Data
await load();

// Validators
const { formErrors, validateFormFields } = useForm({
    formData,
    requiredFields: ["name"],
    validators: {
        name: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
    },
});

// Computed
const hasAvatarImage = computed(() => {
    const image = props.data?.image;
    return typeof image === "string" && image.trim() !== "";
});

const dynamicSavingText = computed(() => {
    if (isUploadingImage.value) {
        const progress = uploadImageProgress.value;
        return progress > 0 ? `${$t("Uploading image...")} (${progress}%)` : $t("Uploading image...");
    }

    return loadingMessages.value.SAVING_CHANGES;
});

// Toast
const { $toast } = useNuxtApp();

// Translation dependencies
const { t } = useI18n();
const { formSubmitErrors, serverResponseErrors, formSubmitMessages, loadingMessages, formFieldValidationErrors } = useTranslations(t);

// Methods
const submit = async () => {
    const isValid = validateFormFields();

    if (!isValid) {
        $toast.error(formSubmitErrors.value.REQUIRED_FIELDS, {
            toastId: "required-fields-error",
        });

        return;
    }

    try {
        isLoading.value = true;

        // 1. Upload avatar image (only if a file exists)
        if (avatarImageFile.value.length > 0) {
            const fileWrapper = avatarImageFile.value?.[0];

            if (!fileWrapper || !("file" in fileWrapper)) {
                isUploadingImage.value = false;
                throw new Error($t("Invalid file structure"));
            }

            const file = fileWrapper.file as File;

            isUploadingImage.value = true;

            const url = await uploadUserAvatar(saveRequestId, file, (progress) => {
                uploadImageProgress.value = progress;
            });

            isUploadingImage.value = false;

            formData.image = url;

            // Update the profile image in the auth store
            userProfile.value = {
                ...userProfile.value,
                image: formData.image,
            };

            // Clear file and reset
            avatarImageFile.value = [];
            fileUploadResetKey.value++;
        }

        // 2. Update profile info
        await updateProfileInfo(imageRequestId, {
            name: formData.name!,
            bio: formData.bio ?? "",
            location: formData.location ?? "",
            website: formData.website ?? "",
        });

        // Update profile with updated info
        userProfile.value = {
            ...userProfile.value,
            name: formData.name,
            bio: formData.bio,
            location: formData.location,
            website: formData.website,
        };

        $toast.success(formSubmitMessages.value.CHANGES_SAVED, {
            toastId: "changes-saved",
        });
    } catch (error: any) {
        $toast.error(error.message, {
            toastId: "update-profile-info-error",
        });
    } finally {
        isLoading.value = false;
        isUploadingImage.value = false;
    }
};

const updateProfileInfo = (
    saveRequestId: string,
    formData: {
        name: string;
        bio: string;
        location: string;
        website: string;
    },
): Promise<void> => {
    return new Promise((resolve, reject) => {
        Request.Pending(
            saveRequestId,
            ApiProfile.UpdateProfile({
                name: formData.name,
                bio: formData.bio,
                location: formData.location,
                website: formData.website,
            }),
        )
            .onSuccess(() => {
                AuthController.CheckAuthStatus();
                resolve();
            })
            .onRequestError((err, handleErr) => {
                handleErr(err, {
                    unauthorized: () => {
                        requireLogin();
                    },
                    badRequestInvalidName: () => {
                        reject(new Error($t("Invalid profile name")));
                    },
                    badRequestInvalidBio: () => {
                        reject(new Error($t("Invalid profile description")));
                    },
                    badRequestInvalidLocation: () => {
                        reject(new Error($t("Invalid location")));
                    },
                    badRequestInvalidWebsite: () => {
                        reject(new Error($t("Invalid website. Must be a valid URL.")));
                    },
                    badRequest: () => {
                        reject(new Error(serverResponseErrors.value.BAD_REQUEST));
                    },
                    serverError: () => {
                        reject(new Error(serverResponseErrors.value.INTERNAL_SERVER_ERROR));
                    },
                    networkError: () => {
                        reject(new Error(serverResponseErrors.value.NETWORK_ERROR));
                    },
                });
            })
            .onUnexpectedError((err) => {
                reject(new Error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR));
            });
    });
};

const uploadUserAvatar = (imageRequestId: string, file: File, onProgress?: (percent: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
        Request.Pending(imageRequestId, ApiProfile.UpdateImage({ image: file }))
            .onSuccess((res) => {
                AuthController.CheckAuthStatus();
                resolve(res?.url || "");
            })
            .onUploadProgress((loaded, total) => {
                if (onProgress) {
                    const percent = Math.round((loaded * 100) / total);
                    onProgress(percent);
                }
            })
            .onRequestError((err, handleErr) => {
                handleErr(err, {
                    unauthorized: () => {
                        requireLogin();
                    },
                    badRequest: () => {
                        reject(new Error($t("Invalid image provided")));
                    },
                    serverError: () => {
                        reject(new Error(serverResponseErrors.value.INTERNAL_SERVER_ERROR));
                    },
                    networkError: () => {
                        reject(new Error(serverResponseErrors.value.NETWORK_ERROR));
                    },
                });
            })
            .onUnexpectedError((err) => {
                reject(new Error(err?.message || $t("An unknown error occurred")));
            });
    });
};

const deleteUserAvatar = async () => {
    isDeletingImage.value = true;

    Request.Pending(imageRequestId, ApiProfile.DeleteImage())
        .onSuccess(() => {
            isDeletingImage.value = false;
            AuthController.CheckAuthStatus();

            avatarImageFile.value = [];

            userProfile.value = {
                ...userProfile.value,
                image: "",
            };

            $toast.success($t("Avatar removed successfully"), {
                toastId: "avatar-deleted",
            });
        })
        .onRequestError((err, handleErr) => {
            isDeletingImage.value = false;

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                serverError: () => {
                    $toast.error(serverResponseErrors.value.INTERNAL_SERVER_ERROR, {
                        toastId: "enable-server-error",
                    });
                },
                networkError: () => {
                    $toast.error(serverResponseErrors.value.NETWORK_ERROR, {
                        toastId: "enable-network-error",
                    });
                },
            });
        })
        .onUnexpectedError((err) => {
            isDeletingImage.value = false;

            $toast.error(err?.message || serverResponseErrors.value.UNKNOWN_ERROR, {
                toastId: "unexpected-error",
            });
        });
};

const onAuthChanged = () => {
    load();
};

onMounted(() => {
    listenOnAppEvent("auth-status-changed", onAuthChanged);
});

// Abort request handling
onBeforeUnmount(() => {
    Request.Abort(requestId);
    Request.Abort(saveRequestId);
    Request.Abort(imageRequestId);
});
</script>
