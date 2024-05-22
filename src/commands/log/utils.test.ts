import { transformSqlData2Table } from './utils';
import { describe, expect, it } from 'vitest';

describe('transformSqlData2Table', () => {
    it.concurrent('empty array', () => {
        const data: any[] = [];

        expect(transformSqlData2Table(data)).toBe('');
    });

    it.concurrent('emtpy data', () => {
        const data = [{}];

        expect(transformSqlData2Table(data)).toBe('');
    });

    it.concurrent('2 columns, non string data type', () => {
        const data = [
            {
                cmd: 'tdollskin',
                params: 53,
            },
            {
                cmd: 'tdoll',
                params: 'm4',
            },
        ];

        expect(transformSqlData2Table(data)).toBe(`╔═══════════╤════════╗
║ cmd       │ params ║
╟───────────┼────────╢
║ tdollskin │ 53     ║
╟───────────┼────────╢
║ tdoll     │ m4     ║
╚═══════════╧════════╝
`);
    });

    it.concurrent('2 columns', () => {
        const data = [
            {
                cmd: 'tdollskin',
                params: '53',
            },
            {
                cmd: 'tdoll',
                params: 'm4',
            },
        ];

        expect(transformSqlData2Table(data)).toBe(`╔═══════════╤════════╗
║ cmd       │ params ║
╟───────────┼────────╢
║ tdollskin │ 53     ║
╟───────────┼────────╢
║ tdoll     │ m4     ║
╚═══════════╧════════╝
`);
    });

    it.concurrent('should transform sql data to table', () => {
        const data = [
            {
                cmd: 'tdollskin',
                params: 53,
                user_id: 523145043,
                group_id: 555555,
                received_time: '2024-05-21 21:30:19.661',
                response_time: '2024-05-21 21:30:19.665',
                elapse_time: 4,
            },
            {
                cmd: 'tdoll',
                params: 'm4',
                user_id: 523145043,
                group_id: 555555,
                received_time: '2024-05-21 21:30:57.768',
                response_time: '2024-05-21 21:30:57.772',
                elapse_time: 4,
            },
        ];

        expect(transformSqlData2Table(data)).toBe(
            `╔═══════════╤════════╤═══════════╤══════════╤═════════════════════════╤═════════════════════════╤═════════════╗
║ cmd       │ params │ user_id   │ group_id │ received_time           │ response_time           │ elapse_time ║
╟───────────┼────────┼───────────┼──────────┼─────────────────────────┼─────────────────────────┼─────────────╢
║ tdollskin │ 53     │ 523145043 │ 555555   │ 2024-05-21 21:30:19.661 │ 2024-05-21 21:30:19.665 │ 4           ║
╟───────────┼────────┼───────────┼──────────┼─────────────────────────┼─────────────────────────┼─────────────╢
║ tdoll     │ m4     │ 523145043 │ 555555   │ 2024-05-21 21:30:57.768 │ 2024-05-21 21:30:57.772 │ 4           ║
╚═══════════╧════════╧═══════════╧══════════╧═════════════════════════╧═════════════════════════╧═════════════╝
`
        );
    });
});
