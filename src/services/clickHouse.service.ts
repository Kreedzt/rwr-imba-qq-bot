import { ClickHouseClient, createClient, ResultSet } from '@clickhouse/client';
import { logger } from '../utils/logger';

const CMD_ACCESS_TABLE = 'cmd_access_table';

const QUERY_CMD_ACCESS = `SELECT * FROM ${CMD_ACCESS_TABLE}`;

interface ICmdAccess {
    cmd: string;
    params: string;
    user_id: number;
    group_id: number;
    received_time: string;
    response_time: string;
    elapse_time: number;
    create_time: string;
}

export class ClickHouseService {
    static inst: ClickHouseService;

    client: ClickHouseClient;

    constructor() {
        this.client = createClient({
            url: `${process.env.CLICKHOUSE_HOST}`,
            database: process.env.CLICKHOUSE_DB,
            username: process.env.CLICKHOUSE_USER,
            password: process.env.CLICKHOUSE_PASSWORD,
        });
    }

    query(sql: string): Promise<ResultSet<'JSONEachRow'>> {
        return this.client.query({
            query: sql,
            format: 'JSONEachRow',
        });
    }

    async queryCmd(sql?: string) {
        logger.info('queryCmd', sql);
        const queryRes = await this.client.query({
            query: sql || QUERY_CMD_ACCESS,
            format: 'JSONEachRow',
        });

        const jsonData = await queryRes.json<ICmdAccess>();
        const res = jsonData.map((j) => {
            return {
                ...j,
                cmd: this.ignoreNullChar(j.cmd),
            };
        });

        logger.info('queryCmd OK', res);

        return res;
    }

    insertCmdData(data: {
        cmd: string;
        params: string;
        user_id: number;
        group_id: number;
        received_time?: Date;
        response_time?: Date;
        elapse_time: number;
    }) {
        logger.info('insertCmdData', data);
        const res = this.client.insert({
            table: CMD_ACCESS_TABLE,
            values: [data],
            clickhouse_settings: {
                date_time_input_format: 'best_effort',
            },
            format: 'JSONEachRow',
        });

        logger.info('insertCmdData OK');

        return res;
    }

    ignoreNullChar(str: string): string {
        const nullStart = str.indexOf('\x00');

        if (nullStart !== -1) {
            return str.slice(0, nullStart);
        }

        return str;
    }

    static getInst() {
        if (!ClickHouseService.inst) {
            ClickHouseService.inst = new ClickHouseService();
        }
        return ClickHouseService.inst;
    }
}
