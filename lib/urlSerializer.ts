import { AppState } from './store';

// We serialize an essential subset of the state to avoid blowing up the URL
export function serializeStateToUrl(state: AppState): string {
    try {
        const payload: SerializedState = {
            rawText: state.rawText
        };
        return btoa(JSON.stringify(payload));
    } catch (e) {
        console.error("Failed to serialize state", e);
        return "";
    }
}

export interface SerializedState {
    rawText: string;
}

export function deserializeStateFromUrl(hash: string): SerializedState | null {
    try {
        const jsonStr = atob(hash);
        return JSON.parse(jsonStr) as SerializedState;
    } catch (e) {
        console.error("Failed to deserialize state", e);
        return null;
    }
}
