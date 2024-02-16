import { createCanvas, registerFont } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';
import { calcCanvasTextWidth } from './utils';

const OUTPUT_FOLDER = 'out';

export const printPng = (
    title: string,
    content: string[],
    fileName: string
): string => {
    const fnStartTime = dayjs();

    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    const titleWidth = 11 * 28 + (title.length - 11) * 14;

    let maxLengthStr = '';
    content.forEach((s) => {
        if (s.length > maxLengthStr.length) {
            maxLengthStr = s;
        }
    });

    const contentOutputWidth = calcCanvasTextWidth(maxLengthStr, 14) + 20;

    const width = Math.max(titleWidth, contentOutputWidth);
    const height = 120 + content.length * 40;

    const canvas = createCanvas(width, height);

    const context = canvas.getContext('2d');

    /**
     * Layout
     */
    context.fillStyle = '#451a03';
    context.fillRect(0, 0, width, height);

    /**
     * Header
     */
    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    context.fillStyle = '#fff';
    context.fillText(title, 10, 10);

    /**
     * Content
     */
    let nextStartY = 10 + 40 + 10;

    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    /**
     * Render Rect first
     */
    const maxTextInfo = context.measureText(maxLengthStr);
    const maxTextWidth = maxTextInfo.width;
    context.strokeStyle = '#f48225';
    context.rect(10, nextStartY + 10, maxTextWidth + 20, content.length * 40);
    context.stroke();

    content.forEach((s) => {
        /**
         * Render server info text
         */
        context.fillStyle = '#fff';
        context.fillText(s, 20, 10 + nextStartY);

        nextStartY += 40;
    });

    /**
     * Footer
     */
    context.fillStyle = '#fff';
    context.font = 'bold 10pt Consolas';
    context.textAlign = 'left';
    const fnEndTime = dayjs();

    const calcCost = fnEndTime.diff(fnStartTime);
    let footerText =
        'RWR QQ Bot' +
        `(cost=${calcCost}ms, render time=${fnEndTime.format(
            'YYYY-MM-DD HH:mm:ss'
        )})`;
    context.fillText(footerText, 10, nextStartY + 20);

    const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE,
    });

    const outputPath = path.join(process.cwd(), OUTPUT_FOLDER, `./${fileName}`);

    fs.writeFileSync(outputPath, buffer);

    return outputPath;
};
