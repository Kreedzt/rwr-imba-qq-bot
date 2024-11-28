import {
    MsgExecCtx,
    GlobalEnv,
    IRegister,
    MessageEvent,
    ParamsType,
} from '../types';
import {
    AnalyticsCommandRegister,
    MapsCommandRegister,
    ServersCommandRegister,
    WhereIsCommandRegister,
    PlayersCommandRegister,
} from './servers/register';
import { RollCommandRegister } from './roll/register';
import { logger } from '../utils/logger';
import { RemoteService } from '../services/remote.service';
import {
    getCommandParams,
    getFirstCommand,
    parseIgnoreSpace,
} from '../utils/cmd';
import { checkTimeIntervalValid } from '../utils/cmdreq';
import { FuckCommandRegister } from './fuck/register';
import { SetuCommandRegister } from './setu/register';
import { TouhouCommandRegister } from './touhou/register';
import { WaifuCommandRegister } from './waifu/registers';
import { OnePtCommandRegister } from './1pt/register';
import { NekoCommandRegister } from './neko/register';
import { WebsiteCommandRegister } from './website/register';
import {
    TDollCommandRegister,
    TDollSkinCommandRegister,
} from './tdoll/register';
import {
    QACommandRegister,
    QADefineCommandRegister,
    QADeleteCommandRegister,
} from './qa/register';
import { VersionCommandRegister } from './version/register';
import { LogCommandRegister, LogSelfRegister } from './log/register';
import { AiCommandRegister } from './ai/register';
import { ClickHouseService } from '../services/clickHouse.service';

const allCommands: IRegister[] = [
    FuckCommandRegister,
    ServersCommandRegister,
    WhereIsCommandRegister,
    AnalyticsCommandRegister,
    MapsCommandRegister,
    PlayersCommandRegister,
    RollCommandRegister,
    SetuCommandRegister,
    TouhouCommandRegister,
    WaifuCommandRegister,
    OnePtCommandRegister,
    NekoCommandRegister,
    WebsiteCommandRegister,
    TDollCommandRegister,
    TDollSkinCommandRegister,
    QACommandRegister,
    QADefineCommandRegister,
    QADeleteCommandRegister,
    VersionCommandRegister,
    LogCommandRegister,
    LogSelfRegister,
    AiCommandRegister,
];

export const initCommands = async (env: GlobalEnv) => {
    await Promise.all(
        allCommands
            .filter((cmd) => {
                if (env.ACTIVE_COMMANDS) {
                    return env.ACTIVE_COMMANDS.includes(cmd.name);
                }
            })
            .map(async (cmd) => {
                await cmd.init?.(env);
            })
    );
};

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
};

const handlingRequestSet = new Set<number>();
const activeCommandSet = new Set<string>();

export const msgHandler = async (env: GlobalEnv, event: MessageEvent) => {
    const msg = event.message;

    if (!msg.startsWith(env.START_MATCH)) {
        return;
    }

    if (event.group_id && event.group_id !== +env.LISTEN_GROUP) {
        return;
    }

    logger.info('> MessageEvent', event);
    logger.info('> Got bot msg', msg);

    const firstCommand = getFirstCommand(msg);

    /**
     * Generate activeCommandSet
     */
    env.ACTIVE_COMMANDS.forEach((c) => {
        activeCommandSet.add(c);
    });

    const avaliableCommands = allCommands.filter((c) =>
        activeCommandSet.has(c.name)
    );

    // help:
    if (firstCommand === 'help' || firstCommand === 'h') {
        const params = parseIgnoreSpace(['#help', '#h'], msg);

        let query = '';
        params.forEach((v, k) => {
            if (!query) {
                query = k;
            }
        });

        // spec cmd help
        let helpText = '';

        if (query) {
            const hitCommand = avaliableCommands.find(
                (c) => c.name === query || c.alias === query
            );

            if (hitCommand) {
                helpText = `#${hitCommand.name}(${hitCommand.alias}): 帮助列表\n\n`;

                hitCommand.hint?.forEach((h) => {
                    helpText += `${h}\n\n`;
                });
            } else {
                helpText = '未找到对应命令\n';
            }
        } else {
            helpText = '帮助列表: \n';

            avaliableCommands
                .filter((c) => {
                    if (
                        c.isAdmin &&
                        !env.ADMIN_QQ_LIST.some((qq) => event.user_id === qq)
                    ) {
                        return false;
                    }

                    return true;
                })
                .forEach((c) => {
                    helpText += `#${c.name}${c.alias ? `(${c.alias})` : ''}: ${
                        c.description
                    }\n\n`;
                });
        }

        await quickReply(event, helpText);
        return;
    }

    const hitCommand = avaliableCommands.find(
        (c) => c.name === firstCommand || c.alias === firstCommand
    );

    if (!hitCommand) {
        return;
    }

    if (
        hitCommand.isAdmin &&
        !env.ADMIN_QQ_LIST.some((qq) => event.user_id === qq)
    ) {
        return;
    }

    const isAdminUser = env.ADMIN_QQ_LIST.some((qq) => event.user_id === qq);

    if (firstCommand === hitCommand.name || firstCommand === hitCommand.alias) {
        // handling... skiped re-replay
        if (handlingRequestSet.has(event.message_id)) {
            return;
        }

        try {
            handlingRequestSet.add(event.message_id);

            const timeIntervalRes = checkTimeIntervalValid(hitCommand, event);
            if (
                !isAdminUser &&
                !hitCommand.isAdmin &&
                !timeIntervalRes.success
            ) {
                // seconds
                const diffs = timeIntervalRes.amount! / 1000;
                // ms
                const diffMs = timeIntervalRes.amount! % 1000;
                await quickReply(
                    event,
                    `账号被风控或请求命令频繁, 请稍后再试, CD 剩余${diffs}.${diffMs}s`
                );
                return;
            }
            const start = Date.now();
            const startDate = new Date();
            const params = getCommandParams(msg, hitCommand.defaultParams);

            const ctx: MsgExecCtx = {
                msg,
                params: hitCommand.parseParams
                    ? hitCommand.parseParams(msg)
                    : (params as ParamsType),
                env,
                event,
                reply: async (msg: string) => {
                    await quickReply(event, msg);
                },
            };

            await hitCommand.exec(ctx);
            const end = Date.now();
            const endDate = new Date();
            const diff = end - start;

            const paramsList: string[] = [];
            ctx.params.forEach((v, k) => {
                paramsList.push(k);
            });

            const stringParams = paramsList.join(' ');

            if (process.env.CLICKHOUSE_HOST) {
                ClickHouseService.getInst()
                    .insertCmdData({
                        cmd: hitCommand.name,
                        params: stringParams,
                        user_id: event.user_id,
                        group_id: event.group_id,
                        received_time: startDate,
                        response_time: endDate,
                        elapse_time: diff,
                    })
                    .catch((err) => {
                        logger.error('insertCmdData error', err);
                    });
            }
        } catch (e) {
            await quickReply(event, '命令执行失败, 请检查日志');
            logger.error(e);
        } finally {
            handlingRequestSet.delete(event.message_id);
        }
    }
};
