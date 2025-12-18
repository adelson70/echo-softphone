import Store from 'electron-store';

export interface SipConfig {
    username: string;
    password: string;
    server: string;
    status: 'online' | 'offline';
}

export interface Contact {
    id: string;
    name: string;
    number: string;
    createdAt: number;
}

export interface CallHistoryEntry {
    id: string;
    number: string;
    displayName?: string;
    direction: 'incoming' | 'outgoing';
    status: 'answered' | 'missed' | 'rejected' | 'failed' | 'completed';
    startTime: number;
    endTime?: number;
    duration?: number;
}

export const appStore = new Store({
    name: 'softphone-app',
    defaults: {
        sip: {} as SipConfig,
        contacts: [] as Contact[],
        callHistory: [] as CallHistoryEntry[],
    },
});
