import Store from 'electron-store';

export interface SipConfig {
    username: string;
    password: string;
    server: string;
    status: 'online' | 'offline';
}

export const appStore = new Store({
    name: 'softphone-app',
    defaults: {
        sip: {} as SipConfig,
    },
});
