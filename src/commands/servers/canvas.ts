import { createCanvas } from "canvas";
import * as fs from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';

const OUTPUT_FOLDER = 'out';
const OUTPUT_FILE_NAME = 'servers-output.png';

export const printPng = (title: string, servers: string[]): string => {
    const fnStartTime = dayjs();

    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }


    let maxLengthStr = '';
    servers.forEach(s => {
        if (s.length > maxLengthStr.length) {
            maxLengthStr = s;
        }
    });

    const width = 20 + maxLengthStr.length * 14;
    const height = 120 + servers.length * 40;

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
    context.rect(10, nextStartY + 10, maxTextWidth + 20, servers.length * 40);
    context.stroke();


    servers.forEach((s) => {
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
    let footerText = 'RWR Imba QQ Bot' + `(build cost=${calcCost}ms)`;
    context.fillText(footerText, 10, nextStartY + 20);

    const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE
    });

    const outputPath = path.join(process.cwd(), OUTPUT_FOLDER, `./${OUTPUT_FILE_NAME}`);

    fs.writeFileSync(outputPath, buffer);

    return outputPath;
}

