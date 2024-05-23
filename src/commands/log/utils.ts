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

export const formatOutput = (data: any[], key: string, title: string) => {
    let output = title + '\n';
    if (!data.length) {
        output += '无数据';
        return output;
    }

    data.forEach((d, index) => {
        if (!d[key]) {
            return;
        }
        const label = ignoreNullChar(d[key].toString());
        output += `${index + 1}. ${label} 次数:${d.count}\n`;
    });

    return output;
};
