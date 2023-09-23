import * as fs from 'fs';
import * as path from 'path';
import { GlobalEnv } from '../../types';
import { countTotalPlayers, queryAllServers } from './utils';
import { logger } from '../../logger';
import { IAnalysisData } from './types';
import { ANALYSIS_DATA_FILE, OUTPUT_FOLDER } from './constants';

export class AnalysticsTask {
    // 10 分钟更新一次
    static readonly timesInterval = 60 * 1000;

    static isRunning = false;
    static isUpdating = false;

    static write(data: IAnalysisData) {
        const writeTarget = path.join(
            process.cwd(),
            OUTPUT_FOLDER,
            `./${ANALYSIS_DATA_FILE}`
        );
        if (!fs.existsSync(writeTarget)) {
            fs.writeFileSync(writeTarget, JSON.stringify([data]), 'utf-8');
            return;
        }
        const recordValue = JSON.parse(
            fs.readFileSync(writeTarget, 'utf-8')
        ) as IAnalysisData[];

        // 统计最近 7 天 数据, 检查日期是否已经存在
        const isFoundTodayValue = recordValue.find((v) => v.date === data.date);

        // 若存在本日数据, 取最高值
        if (isFoundTodayValue) {
            if (data.count > isFoundTodayValue.count) {
                isFoundTodayValue.count = data.count;
            }
            // 不存在本日数据, 仅做长度判断
        } else {
            recordValue.push(data);
            if (recordValue.length > 7) {
                recordValue.shift();
            }
        }

        // 更新写入
        try {
            fs.writeFileSync(writeTarget, JSON.stringify(recordValue), 'utf-8');
        } catch (e: any) {
            // FIXME: temp fix
            if (e?.code === 'ENOENT') {
                fs.writeFileSync(writeTarget, JSON.stringify([data]), 'utf-8');
                return;
            }
            logger.error('AnalysticsTask write error', e);
        }
    }

    static async updateCount(env: GlobalEnv) {
        logger.info('AnalysticsTask::updateCount(): start');
        if (AnalysticsTask.isUpdating) {
            return;
        }
        AnalysticsTask.isUpdating = true;
        try {
            const serverList = await queryAllServers(env.SERVERS_MATCH_REGEX);
            const playersCount = countTotalPlayers(serverList);

            const date = new Date();
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            logger.info('AnalysticsTask updateCount', dateStr, playersCount);
            AnalysticsTask.write({
                date: dateStr,
                count: playersCount,
            });
        } catch (e) {
            logger.error('AnalysticsTask updateCount error', e);
        }

        AnalysticsTask.isUpdating = false;
        logger.info('AnalysticsTask updateCount:: completed');
    }

    static start(env: GlobalEnv) {
        logger.info('AnalysticsTask::start()');
        if (this.isRunning) {
            return;
        }
        // 立即调用一次
        AnalysticsTask.updateCount(env);
        setInterval(() => {
            AnalysticsTask.isRunning = true;
            AnalysticsTask.updateCount(env);
        }, AnalysticsTask.timesInterval);
    }
}
