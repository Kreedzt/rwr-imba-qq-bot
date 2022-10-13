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

const allCommands: IRegister[] = [ServersCommandRegister, WhereIsCommandRegister, RollCommandRegister];

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
            helpText += `#${c.name}: ${c.description}\n`;
        });

        if (event.group_id) {
            await RemoteService.getInst().sendGroupMsg({
                group_id: event.group_id,
                message: `[CQ:at,qq=${event.user_id}]\n${helpText}`,
            });
        } else {
            await RemoteService.getInst().sendPrivateMsg({
                user_id: event.user_id,
                message: helpText,
            });
        }
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
        const params = getCommandParams(msg, hitCommand.defaultParams);

        const ctx: ExecCtx = {
            msg,
            params: params as ParamsType,
            env,
            event,
            reply: async (msg: string) => {
                if (event.group_id) {
                    await RemoteService.getInst().sendGroupMsg({
                        group_id: event.group_id,
                        message: `[CQ:at,qq=${event.user_id}]\n${msg}`,
                    });
                } else {
                    await RemoteService.getInst().sendPrivateMsg({
                        user_id: event.user_id,
                        message: msg,
                    });
                }
            },
        };

        await hitCommand.exec(ctx);
    }
};
