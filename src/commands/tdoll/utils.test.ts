import { describe, expect, it } from 'vitest';
import { ITDollDataItem } from './types';
import { formatTDollData, getTdollDataRes } from './utils';

const MOCK_DATA: ITDollDataItem[] = [
    {
        "编号": "No.55",
        "枪名": "M4A1",
        "link": "http://www.gfwiki.org/w/M4A1#MOD3",
        "枪种": "突击步枪",
    },
    {
        "编号": "No.54",
        "枪名": "M16A1",
        "link": "http://www.gfwiki.org/w/M16A1",
        "枪种": "突击步枪",
    },
    {
        "编号": "No.53",
        "枪名": "NTW-20",
        "link": "http://www.gfwiki.org/w/NTW-20#MOD3",
        "枪种": "步枪"
    }
];

describe('tdoll: formatTdollData', () => {
    it.concurrent('test format', () => {
        const res = formatTDollData(MOCK_DATA[0]);

        expect(res).toBe(`No.55 M4A1 突击步枪\nhttp://www.gfwiki.org/w/M4A1#MOD3\n`);
    });
});

describe('tdoll: getTdollDataRes', () => {
    it.concurrent('query not found', () => {
        const query = 'MMMM';

        const res = getTdollDataRes(MOCK_DATA, query);

        expect(res).toBe(`未找到指定枪名, 请检查输入是否有误!`);
    });

    it.concurrent('query found 1 result', () => {
        const query = 'M4A1';

        const res = getTdollDataRes(MOCK_DATA, query);

        expect(res).toBe(`No.55 M4A1 突击步枪\nhttp://www.gfwiki.org/w/M4A1#MOD3\n\n最多展示 5 项结果`);
    });


    it.concurrent('query found 1 result, ignore case', () => {
        const query = 'm4a1';

        const res = getTdollDataRes(MOCK_DATA, query);

        expect(res).toBe(`No.55 M4A1 突击步枪\nhttp://www.gfwiki.org/w/M4A1#MOD3\n\n最多展示 5 项结果`);
    });

    it.concurrent('query found 1 result, ignore "-"', () => {
        const query = 'ntw20';

        const res = getTdollDataRes(MOCK_DATA, query);

        expect(res).toBe(`No.53 NTW-20 步枪\nhttp://www.gfwiki.org/w/NTW-20#MOD3\n\n最多展示 5 项结果`);
    });

    it.concurrent('query found 2 results', () => {
        const query = 'M';

        const res = getTdollDataRes(MOCK_DATA, query);

        expect(res).toBe(`No.55 M4A1 突击步枪\nhttp://www.gfwiki.org/w/M4A1#MOD3\nNo.54 M16A1 突击步枪\nhttp://www.gfwiki.org/w/M16A1\n\n最多展示 5 项结果`);
    });

    it.concurrent('query start match', () => {
        const query = '4';

        const MOCK_LOCAL_DATA: ITDollDataItem[] = [
            {
                "编号": "No.308",
                "枪名": "C14",
                "link": "http://www.gfwiki.org/w/C14",
                "枪种": "步枪",
            },
            {
                "编号": "No.291",
                "枪名": "43M",
                "link": "http://www.gfwiki.org/w/43M",
                "枪种": "冲锋枪"
            },
            {
                "编号": "No.125",
                "枪名": "MG4",
                "link": "http://www.gfwiki.org/w/MG4#MOD3",
                "枪种": "机枪",
            },
            {
                "编号": "No.94",
                "枪名": "64式",
                "link": "http://www.gfwiki.org/w/64%E5%BC%8F#MOD3",
                "枪种": "冲锋枪",
            },
            {
                "编号": "No.62",
                "枪名": "G41",
                "link": "http://www.gfwiki.org/w/G41",
                "枪种": "突击步枪",
            }
        ];

        const res = getTdollDataRes(MOCK_LOCAL_DATA, query);

        expect(res).toBe(`${formatTDollData(MOCK_LOCAL_DATA[1])
            }${formatTDollData(MOCK_LOCAL_DATA[3])}${formatTDollData(MOCK_LOCAL_DATA[4])}${formatTDollData(MOCK_LOCAL_DATA[0])}${formatTDollData(MOCK_LOCAL_DATA[2])
            }\n最多展示 5 项结果`);
    })
});