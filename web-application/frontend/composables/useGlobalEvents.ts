// Composable to listen for global events

"use strict";

type CallbackFunctionVariadic = (...args: any[]) => void;

/**
 * Returns 3 functions in order to listen to global events:
 *  - listenOnAppEvent - Listens on a global app event (AppEvents)
 *  - listenOnDocumentEvent - Listens on a global document event
 *  - emitAppEvent - Emits global app event
 * Before the component is unmounted, the listeners are cleared
 */
export function useGlobalEvents() {
    const appEventListeners: { eventName: string; listener: CallbackFunctionVariadic }[] = [];
    const documentListeners: { eventName: string; listener: CallbackFunctionVariadic }[] = [];

    function listenOnAppEvent<K extends keyof AppEventsMap>(eventName: K, listener: AppEventsMap[K]) {
        AppEvents.AddEventListener(eventName, listener);
        appEventListeners.push({
            eventName,
            listener,
        });
    }

    function listenOnDocumentEvent<K extends keyof DocumentEventMap>(
        eventName: K,
        listener: (this: Document, ev: DocumentEventMap[K]) => any,
    ) {
        document.addEventListener(eventName, listener);
        documentListeners.push({
            eventName,
            listener,
        });
    }

    onBeforeUnmount(() => {
        for (const l of appEventListeners) {
            AppEvents.RemoveEventListener(l.eventName as any, l.listener);
        }

        for (const l of documentListeners) {
            document.removeEventListener(l.eventName, l.listener);
        }
    });

    function emitAppEvent<K extends keyof AppEventsMap>(eventName: K, ...args: Parameters<AppEventsMap[K]>) {
        AppEvents.Emit(eventName, ...args);
    }

    return {
        listenOnAppEvent,
        listenOnDocumentEvent,
        emitAppEvent,
    };
}
