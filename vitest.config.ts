import { defineConfig } from 'vitest/config';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig({
    plugins: [
        ...VitePluginNode({
            adapter: 'express',
            appPath: './src/index.ts',
            exportName: 'app',
        }),
    ],
    test: {
        globals: true,
        watch: false,
        coverage: {
            all: true,
            include: ['src'],
            provider: 'istanbul', // or 'c8',
            reporter: ['text', 'json', 'cobertura', 'html'],
        },
        includeSource: ['src'],
    },
});
