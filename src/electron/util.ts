import { ipcMain, WebContents, WebFrameMain } from 'electron';
import {getUIPath} from "./pathResolver.js";
import {pathToFileURL} from 'url';

export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
    key: string,
    handler: (event?: Electron.IpcMainInvokeEvent, args?: any) => EventPayloadMapping[Key]
) {
  ipcMain.handle(key, (event, args) => {
    validateEventFrame(event.senderFrame);
    return handler(event, args);
  })
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
    key: Key,
    webContents: WebContents,
    payload: EventPayloadMapping[Key]
) {
  webContents.send(key, payload)
}

export function validateEventFrame(frame: WebFrameMain | null) {
  if (!frame) {
    throw new Error('Invalid event: sender frame is null');
  }
  if (isDev() && new URL(frame.url).host === 'localhost:5123') {
    return;
  }
  if (frame.url !== pathToFileURL(getUIPath()).toString()) {
    throw new Error('Malicious event');
  }
}
