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

interface Window {
    electron: {
        subscribeStatistics: (callback: (stats: Statistics) => void) => void;
        getStaticData: () => Promise<StaticData>
    }
}