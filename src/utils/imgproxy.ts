import { logger } from './logger';

export const resizeImg = (
    url: string,
    width: number,
    height: number,
): string => {
    const IMGPROXY_URL = process.env.IMGPROXY_URL;

    if (!IMGPROXY_URL) {
        return url;
    }

    logger.info(`Resizing image: ${url} to ${width}x${height}`);

    const encoded = Buffer
    .from(url)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

    return `${IMGPROXY_URL}/sig/size:${width}:${height}/resizing_type:fit/${encoded}`;
};
