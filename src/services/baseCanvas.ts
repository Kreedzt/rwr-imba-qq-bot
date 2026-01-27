import * as fs from 'fs';
import * as path from 'path';
import { CanvasRenderingContext2D, Canvas } from 'canvas';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { GlobalEnv } from '../types';
import { CanvasImgService } from './canvasImg.service';

const getFooterText = (cost: number, endTime: dayjs.Dayjs) => {
    return (
        'RWR QQ Bot' +
        `(cost=${cost}ms, render time=${endTime.format('YYYY-MM-DD HH:mm:ss.SSS')})`
    );
};

const OUTPUT_FOLDER = 'out';

export const CN_REGEX = new RegExp('[\u4E00-\u9FA5]');

export class BaseCanvas {
    startTime?: Dayjs;

    totalFooter = '';
    renderStartY = 0;

    constructor() {}

    calcCanvasTextWidth(text: string, base: number): number {
        let countWidth = 0;
        for (let i = 0; i < text.length; ++i) {
            if (CN_REGEX.test(text[i])) {
                countWidth += base * 2;
            } else {
                countWidth += base;
            }
        }

        return countWidth;
    }

    renderBgImg(ctx: CanvasRenderingContext2D, width: number, height: number) {
        const path = (process.env as unknown as GlobalEnv).OUTPUT_BG_IMG;
        if (!path) {
            return;
        }
        const img = CanvasImgService.getInstance().getImg(path);
        if (!img) {
            return;
        }
        const imgWidth = img.width;
        const imgHeight = img.height;

        const widthRatio = width / imgWidth;
        const heightRatio = height / imgHeight;
        const scale = Math.min(widthRatio, heightRatio);

        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        // 添加半透明蒙层
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // 半透明黑色
        ctx.fillRect(0, 0, width, height); // 绘制蒙层
    }

    renderFooter(context: CanvasRenderingContext2D) {
        context.fillStyle = '#fff';
        context.font = 'bold 10pt Consolas';
        context.textAlign = 'left';
        const endTime = dayjs();

        const calcCost = endTime.diff(this.startTime);
        const footerText = getFooterText(calcCost, endTime);
        this.totalFooter = footerText;
        context.fillText(footerText, 10, this.renderStartY + 20);
    }

    record() {
        this.startTime = dayjs();
    }

    writeFile(canvas: Canvas, fileName: string) {
        const buffer = canvas.toBuffer('image/png', {
            compressionLevel: 3,
            filters: Canvas.PNG_FILTER_NONE,
        });

        if (!fs.existsSync(OUTPUT_FOLDER)) {
            fs.mkdirSync(OUTPUT_FOLDER);
        }

        const outputPath = path.join(
            process.cwd(),
            OUTPUT_FOLDER,
            `./${fileName}`
        );

        fs.writeFileSync(outputPath, buffer);

        return outputPath;
    }
}
