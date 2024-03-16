export class AsyncCacheService<T> {
    /**
     * by seconds
     */
    cacheData?: T;

    cacheTime = 0;
    lastUpdatedTime?: number;

    async fetchData(): Promise<T> {
        return {} as T;
    }

    async updateCache() {
        this.cacheData = await this.fetchData();
        this.lastUpdatedTime = Date.now();
    }

    updateCheck(): boolean {
        let shouldUpdate = true;
        const now = Date.now();

        if (
            this.lastUpdatedTime &&
            now - this.lastUpdatedTime < this.cacheTime
        ) {
            shouldUpdate = false;
        }

        return shouldUpdate;
    }

    async getData() {
        if (this.updateCheck()) {
            await this.updateCache();
        }

        return this.cacheData!;
    }
}
