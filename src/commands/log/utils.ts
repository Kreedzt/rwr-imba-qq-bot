import { ClickHouseService } from '../../services/clickHouse.service';
import { table } from 'table';

export const getLogByCmd = async (cmd: string) => {
    const res = await ClickHouseService.getInst().queryCmd(
        `SELECT * FROM cmd_access WHERE cmd = '${cmd}' ORDER BY received_time DESC LIMIT 10`
    );

    return res;
};

export const transformSqlData2Table = (data: any[]) => {
    const columns = [
        'cmd',
        'params',
        'user_id',
        'group_id',
        'received_time',
        'response_time',
        'elapse_time',
    ];

    const rowData: string[][] = [];

    data.forEach((d) => {
        rowData.push([
            d.cmd,
            d.params,
            d.user_id.toString(),
            d.group_id.toString(),
            d.received_time,
            d.response_time,
            d.elapse_time.toString(),
        ]);
    });

    return table([columns, ...rowData]);
};
