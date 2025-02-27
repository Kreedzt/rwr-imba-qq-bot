import * as fs from 'fs';
import * as path from 'path';
import { CronJob } from 'cron';
import { GlobalEnv } from '../../../types';
import { countTotalPlayers, queryAllServers } from '../utils/utils';
import { logger } from '../../../utils/logger';
import { IAnalysisData } from '../types/types';
import { ANALYSIS_HOURS_DATA_FILE, OUTPUT_FOLDER } from '../types/constants';

export class AnalysticsHoursTask {
    // 2 分钟更新一次
    // static readonly timesInterval = 2 * 60 * 1000;
    static readonly timesInterval = '0 */2 * * * *';
    static job: null | CronJob = null;

    static isRunning = false;
    static isUpdating = false;

    static write(data: IAnalysisData) {
        const folderTarget = path.join(process.cwd(), OUTPUT_FOLDER);
        const writeTarget = path.join(
            folderTarget,
            `./${ANALYSIS_HOURS_DATA_FILE}`
        );
        logger.info('AnalysticsHoursTask::write() target:', writeTarget);
        if (!fs.existsSync(writeTarget)) {
            if (!fs.existsSync(folderTarget)) {
                fs.mkdirSync(folderTarget);
            }
            fs.writeFileSync(writeTarget, JSON.stringify([data]), 'utf-8');
            return;
        }
        const recordValue = JSON.parse(
            fs.readFileSync(writeTarget, 'utf-8')
        ) as IAnalysisData[];

        let newRecordValue = recordValue;
        const lastValue =
            recordValue.length === 0
                ? null
                : recordValue[recordValue.length - 1];

        // 最后一项为当前时间
        if (lastValue && lastValue.date === data.date) {
            // 且统计 < 当前统计, 则更新
            if (lastValue.count < data.count) {
                newRecordValue = [...recordValue.slice(0, -1), data];
            }
        } else if (recordValue.length === 24) {
            newRecordValue = [...recordValue.slice(1), data];
        } else {
            newRecordValue = [...recordValue, data];
        }

        // 更新写入
        try {
            fs.writeFileSync(
                writeTarget,
                JSON.stringify(newRecordValue),
                'utf-8'
            );
        } catch (e: any) {
            logger.error('AnalysticsHoursTask write error', e);
        }
    }

    static async updateCount(env: GlobalEnv) {
        logger.info('AnalysticsHoursTask::updateCount(): start');
        if (AnalysticsHoursTask.isUpdating) {
            return;
        }
        AnalysticsHoursTask.isUpdating = true;
        try {
            const serverList = await queryAllServers(env.SERVERS_MATCH_REGEX);
            const playersCount = countTotalPlayers(serverList);

            const date = new Date();
            const dateStr = `${date.getHours()}时`;
            logger.info(
                'AnalysticsHoursTask updateCount',
                dateStr,
                playersCount
            );
            AnalysticsHoursTask.write({
                date: dateStr,
                count: playersCount,
            });
        } catch (e) {
            logger.error('AnalysticsHoursTask updateCount error', e);
        }

        AnalysticsHoursTask.isUpdating = false;
        logger.info('AnalysticsHoursTask updateCount:: completed');
    }

    static start(env: GlobalEnv) {
        logger.info('AnalysticsHoursTask::start()');
        if (this.isRunning) {
            return;
        }
        // 立即调用一次
        AnalysticsHoursTask.updateCount(env);

        AnalysticsHoursTask.job = new CronJob(
            AnalysticsHoursTask.timesInterval,
            () => {
                AnalysticsHoursTask.isRunning = true;
                AnalysticsHoursTask.updateCount(env);
            },
            null,
            true,
            'Asia/Shanghai'
        );
    }
}
