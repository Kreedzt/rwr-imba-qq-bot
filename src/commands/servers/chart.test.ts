import { describe, expect, it } from 'vitest';
import { printChartPng } from './chart';

describe('pring png', () => {
    it.concurrent('print png', async () => {
        // DEBUG
        // const filename = await printChartPng();
        // expect(filename).toBe('analysis.png');
    });
});
