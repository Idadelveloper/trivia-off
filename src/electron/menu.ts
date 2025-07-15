import {BrowserWindow, Menu, dialog} from "electron";
import {ipcWebContentsSend, isDev} from "./util.js";
import {checkHotspotStatus, enableHotspot, disableHotspot} from "./hotspotManager.js";

export function createMenu(mainWindow: BrowserWindow) {
    Menu.setApplicationMenu(
        (Menu.buildFromTemplate([
                    {
                        label: process.platform === "darwin" ? undefined : "App",
                        type: 'submenu',
                        submenu: [
                            {
                                label: "Quit",
                                click: () => process.exit(0)
                            },
                            {
                                label: "Devtools",
                                click: () => mainWindow.webContents.openDevTools(),
                                visible: isDev(),
                            },
                        ]
                    },
                    {
                        label: "View",
                        type: 'submenu',
                        submenu: [
                            {
                                label: "CPU",
                                click: () =>
                                    ipcWebContentsSend("changeView", mainWindow.webContents, "CPU")
                            },
                            {
                                label: "RAM",
                                click: () =>
                                    ipcWebContentsSend("changeView", mainWindow.webContents, "RAM")
                            },
                            {
                                label: "STORAGE",
                                click: () =>
                                    ipcWebContentsSend("changeView", mainWindow.webContents, "STORAGE")
                            }
                        ]
                    },
                    {
                        label: "Hotspot",
                        type: 'submenu',
                        submenu: [
                            {
                                label: "Check Status",
                                click: async () => {
                                    const status = await checkHotspotStatus();
                                    dialog.showMessageBox(mainWindow, {
                                        type: status.isEnabled ? 'info' : 'warning',
                                        title: 'Hotspot Status',
                                        message: status.isEnabled 
                                            ? `Hotspot is enabled${status.ssid ? ` (SSID: ${status.ssid})` : ''}` 
                                            : 'Hotspot is disabled',
                                        detail: status.error ? `Error: ${status.error}` : undefined
                                    });
                                }
                            },
                            {
                                label: "Enable Hotspot",
                                click: async () => {
                                    // Use default SSID and password
                                    const ssid = 'TriviaOffHotspot';
                                    const password = 'trivia123';

                                    // Confirm with the user
                                    const { response } = await dialog.showMessageBox(mainWindow, {
                                        type: 'question',
                                        title: 'Enable Hotspot',
                                        message: 'Enable hotspot with the following settings?',
                                        detail: `SSID: ${ssid}\nPassword: ${password}`,
                                        buttons: ['Cancel', 'Enable'],
                                        defaultId: 1,
                                        cancelId: 0
                                    });

                                    if (response === 1) {
                                        const result = await enableHotspot(ssid, password);

                                        dialog.showMessageBox(mainWindow, {
                                            type: result ? 'info' : 'error',
                                            title: result ? 'Hotspot Enabled' : 'Error',
                                            message: result 
                                                ? `Hotspot "${ssid}" has been enabled successfully.` 
                                                : 'Failed to enable hotspot.',
                                            detail: result 
                                                ? 'Users can now connect to this network.' 
                                                : 'Please check your system settings or try again.'
                                        });
                                    }
                                }
                            },
                            {
                                label: "Disable Hotspot",
                                click: async () => {
                                    const result = await disableHotspot();

                                    dialog.showMessageBox(mainWindow, {
                                        type: result ? 'info' : 'error',
                                        title: result ? 'Hotspot Disabled' : 'Error',
                                        message: result 
                                            ? 'Hotspot has been disabled successfully.' 
                                            : 'Failed to disable hotspot.',
                                        detail: result 
                                            ? 'The network is no longer available for users.' 
                                            : 'Please check your system settings or try again.'
                                    });
                                }
                            }
                        ]
                    }
                ]
            )
        )
    );
}
