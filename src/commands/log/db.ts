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
        `SELECT params, count(*) as count FROM cmd_access_table WHERE cmd = '${cmd}' GROUP_BY params ORDER BY count DESC LIMIT 10`
    );

    return res;
};
