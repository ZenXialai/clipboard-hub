/// <reference types="vite/client" />

interface ClipboardSnapshot {
  type: 'text' | 'image' | 'empty';
  content: string;
  signature: string;
}

interface Window {
  electronAPI: {
    getAppVersion: () => Promise<string>;
    readClipboardSnapshot: () => Promise<ClipboardSnapshot>;
    on: (channel: string, callback: (...args: unknown[]) => void) => void;
    send: (channel: string, ...args: unknown[]) => void;
  };
}
