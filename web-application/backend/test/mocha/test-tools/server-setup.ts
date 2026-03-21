// Server setup
// Setups config and a test server

"use strict";

import FS from "fs";
import Path from "path";
import { AsyncSemaphore } from "@asanrom/async-tools";
import { TestLog } from "./log";
import { setupMongoDatabaseIndexes } from "../../../src/utils/mongo-db-indexes";
import { MainWebApplication } from "../../../src/app";
import { Config } from "../../../src/config/config";
import { FileStorageConfig } from "../../../src/config/config-file-storage";
import { DatabaseConfig } from "../../../src/config/config-database";
import { TaskService } from "../../../src/services/task-service";

export interface TestServerState {
    port: number;
}

const SETUP_STATE: {
    sem: AsyncSemaphore,
    ready: boolean,
    state: TestServerState,
} = {
    sem: new AsyncSemaphore(),
    ready: false,
    state: {
        port: 0,
    },
};

export function getServerStatus(): TestServerState {
    return SETUP_STATE.state;
}


/**
 * Setups a test server and return the listening port
 * IMPORTANT: Must call this before any API tests
 */
export async function setupTestServer(): Promise<TestServerState> {
    await SETUP_STATE.sem.acquire();

    if (SETUP_STATE.ready) {
        SETUP_STATE.sem.release();

        return SETUP_STATE.state;
    }

    try {
        await setupAll();
        // Set the status to ready
        SETUP_STATE.ready = true;
    } catch (ex) {
        SETUP_STATE.sem.release();
        throw ex;
    }

    SETUP_STATE.sem.release();

    return SETUP_STATE.state;
}

async function setupAll() {
    // Initial config

    TestLog.info("Initializing test configuration...");

    require("dotenv").config();

    // Clear temp dir

    try {
        FS.mkdirSync(Path.resolve(__dirname, "..", "..", "..", "temp"));
    } catch (ex) { }

    const tempFiles = FS.readdirSync(Path.resolve(__dirname, "..", "..", "..", "temp"));

    for (const tempFile of tempFiles) {
        try {
            FS.unlinkSync(Path.resolve(__dirname, "..", "..", "..", "temp", tempFile));
        } catch (e) { }
    }

    // Override config

    Config.IS_TEST = true;

    process.env.DISABLE_EMAIL_VALIDATION = "YES";
    process.env.REDIS_ENABLED = "NO";
    process.env.MAIL_ENABLED = "NO";
    process.env.LOG_ELASTIC_SEARCH_ENABLED = "NO";
    process.env.FILE_STORAGE_PRIVATE_SECRET = "secret";

    // Load config
    Config.getInstance();

    // Setup database
    TestLog.info("Preparing test database...");

    DatabaseConfig.getInstance();

    await setupMongoDatabaseIndexes({
        dropDB: true,
    });

    // Start test server
    TestLog.info("Starting test HTTP server...");
    const app = new MainWebApplication();
    SETUP_STATE.state.port = await app.startTest();

    Config.getInstance().uriBackend = `http://127.0.0.1:${SETUP_STATE.state.port}`;
    FileStorageConfig.getInstance().staticFilesBaseURL = Config.getInstance().uriBackend + "/static/";

    // Start services
    TestLog.info("Starting rest of services...");

    // Start task service
    TaskService.getInstance().start();
}
