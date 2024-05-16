const { defineConfig } = require('rollup');
const typescript = require('@rollup/plugin-typescript');
const json = require('@rollup/plugin-json');

module.exports = defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/app.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [typescript(), json()]
});
