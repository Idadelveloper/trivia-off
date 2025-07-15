const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
    subscribeStatistics: (callback) =>
        ipcOn("statistics", (stats) => {
            callback(stats);
        }),
    subscribeChangeView: (callback) =>
        ipcOn("changeView", (stats) => {
            callback(stats);
        }),
    getStaticData: () => ipcInvoke("getStaticData"),
    // Add database functions
    saveQuiz: (title, questions) => ipcInvoke("saveQuiz", { title, questions }),
    getQuizzes: () => ipcInvoke("getQuizzes"),
    getQuizWithQuestions: (quizId) => ipcInvoke("getQuizWithQuestions", { quizId }),
} satisfies Window['electron'])

function ipcInvoke<Key extends keyof EventPayloadMapping>(
    key: Key,
    args?: any
): Promise<EventPayloadMapping[Key]> {
    return electron.ipcRenderer.invoke(key, args)
}

function ipcOn<Key extends keyof EventPayloadMapping>(
    key: Key,
    callback: (payload: EventPayloadMapping[Key]) => void
) {
    const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload)
    electron.ipcRenderer.on(key, cb)
    return () => electron.ipcRenderer.off(key, cb)
}
