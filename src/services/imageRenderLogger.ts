import { logger } from '../utils/logger';
import { ImageRenderError } from './imageRenderErrors';

export function logImageRenderError(err: unknown) {
    if (err instanceof ImageRenderError) {
        logger.error(
            `image_render_error ${JSON.stringify({
                code: err.code,
                message: err.message,
                context: err.context,
                cause:
                    (err as any).cause instanceof Error
                        ? {
                              name: (err as any).cause.name,
                              message: (err as any).cause.message,
                              stack: (err as any).cause.stack,
                          }
                        : (err as any).cause,
            })}`,
        );
        return;
    }

    if (err instanceof Error) {
        logger.error(
            `image_render_error ${JSON.stringify({
                code: 'IMAGE_RENDER_FAILED',
                message: err.message,
                name: err.name,
                stack: err.stack,
            })}`,
        );
        return;
    }

    logger.error(
        `image_render_error ${JSON.stringify({
            code: 'IMAGE_RENDER_FAILED',
            message: String(err),
        })}`,
    );
}
