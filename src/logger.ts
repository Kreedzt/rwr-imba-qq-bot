import * as tracer from 'tracer';

export const logger = tracer.dailyfile({
    root: './logs',
    maxLogFiles: 20,
    transport: [
        function (data) {
            console.log(JSON.stringify(data.output))
        }
    ]
}) as {
    info: (...args: any[]) => void,
    warn: (...args: any[]) => void,
    debug: (...args: any[]) => void,
    error: (...args: any[]) => void,
    log: (...args: any[]) => void,
};
