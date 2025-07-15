import {app, BrowserWindow} from "electron";
import {ipcMainHandle, isDev} from "./util.js";
import {getStaticData, pollResources} from "./resourceManager.js";
import {getPreloadPath, getUIPath} from "./pathResolver.js";
import {createTray} from "./tray.js";
import {createMenu} from "./menu.js";
import {initDatabase, saveQuiz, getQuizzes, getQuizWithQuestions} from "./database.js";


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
        return getQuizzes();
    })

    ipcMainHandle("getQuizWithQuestions", (_event?: Electron.IpcMainInvokeEvent, args?: { quizId: number }) => {
        if (!args) throw new Error("Missing arguments");
        const { quizId } = args;
        return getQuizWithQuestions(quizId);
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
