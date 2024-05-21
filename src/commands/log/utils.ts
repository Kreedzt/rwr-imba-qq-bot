import { ClickHouseService } from '../../services/clickHouse.service';
import { table } from 'table';

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

const sortColumns = [
    'cmd',
    'params',
    'user_id',
    'group_id',
    'received_time',
    'response_time',
    'elapse_time',
    'count',
];

export const transformSqlData2Table = (data: any[]) => {
    if (!data.length) {
        return '';
    }
    const realColumns: string[] = [];

    Object.keys(data[0])
        .sort((a, b) => {
            return sortColumns.indexOf(a) - sortColumns.indexOf(b);
        })
        .forEach((k) => {
            realColumns.push(k);
        });

    if (!realColumns.length) {
        return '';
    }

    const rowData: string[][] = [];

    data.forEach((d) => {
        const row: string[] = [];
        realColumns.forEach((k) => {
            row.push(ClickHouseService.getInst().ignoreNullChar(d[k]));
        });
        rowData.push(row);
    });

    return table([realColumns, ...rowData]);
};
