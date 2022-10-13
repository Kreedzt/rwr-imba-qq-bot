import * as express from 'express';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import { BaseEvent, GlobalEnv, MessageEvent } from './types';
import { logger } from './logger';
import { RemoteService } from './services';
import { msgHandler } from './commands';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ENV
dotenv.config();
const env = process.env as unknown as GlobalEnv;
RemoteService.init(env.REMOTE_URL);
logger.info('Env initialized:', env);

app.post('/in', async (req, res) => {
    const bodyData = req.body as BaseEvent;

    switch (bodyData.post_type) {
        case 'message':
            const msgEvent = bodyData as MessageEvent;
            await msgHandler(env, msgEvent);
            break;
    }
    res.send('OK');
});

app.listen(env.PORT, () => {
    logger.info(`App listening on port ${env.PORT}`);
});
