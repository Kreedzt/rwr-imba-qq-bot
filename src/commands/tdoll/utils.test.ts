import { describe, expect, it } from 'vitest';
import { ITDollDataItem, ITDollSkinDataItem } from './types';
import {
    formatTDollData,
    formatTDollSkinData,
    getTDollDataEndText,
    getTdollDataRes,
    getTDollSkinReplyText,
} from './utils';

const MOCK_DATA: ITDollDataItem[] = [
    {
        tileEffect1Time: '18%',
        skill1: '',
        tileEffect1: '伤害',
        baseEva: '48',
        tdollClass: 'AR',
        timeStamp: '1463702400',
        productionTime: '03:35:00',
        nameIngame: 'M4A1',
        baseAcc: '48',
        baseRate: '79',
        mod: '1',
        baseArmor: '0',
        baseAtk: '46',
        url: '/w/M4A1',
        type: '突击步枪',
        avatar: 'https://www.gfwiki.org/images/3/38/Icon_No.55.png',
        baseHp: '110',
        tileEffect2: '暴击率',
        tilesAffect: '突击步枪',
        obtainMethod: '可随主线剧情进度获得',
        tiles: '0,1,1,0,2,1,0,1,1',
        rarity: '4',
        id: '55',
        tileEffect2Time: '30%',
        modtileEffect1Time: '20%',
        modEva: '50',
        avatarMod: 'https://www.gfwiki.org/images/a/a7/Icon_No.55_Mod.png',
        modAcc: '50',
        modRate: '80',
        modAtk: '48',
        modArmor: '0',
        modRarity: '5',
        tilesAffectMod: '突击步枪',
        modHp: '113',
        modtileEffect2Time: '20%',
        tilesMod: '0,1,1,0,2,1,0,1,1',
    },
    {
        tileEffect1Time: '10%',
        skill1: '',
        tileEffect1: '伤害',
        baseEva: '44',
        tdollClass: 'AR',
        timeStamp: '1463702400',
        productionTime: '03:35:00',
        nameIngame: 'M16A1',
        baseAcc: '46',
        baseRate: '75',
        mod: '0',
        baseArmor: '0',
        baseAtk: '47',
        url: '/w/M16A1',
        type: '突击步枪',
        avatar: 'https://www.gfwiki.org/images/0/0d/Icon_No.54.png',
        baseHp: '121',
        tileEffect2: '回避',
        tilesAffect: '冲锋枪',
        obtainMethod: '可随主线剧情进度获得',
        tiles: '0,1,1,0,2,0,0,1,1',
        rarity: '4',
        id: '54',
        tileEffect2Time: '12%',
    },
    {
        tileEffect1Time: '18%',
        skill1: '',
        tileEffect1: '技能冷却速度',
        baseEva: '29',
        tdollClass: 'RF',
        timeStamp: '1463702400',
        productionTime: '04:45:00',
        nameIngame: 'NTW-20',
        baseAcc: '75',
        baseRate: '30',
        mod: '1',
        baseArmor: '0',
        baseAtk: '165',
        url: '/w/NTW-20',
        type: '步枪',
        avatar: 'https://www.gfwiki.org/images/2/2e/Icon_No.53.png',
        baseHp: '93',
        tileEffect2: '',
        tilesAffect: '手枪',
        obtainMethod:
            '可通过常规制造获取/可通过重型制造获取/可在通常战役中救援获得',
        tiles: '0,0,0,0,2,1,0,0,0',
        rarity: '5',
        id: '53',
        tileEffect2Time: '',
        modtileEffect1Time: '20%',
        modEva: '31',
        avatarMod: 'https://www.gfwiki.org/images/8/80/Icon_No.53_Mod.png',
        modAcc: '78',
        modRate: '31',
        modAtk: '170',
        modArmor: '0',
        modRarity: '6',
        tilesAffectMod: '手枪',
        modHp: '95',
        modtileEffect2Time: '',
        tilesMod: '0,0,1,0,2,1,0,0,0',
    },
];

