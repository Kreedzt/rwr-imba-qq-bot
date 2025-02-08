const rollup = require('rollup');
const typescript = require('@rollup/plugin-typescript');
const json = require('@rollup/plugin-json');
const chalk = require('chalk');

const child_process = require('node:child_process');

let appProcess = null;

function newProcess() {
    const process = child_process.spawn('node', ['dist/app.js']);

    process.stdout.on('data', (data) => {
        console.log(`${chalk.green('[INFO]')}stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
        console.log(`${chalk.red('[ERROR]')}stderr: ${data}`);
    });

    process.on('disconnect', (e) => {
        console.log(`${chalk.yellow('[WARN]')}on:disconnect`, e);
    });

    process.on('error', (e) => {
        console.log(`${chalk.red('[ERROR]')}on:error`, e);
    });

    process.on('exit', (e) => {
        console.log('on:exit', e);
    });

    process.on('message', (e) => {
        console.log(`${chalk.green('[INFO]')}on:message`, e);
    });

    process.on('spawn', (e) => {
        console.log(`${chalk.green('[INFO]')}on:spawn`, e);
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
    console.log(chalk.cyan('[WACHER EVENT]') + event.code);

    switch (event.code) {
        case 'START':
            break;
        case 'BUNDLE_START':
            break;
        case 'BUNDLE_END':
            break;
        case 'END':
            console.log(
                chalk.cyan('[WATCHER RESTARED]') +
                    'Bundle completed, restarting...'
            );
            startApp();
            break;
        case 'ERROR': {
            console.log(chalk.red('[WATCHER ERROR]') + 'error', event);
            break;
        }
    }
});
