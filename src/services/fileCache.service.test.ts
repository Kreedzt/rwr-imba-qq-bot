import { describe, it, expect } from 'vitest';
import { AsyncCacheService } from './asyncCache.service';
import { awaitTimeout } from '../utils/time';

class TestNumberCache extends AsyncCacheService<number> {
    cacheTime = 1;

    async fetchData() {
        return 1;
    }
}

describe('fileCache', () => {
    it.concurrent('update check', async () => {
        const cache = new TestNumberCache();
        expect(await cache.getData()).toEqual(1);

        expect(cache.updateCheck()).toEqual(true);

        await awaitTimeout(1000);

        expect(cache.updateCheck()).toEqual(true);
    });

    it.concurrent('get cached data', async () => {
        const cache = new TestNumberCache();
        expect(await cache.getData()).toEqual(1);
        cache.cacheData = 3;

        expect(await cache.getData()).toEqual(1);
    });
});