describe('tdoll: formatTdollData', () => {
    it.concurrent('test format', () => {
        const res = formatTDollData(MOCK_DATA[0]);

        expect(res).toBe(`No.55 M4A1(mod) 突击步枪\n`);
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

        expect(res).toBe(`No.55 M4A1(mod) 突击步枪\n\n最多展示 10 项结果`);
    });

    it.concurrent('query found 1 result, ignore case', () => {
        const query = 'm4a1';

        const res = getTdollDataRes(MOCK_DATA, query);

        expect(res).toBe(`No.55 M4A1(mod) 突击步枪\n\n最多展示 10 项结果`);
    });

    it.concurrent('query found 1 result, ignore "-"', () => {
        const query = 'ntw20';

        const res = getTdollDataRes(MOCK_DATA, query);

        expect(res).toBe(`No.53 NTW-20(mod) 步枪\n\n最多展示 10 项结果`);
    });

    it.concurrent('query found 1 result, ignore "."', () => {
        const query = 'sat';

        const mockData: ITDollDataItem[] = [
            {
                tileEffect1Time: '10%',
                skill1: '',
                tileEffect1: '伤害',
                baseEva: '12',
                tdollClass: 'SG',
                timeStamp: '1505952000',
                productionTime: '08:10:00',
                nameIngame: 'S.A.T.8',
                baseAcc: '13',
                baseRate: '33',
                mod: '0',
                baseArmor: '22',
                baseAtk: '29',
                url: '/w/S.A.T.8',
                type: '霰弹枪',
                avatar: 'https://www.gfwiki.org/images/8/85/Icon_No.188.png',
                baseHp: '282',
                tileEffect2: '命中',
                tilesAffect: '机枪',
                obtainMethod: '可通过重型制造获取',
                tiles: '1,0,0,1,0,2,1,0,0',
                rarity: '5',
                id: '188',
                tileEffect2Time: '15%',
            },
        ];

        const res = getTdollDataRes(mockData, query);

        expect(res).toBe(formatTDollData(mockData[0]) + getTDollDataEndText());
    });

    it.concurrent('query found 2 results', () => {
        const query = 'M';

        const res = getTdollDataRes(MOCK_DATA, query);

        expect(res).toBe(
            `No.55 M4A1(mod) 突击步枪\nNo.54 M16A1 突击步枪\n\n最多展示 10 项结果`
        );
    });

    it.concurrent('query start match', () => {
        const query = '4';

        const MOCK_LOCAL_DATA: ITDollDataItem[] = [
            {
                tileEffect1Time: '12%',
                skill1: '',
                tileEffect1: '技能冷却速度',
                baseEva: '29',
                tdollClass: 'RF',
                timeStamp: '1592697600',
                productionTime: '04:20:00',
                nameIngame: 'C14',
                baseAcc: '77',
                baseRate: '32',
                mod: '0',
                baseArmor: '0',
                baseAtk: '128',
                url: '/w/C14',
                type: '步枪',
                avatar: 'https://www.gfwiki.org/images/1/18/Icon_No.308.png',
                baseHp: '93',
                tileEffect2: '',
                tilesAffect: '手枪',
                obtainMethod:
                    '2020年6月签到奖励/限时活动【双联乱数】中救援获得',
                tiles: '0,0,0,0,2,1,0,0,1',
                rarity: '3',
                id: '308',
                tileEffect2Time: '',
            },
            {
                tileEffect1Time: '12%',
                skill1: '',
                tileEffect1: '伤害',
                baseEva: '56',
                tdollClass: 'SMG',
                timeStamp: '1579564800',
                productionTime: '02:05:00',
                nameIngame: '43M',
                baseAcc: '13',
                baseRate: '89',
                mod: '0',
                baseArmor: '0',
                baseAtk: '30',
                url: '/w/43M',
                type: '冲锋枪',
                avatar: 'https://www.gfwiki.org/images/3/3f/Icon_No.291.png',
                baseHp: '185',
                tileEffect2: '回避',
                tilesAffect: '突击步枪',
                obtainMethod:
                    '2020年1月签到奖励/限时活动【双联乱数】中救援获得',
                tiles: '1,0,0,0,2,0,1,0,0',
                rarity: '3',
                id: '291',
                tileEffect2Time: '10%',
            },
            {
                tileEffect1Time: '12%',
                skill1: '',
                tileEffect1: '命中',
                baseEva: '34',
                tdollClass: 'MG',
                timeStamp: '1472601600',
                productionTime: '06:40:00',
                nameIngame: 'MG4',
                baseAcc: '34',
                baseRate: '139',
                mod: '1',
                baseArmor: '0',
                baseAtk: '84',
                url: '/w/MG4',
                type: '机枪',
                avatar: 'https://www.gfwiki.org/images/f/ff/Icon_No.125.png',
                baseHp: '182',
                tileEffect2: '护甲',
                tilesAffect: '霰弹枪',
                obtainMethod: '可通过常规制造获取/可通过重型制造获取',
                tiles: '0,0,1,2,0,0,0,0,1',
                rarity: '5',
                id: '125',
                tileEffect2Time: '15%',
                modtileEffect1Time: '20%',
                modEva: '35',
                avatarMod:
                    'https://www.gfwiki.org/images/e/ea/Icon_No.125_Mod.png',
                modAcc: '35',
                modRate: '140',
                modAtk: '87',
                modArmor: '0',
                modRarity: '6',
                tilesAffectMod: '霰弹枪',
                modHp: '186',
                modtileEffect2Time: '20%',
                tilesMod: '0,0,1,2,0,1,0,0,1',
            },
            {
                tileEffect1Time: '20%',
                skill1: '',
                tileEffect1: '射速',
                baseEva: '65',
                tdollClass: 'SMG',
                timeStamp: '1463702400',
                productionTime: '01:25:00',
                nameIngame: '64式',
                baseAcc: '11',
                baseRate: '93',
                mod: '1',
                baseArmor: '0',
                baseAtk: '27',
                url: '/w/64%E5%BC%8F',
                type: '冲锋枪',
                avatar: 'https://www.gfwiki.org/images/7/7a/Icon_No.94.png',
                baseHp: '176',
                tileEffect2: '',
                tilesAffect: '突击步枪',
                obtainMethod: '可通过常规制造获取/可在通常战役中救援获得',
                tiles: '0,0,0,1,2,0,0,0,0',
                rarity: '2',
                id: '94',
                tileEffect2Time: '',
                modtileEffect1Time: '24%',
                modEva: '68',
                avatarMod:
                    'https://www.gfwiki.org/images/8/86/Icon_No.94_Mod.png',
                modAcc: '11',
                modRate: '93',
                modAtk: '28',
                modArmor: '0',
                modRarity: '4',
                tilesAffectMod: '突击步枪',
                modHp: '181',
                modtileEffect2Time: '',
                tilesMod: '0,0,0,1,2,0,0,0,0',
            },
            {
                tileEffect1Time: '50%',
                skill1: '',
                tileEffect1: '命中',
                baseEva: '40',
                tdollClass: 'AR',
                timeStamp: '1463702400',
                productionTime: '04:05:00',
                nameIngame: 'G41',
                baseAcc: '48',
                baseRate: '77',
                mod: '0',
                baseArmor: '0',
                baseAtk: '50',
                url: '/w/G41',
                type: '突击步枪',
                avatar: 'https://www.gfwiki.org/images/a/ab/Icon_No.62.png',
                baseHp: '127',
                tileEffect2: '回避',
                tilesAffect: '冲锋枪',
                obtainMethod:
                    '可通过常规制造获取/可通过重型制造获取/可在通常战役中救援获得',
                tiles: '0,0,1,0,2,0,0,0,1',
                rarity: '5',
                id: '62',
                tileEffect2Time: '15%',
            },
        ];

        const res = getTdollDataRes(MOCK_LOCAL_DATA, query);

        expect(res).toBe(
            `${formatTDollData(MOCK_LOCAL_DATA[1])}${formatTDollData(
                MOCK_LOCAL_DATA[3]
            )}${formatTDollData(MOCK_LOCAL_DATA[4])}${formatTDollData(
                MOCK_LOCAL_DATA[0]
            )}${formatTDollData(MOCK_LOCAL_DATA[2])}\n最多展示 10 项结果`
        );
    });
});

