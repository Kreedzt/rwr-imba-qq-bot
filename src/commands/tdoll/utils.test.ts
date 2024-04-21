import { describe, expect, it } from 'vitest';
import { ITDollDataItem, ITDollSkinDataItem } from './types';
import {
    formatTDollData,
    formatTDollSkinData,
    getRandomTDollData,
    getTDollDataEndText,
    getTDollDataRes,
    getTDollDataWithCategoryRes,
    getTDollSkinReplyText,
} from './utils';
import { TDollCategoryEnum } from './enums';

const MOCK_DATA: ITDollDataItem[] = [
    {
        tileEffect1Time: '18%',
        skill1: '',
        tileEffect1: '伤害',
        baseEva: '48',
        tdollClass: TDollCategoryEnum.AR,
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
        tdollClass: TDollCategoryEnum.AR,
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
        tdollClass: TDollCategoryEnum.RF,
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

        expect(res).toBe(
            `No.55 M4A1(mod) 突击步枪\n[CQ:image,file=https://www.gfwiki.org/images/3/38/Icon_No.55.png,cache=0][CQ:image,file=https://www.gfwiki.org/images/a/a7/Icon_No.55_Mod.png,cache=0]`
        );
    });
});

describe('tdoll: getTdollDataRes', () => {
    it.concurrent('query not found', () => {
        const query = 'MMMM';

        const res = getTDollDataRes(MOCK_DATA, query);

        expect(res).toBe(`未找到指定枪名, 请检查输入是否有误!`);
    });

    it.concurrent('query found 1 result, without mod', () => {
        const query = 'M16A1';

        const res = getTDollDataRes(MOCK_DATA, query);

        expect(res).toBe(
            `No.54 M16A1 突击步枪\n[CQ:image,file=https://www.gfwiki.org/images/0/0d/Icon_No.54.png,cache=0]\n(共1项)最多展示 10 项结果`
        );
    });

    it.concurrent('query found 1 result with mod', () => {
        const query = 'M4A1';

        const res = getTDollDataRes(MOCK_DATA, query);

        expect(res).toBe(
            `No.55 M4A1(mod) 突击步枪\n[CQ:image,file=https://www.gfwiki.org/images/3/38/Icon_No.55.png,cache=0][CQ:image,file=https://www.gfwiki.org/images/a/a7/Icon_No.55_Mod.png,cache=0]\n(共1项)最多展示 10 项结果`
        );
    });

    it.concurrent('query found 1 result, ignore case', () => {
        const query = 'm4a1';

        const res = getTDollDataRes(MOCK_DATA, query);

        expect(res).toBe(
            `No.55 M4A1(mod) 突击步枪\n[CQ:image,file=https://www.gfwiki.org/images/3/38/Icon_No.55.png,cache=0][CQ:image,file=https://www.gfwiki.org/images/a/a7/Icon_No.55_Mod.png,cache=0]\n(共1项)最多展示 10 项结果`
        );
    });

    it.concurrent('query found 1 result, ignore "-"', () => {
        const query = 'ntw20';

        const res = getTDollDataRes(MOCK_DATA, query);

        expect(res).toBe(
            `No.53 NTW-20(mod) 步枪\n[CQ:image,file=https://www.gfwiki.org/images/2/2e/Icon_No.53.png,cache=0][CQ:image,file=https://www.gfwiki.org/images/8/80/Icon_No.53_Mod.png,cache=0]\n(共1项)最多展示 10 项结果`
        );
    });

    it.concurrent('query found 1 result, ignore "."', () => {
        const query = 'sat';

        const mockData: ITDollDataItem[] = [
            {
                tileEffect1Time: '10%',
                skill1: '',
                tileEffect1: '伤害',
                baseEva: '12',
                tdollClass: TDollCategoryEnum.SG,
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

        const res = getTDollDataRes(mockData, query);

        expect(res).toBe(formatTDollData(mockData[0]) + getTDollDataEndText(1));
    });

    it.concurrent('query found 2 results', () => {
        const query = 'M';

        const res = getTDollDataRes(MOCK_DATA, query);

        expect(res).toBe(
            `No.55 M4A1(mod) 突击步枪\n[CQ:image,file=https://www.gfwiki.org/images/3/38/Icon_No.55.png,cache=0][CQ:image,file=https://www.gfwiki.org/images/a/a7/Icon_No.55_Mod.png,cache=0]\nNo.54 M16A1 突击步枪\n[CQ:image,file=https://www.gfwiki.org/images/0/0d/Icon_No.54.png,cache=0]\n(共2项)最多展示 10 项结果`
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
                tdollClass: TDollCategoryEnum.RF,
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
                tdollClass: TDollCategoryEnum.SMG,
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
                tdollClass: TDollCategoryEnum.MG,
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
                tdollClass: TDollCategoryEnum.SMG,
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
                tdollClass: TDollCategoryEnum.AR,
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

        const res = getTDollDataRes(MOCK_LOCAL_DATA, query);

        expect(res).toBe(
            `${formatTDollData(MOCK_LOCAL_DATA[1])}\n${formatTDollData(
                MOCK_LOCAL_DATA[3]
            )}\n${formatTDollData(MOCK_LOCAL_DATA[4])}\n${formatTDollData(
                MOCK_LOCAL_DATA[0]
            )}\n${formatTDollData(
                MOCK_LOCAL_DATA[2]
            )}\n(共5项)最多展示 10 项结果`
        );
    });
});

describe('tdoll: getRandomTDollData', () => {
    it.concurrent('random result', () => {
        const res = getRandomTDollData(MOCK_DATA);

        expect(MOCK_DATA.map(formatTDollData)).toContainEqual(res);
    });
});

describe('tdoll: getTDollDataWithCategoryRes', () => {
    it.concurrent('query found 1 result', () => {
        const res = getTDollDataWithCategoryRes(MOCK_DATA, 'AR', 'm4');

        expect(res).toBe(
            `No.55 M4A1(mod) 突击步枪\n[CQ:image,file=https://www.gfwiki.org/images/3/38/Icon_No.55.png,cache=0][CQ:image,file=https://www.gfwiki.org/images/a/a7/Icon_No.55_Mod.png,cache=0]\n(共1项)最多展示 10 项结果`
        );
    });

    it.concurrent('query found 1 result, ignore case', () => {
        const res = getTDollDataWithCategoryRes(MOCK_DATA, 'ar', 'm4');

        expect(res).toBe(
            `No.55 M4A1(mod) 突击步枪\n[CQ:image,file=https://www.gfwiki.org/images/3/38/Icon_No.55.png,cache=0][CQ:image,file=https://www.gfwiki.org/images/a/a7/Icon_No.55_Mod.png,cache=0]\n(共1项)最多展示 10 项结果`
        );
    });

    it.concurrent('query found 1 result, switch param index', () => {
        const res = getTDollDataWithCategoryRes(MOCK_DATA, 'm4', 'AR');

        expect(res).toBe(
            `No.55 M4A1(mod) 突击步枪\n[CQ:image,file=https://www.gfwiki.org/images/3/38/Icon_No.55.png,cache=0][CQ:image,file=https://www.gfwiki.org/images/a/a7/Icon_No.55_Mod.png,cache=0]\n(共1项)最多展示 10 项结果`
        );
    });

    it.concurrent('query found 1 result by chinese category', () => {
        const res = getTDollDataWithCategoryRes(MOCK_DATA, '突击步枪', 'm4');

        expect(res).toBe(
            `No.55 M4A1(mod) 突击步枪\n[CQ:image,file=https://www.gfwiki.org/images/3/38/Icon_No.55.png,cache=0][CQ:image,file=https://www.gfwiki.org/images/a/a7/Icon_No.55_Mod.png,cache=0]\n(共1项)最多展示 10 项结果`
        );
    });

    it.concurrent('error category', () => {
        const res = getTDollDataWithCategoryRes(MOCK_DATA, 'AX', 'm4');

        expect(res).toBe('未找到指定枪种分类, 请检查输入是否有误!');
    });

    it.concurrent('query found 0 result', () => {
        const res = getTDollDataWithCategoryRes(MOCK_DATA, 'AR', 'm11111');

        expect(res).toBe('未找到指定枪名, 请检查输入是否有误!');
    });

    it.concurrent('query found 2 results', () => {
        const res = getTDollDataWithCategoryRes(MOCK_DATA, 'AR', 'M');

        expect(res).toBe(
            `No.55 M4A1(mod) 突击步枪\n[CQ:image,file=https://www.gfwiki.org/images/3/38/Icon_No.55.png,cache=0][CQ:image,file=https://www.gfwiki.org/images/a/a7/Icon_No.55_Mod.png,cache=0]\nNo.54 M16A1 突击步枪\n[CQ:image,file=https://www.gfwiki.org/images/0/0d/Icon_No.54.png,cache=0]\n(共2项)最多展示 10 项结果`
        );
    });
});

const MOCK_SKIN_DATA: Record<string, ITDollSkinDataItem> = {
    '1': [
        {
            index: 0,
            title: '默认Q版',
            value: '0',
            image: {
                anime: '0',
                line: '指挥官，是您在叫我嘛？您这里有可乐吗！有很多很多的可乐么！',
                name: '默认立绘',
                pic: 'https://www.gfwiki.org/images/7/7f/Pic_M1873_HD.png',
                pic_d: 'https://www.gfwiki.org/images/3/3b/Pic_M1873_D_HD.png',
                pic_d_h: '',
                pic_h: '',
            },
        },
        {
            index: 1,
            title: '心智升级',
            value: 'mod',
            image: {
                anime: '0',
                line: '指挥官，是您在叫我嘛？您这里有可乐吗！有很多很多的可乐么！',
                name: '心智升级',
                pic: 'https://www.gfwiki.org/images/6/62/Pic_M1873Mod_HD.png',
                pic_d: 'https://www.gfwiki.org/images/d/d5/Pic_M1873Mod_D_HD.png',
                pic_d_h: '',
                pic_h: '',
            },
        },
        {
            index: 2,
            title: '直达星星的愿望',
            value: '301',
            image: {
                anime: '0',
                line: '圣诞快乐！圣诞树真是漂亮啊！',
                name: '直达星星的愿望',
                pic: 'https://www.gfwiki.org/images/e/e5/Pic_M1873_301_HD.png',
                pic_d: 'https://www.gfwiki.org/images/c/c1/Pic_M1873_301_D_HD.png',
                pic_d_h:
                    'https://www.gfwiki.org/images/1/14/Pic_M1873_301_D_HX_HD.png',
                pic_h: 'https://www.gfwiki.org/images/f/f0/Pic_M1873_301_HX_HD.png',
            },
        },
        {
            index: 3,
            title: '奇迹女王',
            value: '2105',
            image: {
                anime: '0',
                line: '大家！举起你们手中的可乐！为今晚降临的奇迹干杯吧！',
                name: '奇迹女王',
                pic: 'https://www.gfwiki.org/images/1/10/Pic_M1873_2105_HD.png',
                pic_d: 'https://www.gfwiki.org/images/d/d9/Pic_M1873_2105_D_HD.png',
                pic_d_h: '',
                pic_h: '',
            },
        },
    ],
    '2': [
        {
            index: 0,
            title: '默认Q版',
            value: '0',
            image: {
                anime: '0',
                line: '真是宿命的邂逅呢，指挥官，没想到会在这里遇到您。',
                name: '默认立绘',
                pic: 'https://www.gfwiki.org/images/a/a6/Pic_M1911_HD.png',
                pic_d: 'https://www.gfwiki.org/images/c/cf/Pic_M1911_D_HD.png',
                pic_d_h:
                    'https://www.gfwiki.org/images/c/c4/Pic_M1911_D_HX_HD.png',
                pic_h: 'https://www.gfwiki.org/images/9/92/Pic_M1911_HX_HD.png',
            },
        },
        {
            index: 1,
            title: '心智升级',
            value: 'mod',
            image: {
                anime: '0',
                line: '真是宿命的邂逅呢，指挥官，没想到会在这里遇到您。',
                name: '心智升级',
                pic: 'https://www.gfwiki.org/images/2/2b/Pic_M1911Mod_HD.png',
                pic_d: 'https://www.gfwiki.org/images/b/be/Pic_M1911Mod_D_HD.png',
                pic_d_h:
                    'https://www.gfwiki.org/images/d/da/Pic_M1911Mod_D_HX_HD.png',
                pic_h: 'https://www.gfwiki.org/images/1/12/Pic_M1911Mod_HX_HD.png',
            },
        },
        {
            index: 2,
            title: '天空的击破者',
            value: '4514',
            image: {
                anime: '0',
                line: '人形不会哭泣，那是上天赐予人类的礼物。若人形有爱的话，就让我击破天空，下一场雨送给你吧。',
                name: '天空的击破者',
                pic: 'https://www.gfwiki.org/images/1/11/Pic_M1911_4514_HD.png',
                pic_d: 'https://www.gfwiki.org/images/9/9c/Pic_M1911_4514_D_HD.png',
                pic_d_h:
                    'https://www.gfwiki.org/images/2/2f/Pic_M1911_4514_D_HX_HD.png',
                pic_h: 'https://www.gfwiki.org/images/a/a6/Pic_M1911_4514_HX_HD.png',
            },
        },
    ],
    '3': [
        {
            index: 0,
            title: '默认Q版',
            value: '0',
            image: {
                anime: '0',
                line: 'M9手枪！我可是很有人气的，请记住我吧！',
                name: '默认立绘',
                pic: 'https://www.gfwiki.org/images/f/f7/Pic_M9_HD.png',
                pic_d: 'https://www.gfwiki.org/images/4/45/Pic_M9_D_HD.png',
                pic_d_h: '',
                pic_h: '',
            },
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
                    image: {
                        anime: '0',
                        line: 'NTW-20狙击步枪，就算是钢铁，我也会贯穿给你看！',
                        name: '默认立绘',
                        pic: 'https://www.gfwiki.org/images/1/1d/Pic_NTW20_HD.png',
                        pic_d: 'https://www.gfwiki.org/images/3/34/Pic_NTW20_D_HD.png',
                        pic_d_h: '',
                        pic_h: '',
                    },
                },
                {
                    index: 1,
                    title: '心智升级',
                    value: 'mod',
                    image: {
                        anime: '0',
                        line: 'NTW-20狙击步枪，就算是钢铁，我也会贯穿给你看！',
                        name: '心智升级',
                        pic: 'https://www.gfwiki.org/images/7/76/Pic_NTW20Mod_HD.png',
                        pic_d: 'https://www.gfwiki.org/images/7/79/Pic_NTW20Mod_D_HD.png',
                        pic_d_h: '',
                        pic_h: '',
                    },
                },
            ],
        });

        expect(res).toBe(
            `No.53 NTW-20 \n[CQ:image,file=https://www.gfwiki.org/images/2/2e/Icon_No.53.png,cache=0]\n1. 默认Q版 ID:0\n[CQ:image,file=https://www.gfwiki.org/images/1/1d/Pic_NTW20_HD.png,cache=0]\n2. 心智升级 ID:mod\n[CQ:image,file=https://www.gfwiki.org/images/7/76/Pic_NTW20Mod_HD.png,cache=0]\n`
        );
    });
});
