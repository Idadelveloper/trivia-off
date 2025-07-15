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
    // Add game server functions
    startGameServer: async (quizId, quizTitle) => {
        console.log('Preload startGameServer called with:', quizId, quizTitle);
        const result = await ipcInvoke("startGameServer", { quizId, quizTitle });
        console.log('Preload startGameServer returning:', result);
        return result;
    },
    stopGameServer: async () => {
        console.log('Preload stopGameServer called');
        const result = await ipcInvoke("stopGameServer");
        console.log('Preload stopGameServer returning:', result);
        return result;
    },
    getGamePlayers: async () => {
        console.log('Preload getGamePlayers called');
        const players = await ipcInvoke("getGamePlayers");
        console.log('Preload getGamePlayers returning:', players);
        return players;
    },
    startGame: async (quizId) => {
        console.log('Preload startGame called with quizId:', quizId);
        const result = await ipcInvoke("startGame", { quizId });
        console.log('Preload startGame returning:', result);
        return result;
    },
    // Add event subscriptions for game events
    subscribePlayers: (callback) =>
        ipcOn("players:updated", (players) => {
            callback(players);
        }),
    subscribeGameCountdown: (callback) =>
        ipcOn("game:countdown", (data) => {
            callback(data);
        }),
    subscribeGameQuestion: (callback) =>
        ipcOn("game:question", (data) => {
            callback(data);
        }),
    subscribeGameAnswer: (callback) =>
        ipcOn("game:answer", (data) => {
            callback(data);
        }),
    subscribeGameLeaderboard: (callback) =>
        ipcOn("game:leaderboard", (data) => {
            callback(data);
        }),
    subscribeTimerUpdate: (callback) =>
        ipcOn("timer:update", (data) => {
            callback(data);
        }),
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
