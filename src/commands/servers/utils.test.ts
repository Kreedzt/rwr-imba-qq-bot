import { describe, expect, it } from 'vitest';
import { OnlineServerItem } from './types';
import { isServerMatchRegex } from './utils';

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
