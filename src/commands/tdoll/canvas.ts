import { Canvas, createCanvas } from 'canvas';
import dayjs from 'dayjs';
import { ITDollSkinPrintData } from './types';

const OUTPUT_FOLDER = 'out';

const getCanvasOutput = (canvas: Canvas, outPath: string) => {
    const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE,
    });
};

export const printTDollSkinReply = (
    data: ITDollSkinPrintData,
    fileName: string
) => {
    const fnStartTime = dayjs();
};
