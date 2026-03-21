// Reserved for license

"use strict";

import { readFileSync } from "fs";

/**
 * Mailer configuration.
 */
export class MailerConfig {

    /**
     * Gets the configuration instance.
     */
    public static getInstance(): MailerConfig {
        if (MailerConfig.instance) {
            return MailerConfig.instance;
        }

        const config: MailerConfig = new MailerConfig();

        config.enabled = process.env.MAIL_ENABLED !== "NO";

        config.host = process.env.SMTP_HOST || "";
        config.port = parseInt(process.env.SMTP_PORT || "587", 10) || 587;

        config.secure = process.env.SMTP_SECURE === "YES";

        config.from = process.env.SMTP_FROM || "";

        config.user = process.env.SMTP_AUTH_USER || "";
        config.password = process.env.SMTP_AUTH_PASSWORD || "";

        config.tlsRejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "NO";

        config.dkimEnabled = process.env.SMTP_DKIM_ENABLED === "YES";
        config.dkimDomainName = process.env.SMTP_DKIM_DOMAIN || "";
        config.dkimKeySelector = process.env.SMTP_DKIM_KEY_SELECTOR || "";
        config.dkimPrivateKey = config.dkimEnabled ? readFileSync(process.env.SMTP_DKIM_PRIVATE_KEY || "./dkim-private-key.pem", "utf-8") : null;

        MailerConfig.instance = config;

        return config;
    }
    private static instance: MailerConfig = null;

    public enabled: boolean;

    public host: string;
    public port: number;

    public secure: boolean;

    public from: string;

    public user: string;
    public password: string;

    public tlsRejectUnauthorized: boolean;

    public dkimEnabled: boolean;
    public dkimDomainName: string;
    public dkimKeySelector: string;
    public dkimPrivateKey: string;
}
