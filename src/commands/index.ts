import {
    ExecCtx,
    GlobalEnv,
    IRegister,
    MessageEvent,
    ParamsType,
} from '../types';
import { ServersCommandRegister, WhereIsCommandRegister } from './servers/register';
import { RollCommandRegister } from './roll/register';
import { logger } from '../logger';
import { RemoteService } from '../services';
import { getCommandParams, getFirstCommand } from '../utils';
import { checkTimeIntervalValid } from './utils';
import { SetuCommandRegister } from './setu/register';
import { TouhouCommandRegister } from './touhou/register';

const allCommands: IRegister[] = [
    ServersCommandRegister,
    WhereIsCommandRegister,
    RollCommandRegister,
    SetuCommandRegister,
    TouhouCommandRegister
];

const quickReply = async (event: MessageEvent, text: string) => {
    if (event.group_id) {
        await RemoteService.getInst().sendGroupMsg({
            group_id: event.group_id,
            message: `[CQ:at,qq=${event.user_id}]\n${text}`,
        });
    } else {
        await RemoteService.getInst().sendPrivateMsg({
            user_id: event.user_id,
            message: text,
        });
    }
}

const handlingRequestSet = new Set<number>();

export const msgHandler = async (env: GlobalEnv, event: MessageEvent) => {
    const msg = event.message;

    if (!msg.startsWith(env.START_MATCH)) {
        return;
    }

    logger.info('> MessageEvent', event);
    logger.info('> Got bot msg', msg);

    const firstCommand = getFirstCommand(msg);

    // help:
    if (firstCommand === 'help') {
        let helpText = '帮助列表: \n';

        allCommands.forEach((c) => {
            helpText += `#${c.name}: ${c.description}\n\n`;
        });

        await quickReply(event, helpText);
        return;
    }

    const hitCommand = allCommands.find((c) => c.name === firstCommand);

    if (!hitCommand) {
        return;
    }

    if (hitCommand.isAdmin && event.user_id !== env.ADMIN_QQ) {
        return;
    }

    if (firstCommand === hitCommand.name) {
        // handling... skiped re-replay
        if (handlingRequestSet.has(event.message_id)) {
            return;
        }

        try {
            handlingRequestSet.add(event.message_id);

            if (!hitCommand.isAdmin && !checkTimeIntervalValid(hitCommand, event).success) {
                await quickReply(event, '请求命令频繁, 请稍后再试');
                return;
            }
            const params = getCommandParams(msg, hitCommand.defaultParams);

            const ctx: ExecCtx = {
                msg,
                params: hitCommand.parseParams ? hitCommand.parseParams(msg) : params as ParamsType,
                env,
                event,
                reply: async (msg: string) => {
                    await quickReply(event, msg);
                },
            };

            await hitCommand.exec(ctx);
        } catch (e) {
            logger.error(e);
        } finally {
            handlingRequestSet.delete(event.message_id);
        }
    }
};
