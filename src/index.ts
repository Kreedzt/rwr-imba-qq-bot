import * as express from 'express';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import { BaseEvent, GlobalEnv, MessageEvent, NoticeEvent } from './types';
import { logger } from './logger';
import { RemoteService } from './services';
import { msgHandler } from './commands';
import { noticeHandler } from './notices';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/out', express.static('out'));

// ENV
dotenv.config();
const _env = process.env as Record<string, string>;

logger.info('_env: ACTIVE_COMMANDS', _env.ACTIVE_COMMANDS);

const env = {
    ..._env,
    ADMIN_QQ_LIST: JSON.parse(_env.ADMIN_QQ_LIST),
    PORT: parseInt(_env.PORT),
    ACTIVE_COMMANDS: JSON.parse(_env.ACTIVE_COMMANDS)
} as GlobalEnv;

RemoteService.init(env.REMOTE_URL);
logger.info('Env initialized:', {
    PORT: env.PORT,
    HOSTNAME: env.HOSTNAME,
    START_MATCH: env.START_MATCH,
    REMOTE_URL: env.REMOTE_URL,
    ADMIN_QQ: env.ADMIN_QQ_LIST,
    SERVERS_MATCH_REGEX: env.SERVERS_MATCH_REGEX,
    ACTIVE_COMMANDS: env.ACTIVE_COMMANDS,
    WEBSITE_DATA_FILE: env.WEBSITE_DATA_FILE,
    TDOLL_DATA_FILE: env.TDOLL_DATA_FILE,
    QA_DATA_FILE: env.QA_DATA_FILE
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

app.listen(env.PORT, () => {
    logger.info(`App listening on port ${env.PORT}`);
});
