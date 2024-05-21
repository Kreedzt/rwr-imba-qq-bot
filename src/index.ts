import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { BaseEvent, GlobalEnv, MessageEvent, NoticeEvent } from './types';
import { logger } from './utils/logger';
import { RemoteService } from './services/remote.service';
import { msgHandler, initCommands } from './commands';
import { noticeHandler } from './notices';
import { ClickHouseService } from './services/clickHouse.service';
import { table } from 'table';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/out', express.static('out'));
app.use((req, res, next) => {
    const start = Date.now();
    const logData = {
        method: req.method,
        url: req.url,
        params: req.params,
        body: req.body,
        hostname: req.hostname,
        ip: req.ip,
    };
    next();
    const end = Date.now();
    const elapsed = end - start;
    console.log(
        JSON.stringify({
            type: 'access',
            ...logData,
            elapse: elapsed,
        })
    );
});

// ENV
dotenv.config();
const _env = process.env as Record<string, string>;

logger.info('_env: ACTIVE_COMMANDS', _env.ACTIVE_COMMANDS);

const env = {
    ..._env,
    ADMIN_QQ_LIST: JSON.parse(_env.ADMIN_QQ_LIST),
    PORT: parseInt(_env.PORT),
    ACTIVE_COMMANDS: JSON.parse(_env.ACTIVE_COMMANDS),
} as GlobalEnv;

RemoteService.init(env.REMOTE_URL);
initCommands(env);
logger.info('Env initialized:', {
    PORT: env.PORT,
    HOSTNAME: env.HOSTNAME,
    START_MATCH: env.START_MATCH,
    REMOTE_URL: env.REMOTE_URL,
    ADMIN_QQ: env.ADMIN_QQ_LIST,
    SERVERS_MATCH_REGEX: env.SERVERS_MATCH_REGEX,
    SERVERS_FALLBACK_URL: env.SERVERS_FALLBACK_URL,
    ACTIVE_COMMANDS: env.ACTIVE_COMMANDS,
    WEBSITE_DATA_FILE: env.WEBSITE_DATA_FILE,
    TDOLL_DATA_FILE: env.TDOLL_DATA_FILE,
    TDOLL_SKIN_DATA_FILE: env.TDOLL_SKIN_DATA_FILE,
    QA_DATA_FILE: env.QA_DATA_FILE,
    GLM_API_KEY: env.GLM_APIKEY,
    GLM_KNOWLEDGE_ID: env.GLM_KNOWLEDGE_ID,
});

app.post('/in', async (req, res) => {
    const bodyData = req.body as BaseEvent;

    switch (bodyData.post_type) {
        case 'message':
            const msgEvent = bodyData as MessageEvent;
            await msgHandler(env, msgEvent);
            break;
        case 'notice':
            const noticeEvent = bodyData as NoticeEvent;
            await noticeHandler(env, noticeEvent);
            break;
    }
    res.send('OK');
});

app.get('/ping', async (req, res) => {
    res.end('pong!');
});

if (process.env.CLICKHOUSE_DB) {
    app.get('/query_cmd', async (req, res) => {
        const data = await ClickHouseService.getInst().queryCmd();

        const columns = [
            'cmd',
            'params',
            'user_id',
            'group_id',
            'received_time',
            'response_time',
            'elapse_time',
        ];
        const rowData: string[][] = [];

        data.forEach((d) => {
            rowData.push([
                d.cmd,
                d.params,
                d.user_id.toString(),
                d.group_id.toString(),
                d.received_time,
                d.response_time,
                d.elapse_time.toString(),
            ]);
        });

        const output = table([columns, ...rowData]);

        res.json(output);
    });
}

app.listen(env.PORT, () => {
    logger.info(`App listening on port ${env.PORT}`);
});
