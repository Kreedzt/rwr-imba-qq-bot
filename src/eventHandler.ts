import { MessageEvent, NoticeEvent, GlobalEnv, BaseEvent } from './types';
import { msgHandler } from './commands';
import { noticeHandler } from './notices';

export async function eventHandler(env: GlobalEnv, bodyData: BaseEvent) {
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
}
