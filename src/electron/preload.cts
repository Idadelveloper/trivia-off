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
    getQuizzes: async () => {
        console.log('Preload getQuizzes called');
        const quizzes = await ipcInvoke("getQuizzes");
        console.log('Preload getQuizzes returning:', quizzes);
        return quizzes;
    },
    getQuizWithQuestions: (quizId) => ipcInvoke("getQuizWithQuestions", { quizId }),
    updateQuiz: (quizId, title, questions) => ipcInvoke("updateQuiz", { quizId, title, questions }),
    deleteQuiz: (quizId) => {
        console.log('Preload deleteQuiz called with ID:', quizId);
        return ipcInvoke("deleteQuiz", { quizId });
    },
    // Add network status function
    getNetworkStatus: async () => {
        console.log('Preload getNetworkStatus called');
        const status = await ipcInvoke("getNetworkStatus");
        console.log('Preload getNetworkStatus returning:', status);
        return status;
    },
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
