import { defineConfig } from 'vitest/config';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig({
    plugins: [
        ...VitePluginNode({
            adapter: 'fastify',
            appPath: './src/index.ts',
            exportName: 'app',
        }),
    ],
    test: {
        globals: true,
        watch: false,
        // node-canvas report: https://github.com/vitest-dev/vitest/issues/2261
        pool: 'forks',
        coverage: {
            include: ['src/**/*.ts'],
            provider: 'istanbul',
            reporter: ['text', 'json', 'cobertura', 'html', 'lcov'],
        },
        includeSource: ['src'],
        reporters: [
            'default',
            ['vitest-sonar-reporter', { outputFile: 'sonar-report.xml' }],
        ],
    },
});
