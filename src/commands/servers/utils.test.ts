import { describe, expect, it } from 'vitest';
import { OnlineServerItem } from './types';
import {
    getServerInfoDisplaySectionText,
    getServerInfoDisplayText,
    getCountColor,
    getUserInServerListDisplay,
    isServerMatchRegex,
} from './utils';

const MOCK_CT_SERVER_ITEM: OnlineServerItem = {
    name: '[Castling][Storm-7 LV4]',
    address: '221.220.172.215',
    port: 21006,
    map_id: 'media/packages/GFL_Castling/maps/map13_2',
    map_name: '',
    bots: 47,
    country: 'China',
    current_players: 19,
    version: '1.96.1',
    dedicated: true,
    mod: 1,
    player: [
        'RUMI CIVAN',
        'ASTA',
        'MR. QUIEN',
        'RYIA',
        'XZBWZ',
        'BLCOD',
        'AR.',
        'AILE ROZY',
        'D_TAIL',
        'M4SOPMOD',
        'MOYUII',
        'ZZH',
        'LEOCM',
        'SHENYANGKS',
        'ICEYKEY',
        'EAVTA',
        'JON XUE',
        'BORE',
        'EINS',
    ],
    comment:
        'Read server rules in our discord: discord.gg/wwUM3kYmRC, QQ Group: 706234535',
    url: 'https://castling.fandom.com/wiki/Castling_Wiki',
    max_players: 20,
    mode: 'Castling',
    realm: '',
    playersCount: 19,
    timeStamp: 1634176800,
};

describe('isServerMatchRegex', () => {
    it.concurrent('should return true if regex is empty', () => {
        expect(isServerMatchRegex('', MOCK_CT_SERVER_ITEM)).toBe(true);
    });

    it.concurrent('should return true if regex is empty', () => {
        expect(
            isServerMatchRegex(
                `^\\[Castling](\\[Global])?\\[[\\w!\\?]+(-\\d)?\\s(LV\\d|FOV)]`,
                MOCK_CT_SERVER_ITEM
            )
        ).toBe(true);
    });
});

describe('getServerInfoDisplayText', () => {
    it.concurrent('formatted data', () => {
        expect(getServerInfoDisplayText(MOCK_CT_SERVER_ITEM)).toBe(
            '[Castling][Storm-7 LV4]: 19/20 (map13_2)\n'
        );
    });
});

describe('getServerInfoDisplaySectionText', () => {
    it.concurrent('formatted data', () => {
        const res = getServerInfoDisplaySectionText(MOCK_CT_SERVER_ITEM);

        expect(res.serverSection).toBe('[Castling][Storm-7 LV4]: ');
        expect(res.playersSection).toBe('19/20');
        expect(res.mapSection).toBe(' (map13_2)');
    });
});

describe('getServerPlayersCountColor', () => {
    it.concurrent('100%', () => {
        expect(getCountColor(20, 20)).toBe('#ef4444');
    });

    it.concurrent('80%', () => {
        expect(getCountColor(16, 20)).toBe('#f97316');
    });

    it.concurrent('60%', () => {
        expect(getCountColor(12, 20)).toBe('#22c55e');
    });

    it.concurrent('0%', () => {
        expect(getCountColor(0, 20)).toBe('#22c55e');
    });
});

describe('getUserInServerListDisplay', () => {
    it.concurrent('no match', () => {
        const res = getUserInServerListDisplay('ABCDEFG', [
            MOCK_CT_SERVER_ITEM,
        ]);

        expect(res.results.length).toBe(0);
        expect(res.total).toBe(0);
    });

    it.concurrent('match, limited', () => {
        const res = getUserInServerListDisplay('AR', [MOCK_CT_SERVER_ITEM]);

        expect(res.results.length).toBe(1);
        expect(res.total).toBe(1);
    });

    it.concurrent('over limit', () => {
        const res = getUserInServerListDisplay('A', [MOCK_CT_SERVER_ITEM]);

        expect(res.results.length).toBe(5);
        expect(res.total).toBe(8);
    });
});
