type Statistics = {
    cpuUsage: number,
    ramUsage: number,
    storageUsage: number
};

type EventPayloadMapping = {
    statistics: Statistics;
    getStaticData: StaticData;
    changeView: View;
}

type StaticData = {
    totalStorage: number,
    cpuModel: string,
    totalMemoryGB: number
}

type View = "CPU" | "RAM" | "STORAGE";

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
    }
}