import { FastifyInstance } from 'fastify';
import { logger } from './utils/logger';
import { ClickHouseService } from './services/clickHouse.service';

export async function gracefulShutdown(app: FastifyInstance, signal: string) {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    try {
        // 1. 停止接收新的请求
        await app.close();
        logger.info('Fastify server closed');

        // 2. 清理数据库连接
        if (process.env.CLICKHOUSE_DB) {
            await ClickHouseService.getInst().close();
            logger.info('ClickHouse connection closed');
        }

        // 3. 清理其他资源
        // 如果有其他需要清理的资源,在这里添加

        logger.info('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
}
