import { ClickHouseClient, createClient, ResultSet } from '@clickhouse/client';
import { logger } from '../utils/logger';

const CMD_ACCESS_TABLE = 'cmd_access_table';

const QUERY_CMD_ACCESS = `SELECT * FROM ${CMD_ACCESS_TABLE}`;

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
            query: sql ?? QUERY_CMD_ACCESS,
            format: 'JSONEachRow',
        });

        const jsonData = await queryRes.json<any>();

        logger.info('queryCmd OK', jsonData);

        return jsonData;
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

    static getInst() {
        if (!ClickHouseService.inst) {
            ClickHouseService.inst = new ClickHouseService();
        }
        return ClickHouseService.inst;
    }
}
