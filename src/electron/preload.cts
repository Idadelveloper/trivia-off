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
    // Add hotspot management functions
    checkHotspotStatus: async () => {
        console.log('Preload checkHotspotStatus called');
        const status = await ipcInvoke("checkHotspotStatus");
        console.log('Preload checkHotspotStatus returning:', status);
        return status;
    },
    enableHotspot: async (ssid, password) => {
        console.log('Preload enableHotspot called with SSID:', ssid);
        const result = await ipcInvoke("enableHotspot", { ssid, password });
        console.log('Preload enableHotspot returning:', result);
        return result;
    },
    disableHotspot: async () => {
        console.log('Preload disableHotspot called');
        const result = await ipcInvoke("disableHotspot");
        console.log('Preload disableHotspot returning:', result);
        return result;
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
