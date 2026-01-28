import { describe, expect, it } from 'vitest';
import { RemoteService } from './remote.service';

describe('service', () => {
    it.concurrent('singleton constructor', () => {
        const srv1 = RemoteService.init({
            REMOTE_URL: 'http://demo.com'
        } as any);
        const srv2 = RemoteService.init({
            REMOTE_URL: 'http://demo2.com'
        } as any);
        expect(srv1).toEqual(srv2);
    });
});
