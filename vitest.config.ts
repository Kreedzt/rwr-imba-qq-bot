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
        pool: 'forks',
        coverage: {
            all: true,
            include: ['src'],
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
