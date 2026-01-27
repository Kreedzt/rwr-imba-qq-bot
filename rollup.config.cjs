const { defineConfig } = require('rollup');
const typescript = require('@rollup/plugin-typescript');
const json = require('@rollup/plugin-json');

module.exports = defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/app.js',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      module: 'ESNext',
      target: 'ESNext'
    }),
    json()
  ]
});
