import { IRegister, ParamsType } from '../../types';
import { TDollSvc } from './services/tdoll.service';
import { TDollSkinSvc } from './services/tdollskin.service';
import { logger } from '../../utils/logger';
import {
    TDOLL2_OUTPUT_FILE,
    TDOLL2_SKIN_OUTPUT_FILE,
    TDOLL_SKIN_END_TEXT,
    TDOLL_SKIN_NOT_FOUND_MSG,
} from './types/constants';
import { getStaticHttpPath } from '../../utils/cmdreq';
import { CommandHelper } from './utils/commandHelper';

interface TDollConfig {
    name: string;
    alias: string;
}

class TDollCommand {
    private readonly config: TDollConfig;

    constructor(config: TDollConfig) {
        // 直接赋值即可，不需要创建新对象
        this.config = config;
    }

    private validateParams(ctx: any): Promise<boolean> {
        return CommandHelper.validateParams(ctx, 1, 2);
    }

    private getErrorMessage(): string {
        // 使用模板字符串简化拼接
        return `参数不正确, 示例:
#${this.config.name} M4A1
#${this.config.name} random (随机返回)
#${this.config.name} m4 ar (查询突击步枪)
#${this.config.name} random ar (随机突击步枪)`;
    }

    private async processQuery(
        ctx: any,
        query: string,
        query2: string
    ): Promise<string> {
        const replyText: string =
            (await CommandHelper.getTDoll2Reply(ctx, query, query2)) ?? '';
        return replyText;
    }

    public getRegisterInfo(): IRegister {
        return {
            name: this.config.name,
            alias: this.config.alias,
            description:
                '根据枪名查询数据, 支持模糊匹配, 忽略大小写及符号.[10s CD]',
            hint: [
                `按名称查询指定武器数据: #${this.config.alias} M4A1`,
                `按名称模糊查询武器数据: #${this.config.alias} m4`,
                `随机武器: #${this.config.alias} random`,
                `随机 AR 武器: #${this.config.alias} random ar`,
            ],
            timesInterval: 10,
            isAdmin: false,
            exec: async (ctx: any) => {
                try {
                    if (!(await this.validateParams(ctx))) {
                        await ctx.reply(this.getErrorMessage());
                        return;
                    }

                    const [query, query2 = ''] = CommandHelper.getQueryParams(
                        ctx.params
                    );
                    const reply = await this.processQuery(ctx, query, query2);

                    await ctx.reply(reply);
                } catch (error) {
                    console.error(
                        `[TDollCommand] Error executing command:`,
                        error
                    );
                    await ctx.reply('查询过程中发生错误，请稍后重试');
                }
            },
        };
    }
}

/**
 * 创建TDoll命令
 * @param name 命令名称
 * @param alias 命令别名
 * @returns IRegister
 */
export const createTDollCommand = (name: string, alias: string): IRegister => {
    const command = new TDollCommand({ name, alias });
    return command.getRegisterInfo();
};

export const TDollCommandRegister = createTDollCommand('tdoll', 'td');

interface TDollSkinConfig {
    name: string;
    alias: string;
}

abstract class BaseTDollSkinCommand {
    protected config: TDollSkinConfig;

    constructor(config: TDollSkinConfig) {
        this.config = config;
    }

    protected async validateInput(ctx: any): Promise<boolean> {
        if (!(await CommandHelper.validateParams(ctx, 1))) {
            await ctx.reply(`需要1个参数, 示例: #${this.config.name} 2`);
            return false;
        }
        return true;
    }

    protected async fetchData() {
        const start = Date.now();
        const [tdollData, tdollSkinData] = await Promise.all([
            TDollSvc.getData(),
            TDollSkinSvc.getData(),
        ]);

        logger.info('Fetched tdoll & tdollSkinData', {
            duration: Date.now() - start,
            tdollCount: tdollData.length,
            skinCount: Object.keys(tdollSkinData).length,
        });

        return { tdollData, tdollSkinData };
    }

    abstract processQuery(ctx: any, query: string, data: any): Promise<string>;
}

class V2TDollSkinCommand extends BaseTDollSkinCommand {
    async processQuery(
        ctx: any,
        query: string,
        { tdollData, tdollSkinData }: any
    ): Promise<string> {
        if (!(query in tdollSkinData)) {
            return TDOLL_SKIN_NOT_FOUND_MSG;
        }

        await CommandHelper.printTDollSkin2Png(
            query,
            tdollData,
            tdollSkinData,
            TDOLL2_SKIN_OUTPUT_FILE
        );

        return `[CQ:image,file=${getStaticHttpPath(
            ctx.env,
            TDOLL2_SKIN_OUTPUT_FILE
        )},cache=0,c=8]`;
    }

    getRegisterInfo(): IRegister {
        return {
            name: this.config.name,
            alias: this.config.alias,
            description:
                '根据武器编号查询皮肤数据, 需要输入一个编号参数.[10s CD]',
            hint: [`查询指定 ID 武器皮肤数据: #${this.config.name} 2`],
            timesInterval: 10,
            isAdmin: false,
            exec: async (ctx) => {
                try {
                    if (!(await this.validateInput(ctx))) return;

                    const data = await this.fetchData();
                    const [query] = CommandHelper.getQueryParams(ctx.params);
                    let replyText = await this.processQuery(ctx, query, data);

                    await ctx.reply(replyText);
                } catch (error) {
                    await CommandHelper.handleError(
                        ctx,
                        error,
                        this.config.name
                    );
                    logger.error(`${this.config.name} command failed`, {
                        error,
                        ctx,
                    });
                }
            },
        };
    }
}

export const createTDollSkinCommand = (
    name: string,
    alias: string
): IRegister => {
    const CommandClass = V2TDollSkinCommand;
    const command = new CommandClass({ name, alias });
    return command.getRegisterInfo();
};

export const TDollSkinCommandRegister = createTDollSkinCommand(
    'tdollskin',
    'ts'
);
