import { formatOutput } from './utils';
import { describe, expect, it } from 'vitest';

describe('transformSqlData2Table', () => {
    it.concurrent('empty title', () => {
        const data: any[] = [
            {
                cmd: 'tdollskin',
                count: 2,
            },
            {
                cmd: 'tdoll',
                count: 1,
            },
        ];

        expect(formatOutput(data, 'cmd', '')).toBe(
            '\n1. tdollskin 次数:2\n2. tdoll 次数:1\n'
        );
    });
    it.concurrent('empty title and data', () => {
        const data: any[] = [];

        expect(formatOutput(data, '', '')).toBe('\n' + '无数据');
    });

    it.concurrent('wrong data', () => {
        const data = [{}];

        expect(formatOutput(data, '', 'Title')).toBe('Title\n');
    });

    it.concurrent('2 columns, non string data type', () => {
        const data = [
            {
                cmd: 'tdollskin',
                count: 2,
            },
            {
                cmd: 'tdoll',
                count: 1,
            },
        ];

        expect(formatOutput(data, 'cmd', '命令使用次数统计Top2')).toBe(
            `命令使用次数统计Top2
1. tdollskin 次数:2
2. tdoll 次数:1
`
        );
    });
});
