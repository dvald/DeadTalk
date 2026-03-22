// Websocket controller

"use strict";

import WebSocket from "ws";
import HTTP from "http";
import { AsyncQueue } from "@asanrom/async-tools";
import { Monitor } from "../../monitor";
import { RequestLogger } from "../../utils/request-log";
import { WsOrchestratorService } from "../../services/ws-orchestrator-service";
import { ConversationEngineService } from "../../services/conversation-engine-service";

const WS_QUEUE_SIZE = 20;

/**
 * Websocket controller
 */
export class WebsocketController {
    public request: HTTP.IncomingMessage;
    public socket: WebSocket.WebSocket;
    public interval: any;
    public busy: boolean;
    public closed: boolean;

    public initT: number;
    public lastAliveT: number;

    public queue: AsyncQueue;

    public logger: RequestLogger;

    public eventListeners: { [event: string]: (any) => any };

    public sessionId: string | null;

    constructor(ws: WebSocket.WebSocket, req: HTTP.IncomingMessage) {
        this.closed = false;
        this.request = req;
        this.socket = ws;
        this.logger = new RequestLogger();
        this.busy = false;
        this.interval = null;
        this.queue = new AsyncQueue(WS_QUEUE_SIZE, this.parseMessage.bind(this));
        this.queue.on("error", (error) => {
            Monitor.exception(error);
        });
        this.sessionId = null;
    }

    /* General */

    public async tick() {
        if (Date.now() - this.initT > 24 * 60 * 60 * 1000) {
            Monitor.debug("Too much time connected, killing websocket");
            this.kill();
            return; // Too much time connected
        }

        if (Date.now() - this.lastAliveT > 60 * 1000) {
            Monitor.debug("Socket not alive");
            this.kill();
            return; // Timeout
        }
    }

    public send(message: any) {
        if (this.closed) {
            return;
        }
        this.socket.send(JSON.stringify(message));
    }

    public message(msg: string | Buffer | ArrayBuffer) {
        if (!msg) {
            Monitor.debug("WS message: empty message received");
            return;
        }
        const msgType = msg instanceof Buffer ? "Buffer" : msg instanceof ArrayBuffer ? "ArrayBuffer" : typeof msg;
        const msgLen = typeof msg === "string" ? msg.length : (msg as any).byteLength || (msg as any).length || 0;
        if (msgLen > 100) {
            Monitor.debug("WS message: type=" + msgType + " len=" + msgLen);
        }
        if (msg instanceof Buffer) {
            msg = msg.toString("utf8");
        }
        if (msg === "a") {
            this.lastAliveT = Date.now();
            this.send({ event: "pong" });
            return;
        }
        if (typeof msg === "string") {
            let msgParsed: any;
            try {
                msgParsed = JSON.parse(msg);
            } catch (ex) {
                Monitor.debug("Received invalid message: " + msg);
                return;
            }

            if (msgParsed.type === "a") {
                this.lastAliveT = Date.now();
            } else {
                this.queue.push(msgParsed);
            }
        } else {
            Monitor.debug("Received invalid message: " + JSON.stringify(msg));
            return;
        }
    }

    public async parseMessage(msg) {
    //Monitor.debug("Received message from socket: " + JSON.stringify(msg));

        switch (msg.type) {
            case "promise":
                this.send({ event: "resolved" });
                break;
            case "start-session":
                {
                    if (this.sessionId) {
                        ConversationEngineService.getInstance().endConversation(
                            this.sessionId,
                        );
                        WsOrchestratorService.getInstance().removeSession(this.sessionId);
                    }
                    const sessionType =
            msg.sessionType === "conversation" ? "conversation" : "debate";
                    const sessionId = WsOrchestratorService.getInstance().registerSession(
                        this,
                        sessionType,
                        msg.config || {},
                    );
                    this.sessionId = sessionId;
                    this.send({ event: "session-started", sessionId: sessionId });
                }
                break;
            case "stop-session":
                if (this.sessionId) {
                    ConversationEngineService.getInstance().endConversation(
                        this.sessionId,
                    );
                    WsOrchestratorService.getInstance().emitSessionEnd(
                        this.sessionId,
                        "stopped",
                    );
                    this.sessionId = null;
                }
                break;
            case "start-conversation":
                {
                    if (this.sessionId) {
                        ConversationEngineService.getInstance().endConversation(
                            this.sessionId,
                        );
                        WsOrchestratorService.getInstance().removeSession(this.sessionId);
                    }
                    const personaId = msg.personaId || "";
                    const language = ["en", "es"].includes(msg.language)
                        ? msg.language
                        : "en";
                    const existingHistory = Array.isArray(msg.history) ? msg.history : [];
                    const sessionId = WsOrchestratorService.getInstance().registerSession(
                        this,
                        "conversation",
                        { personaId: personaId },
                    );
                    this.sessionId = sessionId;
                    this.send({ event: "session-started", sessionId: sessionId });
                    // Start conversation asynchronously (don't block WebSocket message processing)
                    ConversationEngineService.getInstance()
                        .startConversation(sessionId, personaId, language, existingHistory)
                        .catch((err) => {
                            Monitor.exception(err, "WebSocket: startConversation failed");
                        });
                }
                break;
            case "audio-chunk":
                Monitor.info("WS: audio-chunk received", { sessionId: this.sessionId, hasChunk: !!msg.chunk, chunkLength: msg.chunk?.length });
                if (this.sessionId && msg.chunk) {
                    ConversationEngineService.getInstance().handleAudioChunk(
                        this.sessionId,
                        msg.chunk,
                    );
                }
                break;
            case "speech-end":
                Monitor.info("WS: speech-end received", { sessionId: this.sessionId });
                if (this.sessionId) {
                    ConversationEngineService.getInstance()
                        .handleSpeechEnd(this.sessionId)
                        .catch((err) => {
                            Monitor.exception(err, "WebSocket: handleSpeechEnd failed");
                        });
                }
                break;
            default:
                Monitor.debug("Unknown message type: " + msg.type);
        }
    }

    /* Open / Close */

    public async close() {
    // Close
        this.closed = true;

        // Cleanup conversation engine and orchestrator sessions
        if (this.sessionId) {
            ConversationEngineService.getInstance().endConversation(this.sessionId);
        }
        WsOrchestratorService.getInstance().removeSessionsByController(this);
        this.sessionId = null;

        // Destroy intervals
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        // Destroy queue
        await this.queue.destroy();
    }

    public kill() {
        this.socket.close();
    }

    public start() {
        this.logger.info(
            "WEBSOCKET " +
        this.request.url +
        " FOR " +
        this.request.socket.remoteAddress,
        );

        this.initT = Date.now();
        this.lastAliveT = Date.now();

        this.socket.on("message", this.message.bind(this));
        this.socket.on("close", this.close.bind(this));

        this.interval = setInterval(this.tick.bind(this), 1000);

        // Send client version
        this.send({ event: "hello" });
    }
}
