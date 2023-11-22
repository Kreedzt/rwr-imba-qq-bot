import { describe, expect, it } from 'vitest';
import { RemoteService } from './services';

describe('service', () => {
    it.concurrent('singleton constructor', () => {
        const srv1 = RemoteService.init('http://demo.com');
        const srv2 = RemoteService.init('http://demo2.com');
        expect(srv1).toEqual(srv2);
    });
});
