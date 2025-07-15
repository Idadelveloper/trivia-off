type Statistics = {
    cpuUsage: number,
    ramUsage: number,
    storageUsage: number
};

type EventPayloadMapping = {
    statistics: Statistics;
    getStaticData: StaticData;
}

type StaticData = {
    totalStorage: number,
    cpuModel: string,
    totalMemoryGB: number
}

type UnsubscribeFunction = () => void;

interface Window {
    electron: {
        subscribeStatistics: (
            callback: (stats: Statistics) => void
        ) => UnsubscribeFunction;
        getStaticData: () => Promise<StaticData>
    }
}