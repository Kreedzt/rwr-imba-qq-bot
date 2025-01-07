import { describe, it, expect } from 'vitest';
import { MapsDataService } from './mapsData.service';

describe('mapsData service', () => {
    it('init', async () => {
        MapsDataService.init('test');
        const inst = MapsDataService.getInst();
        expect(inst.getPath()).toBe('test');
    });

    it('get data', async () => {
        const data = MapsDataService.getInst().getData();

        expect(data).toEqual([]);
    });
});
