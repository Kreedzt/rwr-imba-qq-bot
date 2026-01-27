import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { printChartPng } from './chart';
import {
    ANALYSIS_DATA_FILE,
    ANALYSIS_OUTPUT_FILE,
    OUTPUT_FOLDER,
} from '../types/constants';

describe('charts', () => {
    it('renders analysis chart to PNG', async () => {
        const outDir = path.join(process.cwd(), OUTPUT_FOLDER);
        fs.mkdirSync(outDir, { recursive: true });

        const dataPath = path.join(outDir, ANALYSIS_DATA_FILE);
        fs.writeFileSync(
            dataPath,
            JSON.stringify([
                { date: '2026-01-20', count: 10 },
                { date: '2026-01-21', count: 20 },
                { date: '2026-01-22', count: 15 },
            ]),
        );

        const fileName = await printChartPng();
        expect(fileName).toBe(ANALYSIS_OUTPUT_FILE);

        const outPath = path.join(outDir, ANALYSIS_OUTPUT_FILE);
        expect(fs.existsSync(outPath)).toBe(true);

        // Cleanup.
        fs.unlinkSync(outPath);
        fs.unlinkSync(dataPath);
    }, 30_000);
});
