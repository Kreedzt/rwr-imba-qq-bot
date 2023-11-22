import { describe, it, expect } from 'vitest';
import { getCommandParams, getFirstCommand } from './utils';

describe('global utils', () => {
    describe.concurrent('getFirstCommand', () => {
        it.concurrent('empty string', () => {
            const res = getFirstCommand('');

            expect(res).toBe('');
        });

        it.concurrent('normal command', () => {
            const res = getFirstCommand('#a');

            expect(res).toBe('a');
        });

        it.concurrent('multiple command', () => {
            const res = getFirstCommand('#a #b');

            expect(res).toBe('a');
        });
    });

    describe.concurrent('getCommandParams', () => {
        it.concurrent('#a h = h', () => {
            const res = getCommandParams('#a h');

            const arr = Array.from(res);

            expect(arr).toEqual([['h', true]]);
        });

        it.concurrent('#a h d -> h,d', () => {
            const res = getCommandParams('#a h d');

            const arr = Array.from(res);

            expect(arr).toEqual([
                ['h', true],
                ['d', true],
            ]);
        });

        it.concurrent('default params', () => {
            const res = getCommandParams('#a', {
                d: true,
            });

            const arr = Array.from(res);

            expect(arr).toEqual([['d', true]]);
        });

        it.concurrent('default params with other params', () => {
            const res = getCommandParams('#a h', {
                d: true,
            });

            const arr = Array.from(res);

            expect(arr).toEqual([
                ['d', true],
                ['h', true],
            ]);
        });

        it.concurrent('default params with override', () => {
            const res = getCommandParams('#a d', {
                d: true,
            });

            const arr = Array.from(res);

            expect(arr).toEqual([['d', true]]);
        });
    });
});
