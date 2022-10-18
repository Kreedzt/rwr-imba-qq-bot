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

// ENV
dotenv.config();
const _env = process.env as Record<string, string>;
const env = {
    ..._env,
    ADMIN_QQ: parseInt(_env.ADMIN_QQ),
    PORT: parseInt(_env.PORT)
} as GlobalEnv;

RemoteService.init(env.REMOTE_URL);
logger.info('Env initialized:', {
    PORT: env.PORT,
    START_MATCH: env.START_MATCH,
    REMOTE_URL: env.REMOTE_URL,
    ADMIN_QQ: env.ADMIN_QQ
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
