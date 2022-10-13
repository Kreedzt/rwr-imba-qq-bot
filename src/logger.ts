import * as tracer from 'tracer';

export const logger = tracer.dailyfile({
    root: './logs',
    maxLogFiles: 20,
    transport: [
        function (data) {
            console.log(data.output)
        }
    ]
});
