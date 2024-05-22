import { ignoreNullChar } from '../../utils/db';

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

export const formatOutput = (data: any[]) => {
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
            row.push(ignoreNullChar(d[k].toString()));
        });
        rowData.push(row);
    });

    let output = realColumns.join('    ') + '\n';

    output += '\n';

    rowData.forEach((r) => {
        output += r.join('    ') + '\n';
    });

    return output;
};
