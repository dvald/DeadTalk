export const useTranslations = ($t: (t: string) => string) => {
    // COMMON TRANSLATIONS
    const formSubmitErrors = computed(() => ({
        REQUIRED_FIELDS: $t("Please fill all required fields"),
        PASSWORD_MISMATCH: $t("Passwords do not match"),
        INSECURE_PASSWORD: $t("Password is insecure. Please fulfill all conditions."),
    }));

    const formFieldValidationErrors = computed(() => ({
        REQUIRED_FIELD: $t("This field is required."),
        REQUIRED_OPTION: $t("Please select an option."),
        INVALID_EMAIL: $t("Invalid email address."),
        INVALID_URL: $t("Invalid URL."),
        INVALID_DATE_RANGE: $t("Start date must be before or equal to end date"),
        PASSWORDS_MISMATCH: $t("Passwords do not match."),
    }));

    const loadingMessages = computed(() => ({
        LOADING: $t("Loading"),
        SUBMITTING: $t("Submitting"),
        PROCESSING: $t("Processing"),
        CREATING: $t("Saving"),
        SAVING_CHANGES: $t("Saving changes"),
        DELETING: $t("Deleting"),
    }));

    const loadingScreenMessages = computed(() => ({
        HELP_TEXT: $t("Please try again later or contact support"),
        TRY_AGAIN: $t("Try again"),
        RETRY_LIMIT_REACHED: $t("Retry limit reached. Please refresh the page or contact support."),
        RETRY_COOLDOWN_TEXT: $t("Retry in"),
    }));

    const formSubmitMessages = computed(() => ({
        CHANGES_SAVED: $t("Changes saved"),
    }));

    const serverResponseErrors = computed(() => ({
        INTERNAL_SERVER_ERROR: $t("Internal server error"),
        NETWORK_ERROR: $t("Could not connect to the server"),
        UNKNOWN_ERROR: $t("An unknown error occurred"),
        BAD_REQUEST: $t("Invalid request"),
        FORBIDDEN_ACCESS: $t("Access denied. You lack the required permission to visit this page."),
        FORBIDDEN_ACTION: $t("Action denied. You lack the required permission to perform this action."),
        INCORRECT_PASSWORD: $t("Incorrect password"),
        CAPTCHA_FAILED: $t("Please, prove you are not a robot by solving the captcha."),
        INVALID_SINGLE_USE_CODE: $t("Invalid single use code"),
        INVALID_CREDENTIALS: $t("The credentials you entered are not correct."),
    }));

    const appNotifications = computed(() => ({
        SECURE_PASSWORD_COPIED_TO_CLIPBOARD: $t("Secure password generated. Copied to clipboard"),
        COPIED_TO_CLIPBOARD: $t("Copied to clipboard"),
        COPY_TO_CLIPBOARD_ERROR: $t("Failed to copy to clipboard"),
    }));

    return {
        formSubmitErrors,
        loadingMessages,
        formSubmitMessages,
        serverResponseErrors,
        formFieldValidationErrors,
        appNotifications,
        loadingScreenMessages,
    };
};
