import { describe, expect, it } from 'vitest';
import { resizeImg } from './imgproxy';

describe('imgproxy', () => {
    it('should return correct for regular URL', () => {
        const originalUrl = process.env.IMGPROXY_URL;
        process.env.IMGPROXY_URL = 'https://imgproxy.example.com';

        try {
            const res = resizeImg(
                'https://www.gfwiki.org/images/6/68/Icon_No.394.png',
                200,
                200,
            );

            // Base64 URL-safe encoding: + -> -, / -> _, remove = padding
            expect(res).toBe(
                'https://imgproxy.example.com/sig/size:200:200/resizing_type:fit/aHR0cHM6Ly93d3cuZ2Z3aWtpLm9yZy9pbWFnZXMvNi82OC9JY29uX05vLjM5NC5wbmc',
            );
        } finally {
            process.env.IMGPROXY_URL = originalUrl;
        }
    });

    it('should handle URL with special characters that need base64 encoding', () => {
        const originalUrl = process.env.IMGPROXY_URL;
        process.env.IMGPROXY_URL = 'https://imgproxy.example.com';

        try {
            // URL with spaces (encoded as %20) and other special characters
            const urlWithSpecialChars =
                'https://example.com/path with spaces/image.png';
            const res = resizeImg(urlWithSpecialChars, 200, 200);

            // Verify it's a valid imgproxy URL with base64-encoded source
            expect(res).toMatch(
                /^https:\/\/imgproxy\.example\.com\/sig\/size:200:200\/resizing_type:fit\/[A-Za-z0-9_-]+$/,
            );
        } finally {
            process.env.IMGPROXY_URL = originalUrl;
        }
    });

    it('should return original URL when IMGPROXY_URL is not set', () => {
        const originalUrl = process.env.IMGPROXY_URL;
        delete process.env.IMGPROXY_URL;

        try {
            const url = 'https://example.com/image.png';
            const res = resizeImg(url, 200, 200);

            expect(res).toBe(url);
        } finally {
            if (originalUrl) {
                process.env.IMGPROXY_URL = originalUrl;
            }
        }
    });
});
