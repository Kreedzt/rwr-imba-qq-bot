import { ClickHouseClient, createClient, ResultSet } from '@clickhouse/client';

const CREATE_LOG_TABLE = 'CREATE TABLE IF NOT EXISTS';
const CREATE_CMD_TABLE = 'CREATE TABLE IF NOT EXISTS';
const CREATE_ACCESS_TABLE = 'CREATE TABLE IF NOT EXISTS';

export class ClickHouseService {
    static inst: ClickHouseService;

    client: ClickHouseClient;

    constructor() {
        this.client = createClient({
            url: `${process.env.CLICKHOUSE_HOST}`,
        });
    }

    async initTable() {
        // init talble...
        // await this.client.exec();
    }

    query(sql: string): Promise<ResultSet<'JSONEachRow'>> {
        return this.client.query({
            query: sql,
            format: 'JSONEachRow',
        });
    }

    static getInst() {
        return ClickHouseService.inst;
    }
}
