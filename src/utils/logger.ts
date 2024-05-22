import * as tracer from 'tracer';

export const logger = tracer.dailyfile({
    root: './logs',
    maxLogFiles: 20,
    transport: [
        function (data) {
            const logData: Record<string, any> = {
                timestamp: data.timestamp,
                level: data.title,
                message: data.message,
            };
            if (data.title === 'error') {
                logData.line = data.line;
                logData.path = data.path;
                (logData.method = data.method), (logData.stack = data.stack);
            }
            console.log(JSON.stringify(logData));
        },
    ],
}) as {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    error: (...args: any[]) => void;
    log: (...args: any[]) => void;
};
