import { describe, expect, it } from 'vitest';
import { IQADataItem } from './types';
import { deleteQAData, formatQAData, getQAListRes, getQAMatchRes } from './utils';

const MOCK_DATA: IQADataItem[] = [
    {
        "q": "Question1",
        "a": "Answer1"
    },
    {
        "q": "Question2",
        "a": "Answer2"
    },
    {
        "q": "问题",
        "a": "答案1"
    },
    {
        "q": "稳定",
        "a": "答案2"
    }
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

        expect(res).toBe(`已定义的问题列表:\n\nQuestion1\nQuestion2\n问题\n稳定\n`);
    });
});

describe('qa: getQAMatchRes', () => {
    it.concurrent('query not found', () => {
        const query = 'MMMM';

        const res = getQAMatchRes(MOCK_DATA, query);

        expect(res).toBe(`未匹配到指定问题, 请尝试其他问题或联系管理员添加`);
    });

    it.concurrent('query pinyin match', () => {
        const query = 'wenti';

        const res = getQAMatchRes(MOCK_DATA, query);

        expect(res).toBe(`Q: 问题\n\nA: 答案1\n`);
    });

    it.concurrent('query multiple pinyin match', () => {
        const query = 'wen';

        const res = getQAMatchRes(MOCK_DATA, query);

        expect(res).toBe(`输入: ${query}\n找到多项相似问题, 请重新精确输入:\n\nQ: 问题\nQ: 稳定\n`);
    });

    it.concurrent('query found 1 result', () => {
        const query = 'Question1';

        const res = getQAMatchRes(MOCK_DATA, query);

        expect(res).toBe(`Q: ${query}\n\nA: Answer1\n`);
    });
});

describe('qa: deleteQAData', () => {
    it.concurrent('delete fuzzy', () => {
        const query = 'Question';

        const res = deleteQAData(MOCK_DATA, query);

        expect(res).toEqual(MOCK_DATA);
    });

    it.concurrent('delete extract', () => {
        const query = 'Question1';

        const res = deleteQAData(MOCK_DATA, query);

        expect(res).toEqual(MOCK_DATA.filter(((qa) => qa.q !== query)));
    });
});
