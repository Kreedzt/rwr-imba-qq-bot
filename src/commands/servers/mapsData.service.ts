import { IMapDataItem } from './types';
import { readMapData } from './utils';

export class MapsDataService {
    static selfInst: MapsDataService;

    private data: IMapDataItem[] = [];
    filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    static init(filePath: string) {
        if (!MapsDataService.selfInst) {
            MapsDataService.selfInst = new MapsDataService(filePath);
        }
    }

    static getInst() {
        return MapsDataService.selfInst;
    }

    async refresh() {
        const record = await readMapData(this.filePath);

        this.data = record;
    }

    getData() {
        return this.data;
    }

    getPath() {
        return this.filePath;
    }
}
