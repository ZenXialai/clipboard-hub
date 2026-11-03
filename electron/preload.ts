import { ipcRenderer, contextBridge } from 'electron';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  readClipboardSnapshot: () => ipcRenderer.invoke('clipboard-read-snapshot'),
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  }
});
