import { logger } from "../utils/logger";
import { RemoteService } from "../services/remote.service";
import { BaseEvent, MsgExecCtx, GlobalEnv, NoticeEvent, NoticeExecCtx } from "../types";
import { welcomeNewMember } from "./welcome";

const quickReply = async (event: NoticeEvent, text: string) => {
    await RemoteService.getInst().sendGroupMsg({
        group_id: event.group_id,
        message: `[CQ:at,qq=${event.user_id}]\n${text}`,
    });
}

export const noticeHandler = async (env: GlobalEnv, event: NoticeEvent) => {
    const ctx: NoticeExecCtx = {
        env,
        event,
        reply: async (msg: string) => {
            await quickReply(event, msg);
        },
    };

    try {
        switch (event.notice_type) {
            case 'group_increase':
                await welcomeNewMember(ctx);
                break;
            default:
                break;
        }
    } catch (e) {
        logger.error(e);
    }
}
