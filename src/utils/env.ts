import dotenv from 'dotenv';
import { GlobalEnv } from '../types';
import { logger } from './logger';

export function loadEnv(): GlobalEnv {
    dotenv.config();
    const _env = process.env as Record<string, string>;

    logger.info('_env: ACTIVE_COMMANDS', _env.ACTIVE_COMMANDS);

    const env = {
        ..._env,
        ADMIN_QQ_LIST: JSON.parse(_env.ADMIN_QQ_LIST),
        PORT: parseInt(_env.PORT),
        ACTIVE_COMMANDS: JSON.parse(_env.ACTIVE_COMMANDS),
    } as GlobalEnv;

    return env;
}
