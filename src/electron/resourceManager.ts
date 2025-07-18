import osUtils from 'os-utils';
import os from "os"
import fs from 'fs'
import {BrowserWindow} from "electron";
import {ipcWebContentsSend} from "./util.js";

const POLLING_INTERVAL = 500;

export function pollResources(mainWindow: BrowserWindow) {
    setInterval (async () => {
        const ramUsage = getRamUsage()
        const cpuUsage = await getCpuUsage()
        const storageData = getStorageData()
        ipcWebContentsSend("statistics", mainWindow.webContents, {
            cpuUsage,
            ramUsage,
            storageUsage: storageData.usage
        })
    }, POLLING_INTERVAL)
}

export function getStaticData() {
    const totalStorage = getStorageData().total;
    const cpuModel = os.cpus()[0].model;
    const totalMemoryGB = Math.floor(osUtils.totalmem() / 1024)

    return {
        totalStorage,
        cpuModel,
        totalMemoryGB
    };
}

function getCpuUsage(): Promise<number> {
    return new Promise(resolve => {
        osUtils.cpuUsage((resolve));
    })
}

function getRamUsage() {
    return 1 - osUtils.freememPercentage();
}

function getStorageData() {
    const stats = fs.statfsSync(process.platform === 'win32' ? 'C:\\' : '/');
    const total = stats.blocks * stats.bsize;
    const free = stats.bfree * stats.bsize;

    return {
        total: Math.floor(total / 1_000_000_000),
        usage: 1 - free / total
    }
}