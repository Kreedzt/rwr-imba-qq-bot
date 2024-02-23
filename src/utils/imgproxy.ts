export const resizeImg = (url: string, width: number, height: number): string => {
    const IMGPROXY_URL = process.env.IMGPROXY_URL;

    if (!IMGPROXY_URL) {
        return url;
    }

    return `${IMGPROXY_URL}/sig/size:${width}:${height}/resizing_type:fit/${Buffer.from(url).toString('base64')}`;
}
