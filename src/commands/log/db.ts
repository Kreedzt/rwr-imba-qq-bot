import { ClickHouseService } from '../../services/clickHouse.service';

export const getAllCmdLog = async () => {
    // count cmd times(limit 10)
    const res = await ClickHouseService.getInst().queryCmd(
        `SELECT cmd, count(*) as count FROM cmd_access_table GROUP BY cmd ORDER BY count DESC LIMIT 10`
    );

    return res;
};
export const getLogByCmd = async (cmd: string) => {
    // count params times by cmd(limit 10)
    const res = await ClickHouseService.getInst().queryCmd(
        `SELECT params, count(*) as count FROM cmd_access_table WHERE cmd = '${cmd}' GROUP BY params ORDER BY count DESC LIMIT 10`
    );

    return res;
};

export const getLogByUser = async (userId: number) => {
    // count cmd times by user(limit 10)
    const res = await ClickHouseService.getInst().queryCmd(
        `SELECT cmd, count(*) as count FROM cmd_access_table WHERE user_id = '${userId}' GROUP BY cmd ORDER BY count DESC LIMIT 10`
    );

    return res;
};

export const getLogByCmdAndUser = async (userId: number, cmd: string) => {
    // count params times by cmd and user(limit 10)
    const res = await ClickHouseService.getInst().queryCmd(
        `SELECT params, count(*) as count FROM cmd_access_table WHERE user_id = '${userId}' AND cmd = '${cmd}' GROUP BY params ORDER BY count DESC LIMIT 10`
    );

    return res;
};

export const getAllCmdLog7Days = async () => {
    // 查询最近7天的命令统计(limit 10)
    const res = await ClickHouseService.getInst().queryCmd(
        `SELECT cmd, count(*) as count 
         FROM cmd_access_table 
         WHERE create_time >= now() - INTERVAL 7 DAY
         GROUP BY cmd 
         ORDER BY count DESC 
         LIMIT 10`
    );
    return res;
};

export const getLogByCmd7Days = async (cmd: string) => {
    // 查询最近7天的指定命令参数统计(limit 10) 
    const res = await ClickHouseService.getInst().queryCmd(
        `SELECT params, count(*) as count 
         FROM cmd_access_table 
         WHERE cmd = '${cmd}'
         AND create_time >= now() - INTERVAL 7 DAY
         GROUP BY params 
         ORDER BY count DESC 
         LIMIT 10`
    );
    return res;
};