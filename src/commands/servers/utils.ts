import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import type { Nullable } from '../../types';
import { logger } from '../../logger';
import type { Res, ResServerItem, OnlineServerItem } from './types';
import { MATCH_REGEX, QUERY_USER_IN_SERVERS_LIMIT } from './constants';

const SERVER_API_URL = 'http://rwr.runningwithrifles.com/rwr_server_list';

const axiosInst = axios.create({
    timeout: 1500,
});

/**
 * Get players list string array
 * @param server server item
 * @returns player list
 */
const getCorrectPlayersList = (server: ResServerItem): string[] => {
    if (!server.player) {
        return [];
    }

    const playersArray = Array.isArray(server.player)
        ? server.player
        : [server.player];

    // force to string array
    return playersArray.map((p) => p.toString());
};

/**
 * Send Http Request, get server list xml raw string
 * @param params query params
 * @returns server list raw xml string
 */
const queryServersRaw = async (params: {
    start: number;
    size: number;
    names: 1 | 0;
}) => {
    const queryParams = {
        start: params.start ?? 0,
        size: params.size ?? 20,
        names: params.names ?? 1,
    };

    const url = `${SERVER_API_URL}/get_server_list.php?start=${queryParams.start}&size=${queryParams.size}&names=${queryParams.names}`;

    const res = await axiosInst.get(url, {
        responseType: 'text',
    });
    return res.data;
};

/**
 * Parse xml raw string to server list
 * @param resString server list raw xml string
 * @returns parsed server list
 */
export const parseServerListFromString = (
    resString: string
): OnlineServerItem[] => {
    const parser = new XMLParser();
    const res = parser.parse(resString) as Res;

    return res.result.server.map((s) => ({
        ...s,
        playersCount: getCorrectPlayersList(s).length,
    }));
};

/**
 * Get Joinable steam open url
 * @param server serverItem
 * @returns joinable steam open url
 */
export const getJoinServerUrl = (server: OnlineServerItem): string => {
    const str = `steam://rungameid/270150//server_address=${server.address}%20server_port=${server.port}`;
    return str;
};

/**
 * Get formatted server display info text
 * @param server serverItem
 * @returns formatted server display info text
 */
export const getServerInfoDisplayText = (server: OnlineServerItem): string => {
    const mapId = server.map_id;

    const mapPathArr = mapId.split('/');

    const mapName = mapPathArr[mapPathArr.length - 1];

    const serverText = `${server.name}: ${
        server.current_players + '/' + server.max_players
    } (${mapName})\n`;

    return serverText;

    // const serverUrl = getJoinServerUrl(server);

    // const text = serverText + serverUrl + '\n' + '\n';

    // return text;
};

/**
 * Get formatted all server list display text
 * @param servers all server list
 * @returns formatted server display text
 */
export const getAllServerListDisplay = (
    servers: OnlineServerItem[]
): string => {
    let text = '';
    servers.forEach((s) => {
        text += getServerInfoDisplayText(s);
    });

    return text;
};

/**
 * Send Http request, get all server list with matchRegex filter
 * @param matchRegex server name match regex
 * @returns all server list
 */
export const queryAllServers = async (): Promise<OnlineServerItem[]> => {
    let start = 0;
    const size = 100;

    const totalServerList: OnlineServerItem[] = [];

    let parsedServerList: OnlineServerItem[] = [];

    try {
        do {
            const resString = await queryServersRaw({
                start,
                size,
                names: 1,
            });

            totalServerList.push(...parseServerListFromString(resString));
        } while (parsedServerList.length === size);

        if (MATCH_REGEX) {
            const regex = new RegExp(MATCH_REGEX);

            return totalServerList.filter((s) => {
                return regex.test(s.name);
            });
        }
    } catch (error) {
        logger.error('> queryAllServers error');
        logger.error(error);
    }

    return totalServerList;
};

/**
 * Get match query params server text
 * @param servers all server list
 * @param params query params
 * @returns match query params server list
 */
export const getQueryFilterServerList = (
    servers: OnlineServerItem[],
    params: {
        country: Nullable<string>;
    }
): OnlineServerItem[] => {
    const { country } = params;

    return servers.filter((s) => {
        if (country) {
            const inputCountry = country.toUpperCase();
            return s.country.toLocaleUpperCase().includes(inputCountry);
        }

        return true;
    });
};

/**
 * Get formatted combined user & server info to display text
 * @param user user name
 * @param server server info
 * @returns formatted display text
 */
const getUserInfoInServerDisplayText = (
    user: string,
    server: OnlineServerItem
): string => {
    const mapId = server.map_id;

    const mapPathArr = mapId.split('/');

    const mapName = mapPathArr[mapPathArr.length - 1];

    // const serverUrl = getJoinServerUrl(server);

    const infoText = `\`${user}\` 正在游玩 ${server.name}: ${
        server.current_players + '/' + server.max_players
    } (${mapName})\n`;

    // const text = infoText + serverUrl + '\n\n';

    return infoText;
};

/**
 * Get formatted user in server combined text
 * @param user user name in rwr
 * @param serverList all server list
 * @returns formatted user in server combined text
 */
export const getUserInServerListDisplay = (
    user: string,
    serverList: OnlineServerItem[]
): {
    text: string;
    count: number;
} => {
    let text = '';

    let count = 0;

    serverList.forEach((s) => {
        const playersList = getCorrectPlayersList(s);

        playersList.forEach((player) => {
            if (player.includes(user)) {
                count += 1;

                if (count >= QUERY_USER_IN_SERVERS_LIMIT) {
                    return;
                }

                text += getUserInfoInServerDisplayText(player, s);
            }
        });
    });

    return {
        text,
        count,
    };
};
