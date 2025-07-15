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
    }
}
