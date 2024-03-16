import * as fs from 'node:fs/promises';
import { AsyncCacheService } from '../../services/asyncCache.service';
import { ITDollSkinDataItem } from './types';

class TDollSkinService extends AsyncCacheService<Record<string, ITDollSkinDataItem>> {
    cacheTime = 24 * 60 * 60;

    async fetchData() {
        const raw = await fs.readFile(
            process.env.TDOLL_SKIN_DATA_FILE as string,
            'utf-8'
        );
        return JSON.parse(raw) as Record<string, ITDollSkinDataItem>;
    }
}

export const TDollSkinSvc = new TDollSkinService();