const MOCK_SKIN_DATA: Record<string, ITDollSkinDataItem> = {
    '1': [
        {
            index: 0,
            title: '默认Q版',
            value: '0',
        },
        {
            index: 1,
            title: '心智升级',
            value: 'mod',
        },
        {
            index: 2,
            title: '直达星星的愿望',
            value: '301',
        },
        {
            index: 3,
            title: '奇迹女王',
            value: '2105',
        },
    ],
    '2': [
        {
            index: 0,
            title: '默认Q版',
            value: '0',
        },
        {
            index: 1,
            title: '心智升级',
            value: 'mod',
        },
        {
            index: 2,
            title: '天空的击破者',
            value: '4514',
        },
    ],
    '3': [
        {
            index: 0,
            title: '默认Q版',
            value: '0',
        },
    ],
};

describe('tdollskin: getTdollSkinDataRes', () => {
    it.concurrent('query not found', () => {
        const query = '8';

        const res = getTDollSkinReplyText(query, [], MOCK_SKIN_DATA);

        expect(res).toBe('未找到指定人形编号的皮肤, 请检查输入是否有误!');
    });

    it.concurrent('query found result', () => {
        const query = '2';

        const res = getTDollSkinReplyText(query, [], MOCK_SKIN_DATA);

        expect(res).toBe(formatTDollSkinData(query, [], MOCK_SKIN_DATA[query]));
    });

    it.concurrent('query display text', () => {
        const query = '53';

        const res = getTDollSkinReplyText(query, MOCK_DATA, {
            '53': [
                {
                    index: 0,
                    title: '默认Q版',
                    value: '0',
                },
                {
                    index: 1,
                    title: '心智升级',
                    value: 'mod',
                },
            ],
        });

        expect(res).toBe(`No.53 NTW-20 \n1. 默认Q版 ID:0\n2. 心智升级 ID:mod\n`);
    });
});
