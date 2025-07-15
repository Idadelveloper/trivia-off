type Statistics = {
    cpuUsage: number,
    ramUsage: number,
    storageUsage: number
};

type NetworkStatus = {
    isConnected: boolean;
    ssid?: string;
    ipAddress?: string;
    hostname?: string;
    error?: string;
};

type Player = {
    id: string;
    name: string;
    joinedAt: Date;
    socketId: string;
    score: number;
    answers: {
        questionIndex: number;
        answerIndex: number;
        isCorrect: boolean;
        timeToAnswer: number; // in milliseconds
    }[];
};

type EventPayloadMapping = {
    statistics: Statistics;
    getStaticData: StaticData;
    changeView: View;
    saveQuiz: { id: number; title: string; createdAt: string };
    getQuizzes: Quiz[];
    getQuizWithQuestions: QuizWithQuestions | null;
    updateQuiz: Quiz;
    deleteQuiz: { success: boolean };
    getNetworkStatus: NetworkStatus;
    startGameServer: { serverUrl: string | null; networkStatus: NetworkStatus };
    stopGameServer: { success: boolean };
    getGamePlayers: Player[];
    startGame: { success: boolean };
    "players:updated": Player[];
    "game:countdown": { seconds: number };
    "game:question": { 
        index: number; 
        text: string; 
        options: string[] | string; 
        totalQuestions: number 
    };
    "game:answer": { 
        questionIndex: number; 
        correctAnswer: number 
    };
    "game:leaderboard": { 
        leaderboard: { id: string; name: string; score: number }[]; 
        isGameOver: boolean 
    };
    "timer:update": { value: number };
}

type StaticData = {
    totalStorage: number,
    cpuModel: string,
    totalMemoryGB: number
}

type View = "CPU" | "RAM" | "STORAGE";

type Quiz = {
    id?: number;
    title: string;
    createdAt: string;
};

type Question = {
    id?: number;
    quizId: number;
    text: string;
    options: string[] | string;
    correctAnswer: number;
};

type QuizWithQuestions = Quiz & {
    questions: Question[];
};

type UnsubscribeFunction = () => void;

interface Window {
    electron: {
        subscribeStatistics: (
            callback: (stats: Statistics) => void
        ) => UnsubscribeFunction;
        getStaticData: () => Promise<StaticData>
        subscribeChangeView: (
            callback: (view: View) => void
        ) => UnsubscribeFunction;
        saveQuiz: (title: string, questions: { text: string; options: string[]; correctAnswer: number }[]) => Promise<{ id: number; title: string; createdAt: string }>;
        getQuizzes: () => Promise<Quiz[]>;
        getQuizWithQuestions: (quizId: number) => Promise<QuizWithQuestions | null>;
        updateQuiz: (quizId: number, title: string, questions: { id?: number; text: string; options: string[]; correctAnswer: number }[]) => Promise<Quiz>;
        deleteQuiz: (quizId: number) => Promise<{ success: boolean }>;
        getNetworkStatus: () => Promise<NetworkStatus>;
        startGameServer: (quizId: number, quizTitle: string) => Promise<{ serverUrl: string | null; networkStatus: NetworkStatus }>;
        stopGameServer: () => Promise<{ success: boolean }>;
        getGamePlayers: () => Promise<Player[]>;
        startGame: (quizId: number) => Promise<{ success: boolean }>;
        subscribePlayers: (
            callback: (players: Player[]) => void
        ) => UnsubscribeFunction;
        subscribeGameCountdown: (
            callback: (data: { seconds: number }) => void
        ) => UnsubscribeFunction;
        subscribeGameQuestion: (
            callback: (data: { 
                index: number; 
                text: string; 
                options: string[] | string; 
                totalQuestions: number 
            }) => void
        ) => UnsubscribeFunction;
        subscribeGameAnswer: (
            callback: (data: { 
                questionIndex: number; 
                correctAnswer: number 
            }) => void
        ) => UnsubscribeFunction;
        subscribeGameLeaderboard: (
            callback: (data: { 
                leaderboard: { id: string; name: string; score: number }[]; 
                isGameOver: boolean 
            }) => void
        ) => UnsubscribeFunction;
        subscribeTimerUpdate: (
            callback: (data: { value: number }) => void
        ) => UnsubscribeFunction;
    }
}
