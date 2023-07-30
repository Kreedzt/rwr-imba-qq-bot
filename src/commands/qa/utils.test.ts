import { describe, expect, it } from 'vitest';
import { IQADataItem } from './types';
import { formatQAData, getQAListRes, getQAMatchRes } from './utils';

const MOCK_DATA: IQADataItem[] = [
    {
        "q": "Question1",
        "a": "Answer1"
    },
    {
        "q": "Question2",
        "a": "Answer2"
    },
];

describe('qa: formatQAData', () => {
    it.concurrent('test format', () => {
        const res = formatQAData(MOCK_DATA[0]);

        expect(res).toBe(`Q: Question1\n\nA: Answer1\n`);
    });
});

describe('qa: getQAListRes', () => {
    it.concurrent('empty', () => {
        const res = getQAListRes([]);

        expect(res).toBe(`未定义任何问答数据, 请联系管理员添加`);
    });

    it.concurrent('2 results', () => {
        const res = getQAListRes(MOCK_DATA);

        expect(res).toBe(`已定义的问题列表:\n\nQuestion1\nQuestion2\n`);
    });
});

describe('qa: getQAMatchRes', () => {
    it.concurrent('query not found', () => {
        const query = 'MMMM';

        const res = getQAMatchRes(MOCK_DATA, query);

        expect(res).toBe(`未匹配到指定问题, 请尝试其他问题或联系管理员添加`);
    });

    it.concurrent('query found 1 result', () => {
        const query = 'Question1';

        const res = getQAMatchRes(MOCK_DATA, query);

        expect(res).toBe(`Q: ${query}\n\nA: Answer1\n`);
    });
});