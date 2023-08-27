import { logger } from "../logger";
import { GlobalEnv, IRegister, MessageEvent } from "../types";

interface UserCommandRequest {
    [k: string]: {
        lastCallTime: number;
    }
}

const userCommandRequestMap = new Map<number, UserCommandRequest>();

export const checkTimeIntervalValid = (c: IRegister, event: MessageEvent): {
    success: boolean;
} => {
    const res = {
        success: true
    }

    if (!c.timesInterval) {
        return res;
    }

    const currentTimestamp = new Date().getTime();

    const user = event.user_id;

    const requestMapRes = userCommandRequestMap.get(user);

    const commandName = c.name;

    if (!requestMapRes) {
        userCommandRequestMap.set(user, {
            [c.name]: {
                lastCallTime: currentTimestamp
            }
        })
        return res;
    }

    if (!requestMapRes[commandName]) {
        userCommandRequestMap.set(user, {
            ...requestMapRes,
            [c.name]: {
                lastCallTime: currentTimestamp
            }
        })
        return res;
    }

    // Get time diff, check res
    const timeDiff = currentTimestamp - requestMapRes[commandName].lastCallTime;
    logger.info('> get timeDiff', timeDiff);
    if (timeDiff < c.timesInterval * 1000) {
        res.success = false;
        return res;
    }

    requestMapRes[commandName].lastCallTime = currentTimestamp;

    return res;
}

export const getStaticHttpPath = (env: GlobalEnv, path: string) => {
    return `http://${env.HOSTNAME || 'localhost'}:${env.PORT}/out/${path}`;
}