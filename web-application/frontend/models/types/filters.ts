export interface UsersTableFilter {
    searchQuery: string;
    emailVerfiedStatus: string;
    role: string;
    banned: string;
    dateRange: "all" | "past-24h" | "past-week" | "past-month" | "past-year";
}
