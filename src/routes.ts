import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { GlobalEnv } from './types';
import { PostgreSQLService } from './services/postgresql.service';
import { eventHandler } from './eventHandler';

export async function registerRoutes(app: FastifyInstance, env: GlobalEnv) {
    app.post('/in', async (req, res) => {
        const bodyData = req.body as any;
        res.send({
            status: 'ok',
        });
        eventHandler(env, bodyData);
    });

    app.get('/ping', async (req, res) => {
        res.send('pong!');
    });

    if (process.env.PG_DB) {
        app.get('/query_cmd', async (req, res) => {
            const data = await PostgreSQLService.getInst().queryCmd();

            const columns = [
                'cmd',
                'params',
                'group_id',
                'user_id',
                'received_time',
                'response_time',
                'elapse_time',
                'create_time',
            ];
            const rowData: string[][] = [];

            data.forEach((d) => {
                const dataRow: any[] = [];
                columns.forEach((col) => {
                    dataRow.push(d[col]);
                });
                rowData.push(dataRow);
            });

            const resData = [columns, ...rowData];

            res.send(resData);
        });
    }
}
