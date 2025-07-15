import {app, BrowserWindow} from "electron";
import {ipcMainHandle, isDev} from "./util.js";
import {getStaticData, pollResources} from "./resourceManager.js";
import {getPreloadPath, getUIPath} from "./pathResolver.js";
import {createTray} from "./tray.js";
import {createMenu} from "./menu.js";
import {initDatabase, saveQuiz, getQuizzes, getQuizWithQuestions, updateQuiz, deleteQuiz} from "./database.js";
import {checkHotspotStatus, enableHotspot, disableHotspot} from "./hotspotManager.js";


app.on("ready", () => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: getPreloadPath(),
        }
    });
    if (isDev()) {
        mainWindow.loadURL("http://localhost:5123")
    } else {
        mainWindow.loadFile(getUIPath());
    }

    // Initialize the database
    initDatabase();

    pollResources(mainWindow);

    ipcMainHandle("getStaticData", () => {
        return getStaticData();
    })

    // Add IPC handlers for database operations
    ipcMainHandle("saveQuiz", (_event?: Electron.IpcMainInvokeEvent, args?: { title: string, questions: any[] }) => {
        if (!args) throw new Error("Missing arguments");
        const { title, questions } = args;
        return saveQuiz(title, questions);
    })

    ipcMainHandle("getQuizzes", () => {
        console.log('IPC getQuizzes handler called');
        const quizzes = getQuizzes();
        console.log('IPC getQuizzes handler returning:', quizzes);
        return quizzes;
    })

    ipcMainHandle("getQuizWithQuestions", (_event?: Electron.IpcMainInvokeEvent, args?: { quizId: number }) => {
        if (!args) throw new Error("Missing arguments");
        const { quizId } = args;
        return getQuizWithQuestions(quizId);
    })

    ipcMainHandle("updateQuiz", (_event?: Electron.IpcMainInvokeEvent, args?: { quizId: number, title: string, questions: any[] }) => {
        if (!args) throw new Error("Missing arguments");
        const { quizId, title, questions } = args;
        return updateQuiz(quizId, title, questions);
    })

    ipcMainHandle("deleteQuiz", (_event?: Electron.IpcMainInvokeEvent, args?: { quizId: number }) => {
        console.log('IPC deleteQuiz handler called with args:', args);
        if (!args) throw new Error("Missing arguments");
        const { quizId } = args;
        const result = deleteQuiz(quizId);
        console.log('IPC deleteQuiz handler returning:', result);
        return result;
    })

    // Add IPC handlers for hotspot management
    ipcMainHandle("checkHotspotStatus", async () => {
        console.log('IPC checkHotspotStatus handler called');
        const status = await checkHotspotStatus();
        console.log('IPC checkHotspotStatus handler returning:', status);
        return status;
    })

    ipcMainHandle("enableHotspot", async (_event?: Electron.IpcMainInvokeEvent, args?: { ssid: string, password: string }) => {
        console.log('IPC enableHotspot handler called with args:', args);
        if (!args) throw new Error("Missing arguments");
        const { ssid, password } = args;
        const result = await enableHotspot(ssid, password);
        console.log('IPC enableHotspot handler returning:', result);
        return result;
    })

    ipcMainHandle("disableHotspot", async () => {
        console.log('IPC disableHotspot handler called');
        const result = await disableHotspot();
        console.log('IPC disableHotspot handler returning:', result);
        return result;
    })

    createTray(mainWindow)
    handleCloseEvents(mainWindow)
    createMenu(mainWindow)

});

function handleCloseEvents(mainWindow: BrowserWindow) {
    let willClose = false

    mainWindow.on("close", (e) => {
        if (willClose) {
            return
        }
        e.preventDefault();
        mainWindow.hide();
        if (app.dock) {
            app.dock.hide();
        }
    });

    app.on("before-quit", () => {
        willClose = true;
    });

    mainWindow.on("show", () => {
        willClose = false;
    })
}
