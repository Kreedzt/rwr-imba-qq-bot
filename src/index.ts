import Fastify from 'fastify';
import path from 'path';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
import { BaseEvent, GlobalEnv, MessageEvent, NoticeEvent } from './types';
import { logger } from './utils/logger';
import { RemoteService } from './services/remote.service';
import { msgHandler, initCommands } from './commands';
import { noticeHandler } from './notices';
import { ClickHouseService } from './services/clickHouse.service';

const app = Fastify({
    logger: {
        serializers: {
            res(res) {
                return {
                    type: 'access:response',
                    method: res.request?.method,
                    url: res.request?.url,
                    params: res.request?.params,
                    hostname: res.request?.hostname,
                    ip: res.request?.ip,
                    elapse: res.elapsedTime,
                    statusCode: res.statusCode,
                };
            },
            req(req) {
                return {
                    type: 'access:request',
                    method: req.method,
                    url: req.url,
                    params: req.params,
                    hostname: req.hostname,
                    ip: req.ip,
                };
            },
        },
    },
});

app.register(fastifyStatic, {
    root: path.join(__dirname, '../out'),
    prefix: '/out/',
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
    res.send('pong!');
});

if (process.env.CLICKHOUSE_DB) {
    app.get('/query_cmd', async (req, res) => {
        const data = await ClickHouseService.getInst().queryCmd();

        const columns = [
            'cmd',
            'params',
            'group_id',
            'user_id',
            'received_time',
            'response_time',
            'elapse_time',
            'create_time',
        ];
        const rowData: string[][] = [];

        data.forEach((d) => {
            const dataRow: any[] = [];
            columns.forEach((col) => {
                dataRow.push(d[col]);
            });
            rowData.push(dataRow);
        });

        const resData = [columns, ...rowData];

        res.send(resData);
    });
}

app.listen(
    {
        host: env.HOSTNAME,
        port: env.PORT,
    },
    async (err, address) => {
        if (err) throw err;
        logger.info('initing Commands...', env);
        await initCommands(env);
        logger.info(`App listening on ${address}`);
    }
);
