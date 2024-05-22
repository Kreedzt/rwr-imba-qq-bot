const rollup = require('rollup');
const typescript = require('@rollup/plugin-typescript');
const json = require('@rollup/plugin-json');

const child_process = require('node:child_process');

let appProcess = null;

function newProcess() {
    const process = child_process.spawn('node', ['dist/app.js']);

    process.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    process.on('disconnect', (e) => {
        console.log('on:disconnect', e);
    });

    process.on('error', (e) => {
        console.log('on:error', e);
    });

    process.on('exit', (e) => {
        console.log('on:exit', e);
    });

    process.on('message', (e) => {
        console.log('on:message', e);
    });

    process.on('spawn', (e) => {
        console.log('on:spawn', e);
    });

    return process;
}

function startApp() {
    if (appProcess) {
        appProcess.on('exit', () => {
            console.log('exited');
            appProcess = newProcess();
        });

        appProcess.kill();
        return;
    }

    appProcess = newProcess();
}

const watcher = rollup.watch({
    input: 'src/index.ts',
    output: {
        file: 'dist/app.js',
        format: 'cjs',
        sourcemap: true,
    },
    plugins: [typescript(), json()],
});

watcher.on('event', (event) => {
    console.log('watcher event', event.code);

    switch (event.code) {
        case 'START':
            break;
        case 'BUNDLE_START':
            break;
        case 'BUNDLE_END':
            break;
        case 'END':
            console.log('Bundle completed, restarting...');
            startApp();
            break;
        case 'ERROR': {
            console.log('error', event);
            break;
        }
    }
});
